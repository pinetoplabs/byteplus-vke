import * as crypto from 'crypto';
import type { BytePlusAPIRequestInfo, BytePlusCredentialsConfig } from '../types'

interface SignerOptions {
  bodySha256?: string;
}

// Constants matching the official implementation
const constant = {
  algorithm: "HMAC-SHA256",
  v4Identifier: "request",
  dateHeader: "X-Date",
  tokenHeader: "X-Security-Token",
  contentSha256Header: "X-Content-Sha256",
  notSignBody: "X-NotSignBody",
  kDatePrefix: "",
  credential: "X-Credential",
  algorithmKey: "X-Algorithm",
  signHeadersKey: "X-SignedHeaders",
  signQueriesKey: "X-SignedQueries",
  signatureKey: "X-Signature",
};

const unsignableHeaders = [
  "authorization",
  "content-type",
  "content-length",
  "user-agent",
  "presigned-expires",
  "expect",
];

export class Signer {
  private request: BytePlusAPIRequestInfo;
  private serviceName: string;
  private bodySha256?: string;

  constructor(request: BytePlusAPIRequestInfo, serviceName: string, options?: SignerOptions) {
    this.request = request;
    this.request.headers = request.headers || {};
    this.serviceName = serviceName;
    this.bodySha256 = options?.bodySha256;
    this.request.params = this.sortParams(this.request.params);
  }

