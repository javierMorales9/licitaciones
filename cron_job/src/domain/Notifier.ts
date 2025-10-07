import type { Notifications } from "./Notifications.js";

export interface Notifier {
  send(notifications: Notifications): Promise<void>;
}
