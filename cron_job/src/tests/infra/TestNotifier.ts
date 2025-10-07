import type { Notifications } from "../../domain/Notifications.js";
import type { Notifier } from "../../domain/Notifier.js";

export class TestNotifier implements Notifier {
  constructor() { }

  async send(notif: Notifications) {
  }
}
