import { Data } from "./data.type";

interface WebSocketConfig {
  url: string;
  allowSelfSignedSSLCertificates?: boolean;
  timeoutInterval?: number; // 默认 60 秒
  header?: { [key: string]: string };
}

interface CloseConfig {
  code?: number; // 参考 https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4
}

interface WebSocket {
  readonly readyState: number;
  open(): void;
  close(config?: CloseConfig): void;
  sendString(message: string): void;
  sendData(data: Data): void;
  ping(data?: Data): void;
  pong(data?: Data): void;
  listenOpen(callback: (socket: WebSocket) => void): void;
  listenClose(callback: (socket: WebSocket, code: number, reason: string) => void): void;
  listenError(callback: (socket: WebSocket, error: { code: number, message: string, type: string }) => void): void;
  listenReceiveString(callback: (socket: WebSocket, message: string) => void): void;
  listenReceiveData(callback: (socket: WebSocket, data: Data) => void): void;
  listenReceivePing(callback: (socket: WebSocket, data: Data) => void): void;
  listenReceivePong(callback: (socket: WebSocket, data: Data) => void): void;
}

export interface WebSocketConstructor {
  new(config: WebSocketConfig): WebSocket;
}