  /**
   * URI encode following the official implementation
   */
  private uriEscape(str: string): string {
    try {
      return encodeURIComponent(str)
        .replace(/[^A-Za-z0-9_.~\-%]+/g, escape)
        .replace(/[*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
    } catch (e) {
      return "";
    }
  }

  /**
   * Convert query params to string
   */
  private queryParamsToString(params: Record<string, any>): string {
    return Object.keys(params)
      .map((key) => {
        const val = params[key];
        if (typeof val === "undefined" || val === null) {
          return;
        }

        const escapedKey = this.uriEscape(key);
        if (!escapedKey) {
          return;
        }

        if (Array.isArray(val)) {
          return `${escapedKey}=${val.map(v => this.uriEscape(v)).sort().join(`&${escapedKey}=`)}`;
        }

        return `${escapedKey}=${this.uriEscape(val)}`;
      })
      .filter((v) => v)
      .join("&");
  }

  /**
   * Sort params by key
   */
  private sortParams(params: Record<string, any>): Record<string, any> {
    const newParams: Record<string, any> = {};
    if (params) {
      Object.keys(params)
        .filter((key) => {
          const value = params[key];
          return typeof value !== "undefined" && value !== null;
        })
        .sort()
        .map((key) => {
          newParams[key] = params[key];
        });
    }
    return newParams;
  }

  /**
   * Add authorization to request
   */
  public addAuthorization(credentials: BytePlusCredentialsConfig, date?: Date): void {
    const datetime = this.getDateTime(date);
    this.addHeaders(credentials, datetime);
    this.request.headers["Authorization"] = this.authorization(credentials, datetime);
  }

  /**
   * Build authorization header
   */
  private authorization(credentials: BytePlusCredentialsConfig, datetime: string): string {
    const parts: string[] = [];
    const credString = this.credentialString(datetime);
    parts.push(`${constant.algorithm} Credential=${credentials.accessKeyId}/${credString}`);
    parts.push(`SignedHeaders=${this.signedHeaders()}`);
    parts.push(`Signature=${this.signature(credentials, datetime)}`);
    return parts.join(", ");
  }

  /**
   * Get ISO8601 datetime
   */
  private getDateTime(date?: Date): string {
    return this.iso8601(date).replace(/[:\-]|\.\d{3}/g, "");
  }

  /**
   * Add required headers
   */
  private addHeaders(credentials: BytePlusCredentialsConfig, datetime: string): void {
    this.request.headers[constant.dateHeader] = datetime;
    if (credentials.sessionToken) {
      this.request.headers[constant.tokenHeader] = credentials.sessionToken;
    }
    if (this.request.body) {
      let body = this.request.body;
      if (typeof body !== "string") {
        if (body instanceof URLSearchParams) {
          body = body.toString();
        } else if (Buffer.isBuffer(body)) {
          // body is already a buffer
        } else {
          body = JSON.stringify(body);
        }
      }
      this.request.headers[constant.contentSha256Header] =
        this.bodySha256 || this.sha256(body);
    }
  }

  /**
   * Calculate signature
   */
  private signature(credentials: BytePlusCredentialsConfig, datetime: string): string {
    const signingKey = this.getSigningKey(
      credentials,
      datetime.substr(0, 8),
      this.request.region,
      this.serviceName
    );
    return this.hmacHex(signingKey, this.stringToSign(datetime));
  }

  /**
   * Build string to sign
   */
  private stringToSign(datetime: string): string {
    const parts: string[] = [];
    parts.push(constant.algorithm);
    parts.push(datetime);
    parts.push(this.credentialString(datetime));
    parts.push(this.sha256(this.canonicalString()));
    const result = parts.join("\n");
    return result;
  }

  /**
   * Build canonical string
   */
  private canonicalString(): string {
    const parts: string[] = [];
    const pathname = this.request.pathname || "/";

    parts.push(this.request.method.toUpperCase());
    parts.push(pathname);
    const queryString = this.queryParamsToString(this.request.params) || "";
    parts.push(queryString);
    parts.push(`${this.canonicalHeaders()}\n`);
    parts.push(this.signedHeaders());
    parts.push(this.hexEncodedBodyHash());
    const result = parts.join("\n");
    return result;
  }

  /**
   * Build canonical headers
   */
  private canonicalHeaders(): string {
    const headers: [string, string][] = [];
    Object.keys(this.request.headers).forEach((key) => {
      headers.push([key, this.request.headers[key]]);
    });
    headers.sort((a, b) => (a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1));
    const parts: string[] = [];
    headers.forEach((item) => {
      const key = item[0].toLowerCase();
      if (this.isSignableHeader(key)) {
        const value = item[1];
        if (
          typeof value === "undefined" ||
          value === null ||
          typeof value.toString !== "function"
        ) {
          throw new Error(`Header ${key} contains invalid value`);
        }
        parts.push(`${key}:${this.canonicalHeaderValues(value.toString())}`);
      }
    });
    return parts.join("\n");
  }

  /**
   * Normalize header values
   */
  private canonicalHeaderValues(values: string): string {
    return values.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  /**
   * Get signed headers
   */
  private signedHeaders(): string {
    const keys: string[] = [];
    Object.keys(this.request.headers).forEach((key) => {
      key = key.toLowerCase();
      if (this.isSignableHeader(key)) {
        keys.push(key);
      }
    });
    return keys.sort().join(";");
  }

  /**
   * Build credential string
   */
  private credentialString(datetime: string): string {
    return this.createScope(datetime.substr(0, 8), this.request.region, this.serviceName);
  }

  /**
   * Get body hash
   */
  private hexEncodedBodyHash(): string {
    if (this.request.headers[constant.contentSha256Header]) {
      return this.request.headers[constant.contentSha256Header];
    }

    if (this.request.body) {
      return this.sha256(this.queryParamsToString(this.request.body));
    }
    return this.sha256("");
  }

  /**
   * Check if header is signable
   */
  private isSignableHeader(key: string): boolean {
    return unsignableHeaders.indexOf(key) < 0;
  }

  /**
   * Get ISO8601 date
   */
  private iso8601(date?: Date): string {
    if (date === undefined) {
      date = new Date();
    }
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
  }

  /**
   * Get signing key
   */
  private getSigningKey(
    credentials: BytePlusCredentialsConfig,
    date: string,
    region: string,
    service: string
  ): Buffer {
    const kDate = this.hmac(`${constant.kDatePrefix}${credentials.secretAccessKey}`, date);
    const kRegion = this.hmac(kDate, region);
    const kService = this.hmac(kRegion, service);
    return this.hmac(kService, constant.v4Identifier);
  }

  /**
   * Create scope
   */
  private createScope(date: string, region: string, serviceName: string): string {
    return [date.substr(0, 8), region, serviceName, constant.v4Identifier].join("/");
  }

  /**
   * HMAC function
   */
  private hmac(key: string | Buffer, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
  }

  /**
   * HMAC with hex output
   */
  private hmacHex(key: string | Buffer, data: string): string {
    return crypto.createHmac('sha256', key).update(data, 'utf8').digest('hex');
  }

  /**
   * SHA256 hash
   */
  private sha256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}