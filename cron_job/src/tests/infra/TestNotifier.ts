import type { Notifications } from "../../domain/Notifications.js";
import type { Notifier } from "../../domain/Notifier.js";

export class TestNotifier implements Notifier {
  private notif: Notifications;

  constructor(notif: Notifications) {
    this.notif = notif;
  }

  async send() {

  }
}
