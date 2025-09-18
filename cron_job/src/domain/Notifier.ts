export interface Notifier {
  send(): Promise<void>;
}
