type BobHttpResponse = import('./types').BobHttpResponse;

type HttpMethod =
  | 'GET'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'POST'
  | 'PUT';

interface DataObject {
  // Define the shape of the data object if known
}

interface HttpRequestFiles {
  data: DataObject; // Binary data
  name: string; // Name in the upload form
  filename: string; // Filename after upload
  contentType: string; // File format
}

interface HttpRequestConfig {
  url: string;
  method?: HttpMethod;
  header?: Record<string, string>; // Define as a record for headers
  params?: Record<string, any>; // Define as a record for query parameters
  body?: any; // Specify a more detailed type if possible
  files?: HttpRequestFiles;
  handler?: (resp: BobHttpResponse) => void;
  timeout?: number; // Timeout in milliseconds
}

interface HttpStreamRequestConfig extends HttpRequestConfig {
  cancelSignal?: Signal; // AbortSignal if using the Fetch API
  streamHandler?: (stream: { text: string; rawData: DataObject }) => void;
}

type HttpResponsePromise<T = any> = Promise<BobHttpResponse<T>>;

interface Http {
  request<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
  get<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
  post<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
  streamRequest<T = any, R = HttpResponsePromise<T>>(config: HttpStreamRequestConfig): Promise<R>;
}

declare const $http: Http;

interface Options {
  apiKeys: string;
  apiUrl: string;
  apiVersion: string;
  customModel: string;
  customSystemPrompt: string;
  customUserPrompt: string;
  deploymentName: string;
  model: string;
  stream: string;
  temperature: string;
}

declare const $option: Options;