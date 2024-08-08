import { HttpErrorCode } from "../const";
import { Data } from "./data.type";
import { Signal } from "./signal.type";

type HttpMethod =
  | 'GET'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'POST'
  | 'PUT';

interface HttpRequestFiles {
  data: Data; // Binary data
  name: string; // Name in the upload form
  filename: string; // Filename after upload
  contentType: string; // File format
}

interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  header?: Record<string, string>;
  body?: Record<string, any> | Data;
  files?: HttpRequestFiles[];
  timeout?: number; // Timeout in milliseconds
  cancelSignal?: Signal;
  handler?: (response: HttpResponse) => void;
}

interface HttpStream {
  text?: string;
  rawData: Data;
}

interface HttpStreamRequestConfig extends HttpRequestConfig {
  streamHandler?: (stream: HttpStream) => void;
}

/**
 * @deprecated Bob 1.8.0 之前的结构
 */
interface LegacyHttpResponseError {
  domain: string;
  code: number;
  userInfo: any;
  localizedDescription: string;
  localizedFailureReason: string;
  localizedRecoverySuggestion: string;
}

interface HttpResponseError {
  message: string;
  debugMessage: string;
}

interface HttpResponseInfo {
  url: string; // url
  MIMEType: string; // MIME 类型
  expectedContentLength: number; // 长度
  textEncodingName: string; // 编码
  suggestedFilename: string; // 建议的文件名
  statusCode: HttpErrorCode; // HTTP 状态码
  headers: Record<string, string>; // HTTP header
}

export interface HttpResponse<T = Record<string, any>> {
  data: T | string | Data;
  rawData: Data;
  response: HttpResponseInfo;
  error?: HttpResponseError | LegacyHttpResponseError;
}

type HttpResponsePromise<T = any> = Promise<HttpResponse<T>>;

export interface Http {
  request<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
  /**
   * @deprecated The method should not be used
   */
  get<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
  /**
   * @deprecated The method should not be used
   */
  post<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
  streamRequest<T = any, R = HttpResponsePromise<T>>(config: HttpStreamRequestConfig): Promise<R>;
}
