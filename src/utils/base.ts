import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { Signer } from '../security/index.ts'
import type { BytePlusClientOptions, BytePlusAPIRequestInfo, BytePlusAPIErrorResponse, BytePlusAPIResponse, BytePlusCredentialsConfig } from "../types/index.ts";

export class BytePlusServiceClient {
  protected instance: AxiosInstance;
  protected service: string;
  protected version: string;
  protected region: string;
  protected host: string;
  protected credentials: BytePlusCredentialsConfig;

  constructor(options: BytePlusClientOptions) {
    this.service = options.service;
    this.version = options.version;
    this.region = options.region || "ap-southeast-1";
    this.host = options.host || "open.volcengineapi.com";
    this.credentials = options.credentials
    this.instance = this.createAxiosInstance(options);
  }

  private createAxiosInstance(options: BytePlusClientOptions): AxiosInstance {
    const {
      headers
    } = options;
    
    const baseURL = `https://${this.host}`;

    const instance = axios.create({
      baseURL,
      method: "POST",
      params: { Version: this.version },
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...options.axiosOptions
    });

    // Request interceptor for signing
    instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const requestInfo: BytePlusAPIRequestInfo = {
        region: this.region,
        method: config.method || "POST",
        pathname: "/",
        params: config.params || {},
        body: config.data,
        headers: config.headers || {},
      };

      const signer = new Signer(requestInfo, this.service);

      signer.addAuthorization({
        ...this.credentials
      })

      return config;
    });

    // Response interceptor for error handling
    instance.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      (error: AxiosError<BytePlusAPIErrorResponse>) => {
        const errorData = error?.response?.data;
        const errorMetadata = errorData?.ResponseMetadata;
        
        const errorInfo = {
          message: errorMetadata?.Error?.Message || "Unknown error",
          code: errorMetadata?.Error?.Code,
          requestId: errorMetadata?.RequestId,
          statusCode: error?.response?.status,
        };

        console.error("Error in BytePlus request:", errorInfo, errorData?.ResponseMetadata);
        
        return Promise.reject(errorInfo);
      }
    );

    return instance;
  }

  async request<T = any>(action: string, params: Record<string, any> = {}): Promise<BytePlusAPIResponse<T>> {
    try {
      return await this.instance.request({
        data: params,
        params: { Action: action }
      });
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      throw error;
    }
  }
}
