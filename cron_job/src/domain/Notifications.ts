import type { Event } from "../domain/Event.js";
import type { Licitation } from "../domain/Licitation.js";
import type { Lot } from "../domain/Lot.js";

export class Notifications {
  private notifications: {
    [key: string]: {
      licitationId: string;
      licitationExternalId: string;
      licitationPlatformUrl?: string;
      licitationStatusCode?: string;
      licitationTitle?: string;
      events: {
        type: string;
        lotId?: string;
        lotLotId?: string;
        lotName?: string;
      }[];
    }
  }

  constructor() {
    this.notifications = {};
  }

  add(e: Event, licitation: Licitation, lot?: Lot) {
    const key = licitation.entry_id;
    const n = this.notifications[key];
    if (!n) {
      this.notifications[key] = {
        licitationId: e.licitationId,
        licitationExternalId: licitation.entry_id,
        licitationPlatformUrl: licitation.platform_url,
        licitationStatusCode: licitation.statusCode,
        licitationTitle: licitation.title,
        events: [{ type: e.type, lotId: lot?.id, lotLotId: lot?.lot_id?.toString(), lotName: lot?.name }],
      };
    } else {
      n.events.push({ type: e.type, lotId: lot?.id, lotLotId: lot?.lot_id?.toString(), lotName: lot?.name });
    }
  }

  toArray() {
    return Object.values(this.notifications);
  }
}
