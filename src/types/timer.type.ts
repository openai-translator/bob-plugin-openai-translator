
interface TimerScheduleOptions {
  interval: number;
  repeats: boolean;
  handler: () => void;
}

export interface Timer {
  schedule(options: TimerScheduleOptions): number;
  invalidate(timerId: number): void;
}