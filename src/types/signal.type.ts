interface Disposable {
  dispose(): void;
}

export interface Signal {
  send(data?: any): void;
  subscribe(callback: (data: any) => void): Disposable;
  removeAllSubscriber(): void;
}

export interface SignalConstructor {
  new(): Signal;
}
