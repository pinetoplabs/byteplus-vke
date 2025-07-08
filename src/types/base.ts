interface AxiosOptions {
  maxContentLength?: number;
  maxBodyLength?: number;    
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream' | 'formdata'  
}

export interface BytePlusClientOptions {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  host?: string;
  headers?: Record<string, string>;
  service: string;
  version: string;
  axiosOptions?: AxiosOptions | {};
}

export interface BytePlusAPIRequestInfo {
  region: string;
  method: string;
  pathname: string;
  params: Record<string, any>;
  body?: any;
  headers: Record<string, any>;
}

export interface BytePlusAPIErrorResponse {
  ResponseMetadata?: {
    Error?: {
      Message?: string;
      Code?: string;
    };
    RequestId?: string;
  };
}

export interface BytePlusAPIResponse<T = any> {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
  };
  Result: T;
}

export interface BytePlusCredentialsConfig {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly sessionToken?: string;
}