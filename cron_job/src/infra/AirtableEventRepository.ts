import type { AirtableBase } from "airtable/lib/airtable_base.js";
import { Event } from "../domain/Event.js";
import type { EventRepository } from "../domain/EventRepository.js";

export class AirtableEventRepository implements EventRepository {
  private base: AirtableBase;

  constructor(base: AirtableBase) {
    this.base = base;
  }

  async add(events: Event[]) {
    for (const e of events) {

      const lotData = e.lotId ? { "Lote": e.lotId } : {};

      await this.base("Eventos").create([
        {
          fields: {
            "Fecha de Creación": e.createdAt.toString(),
            "Tipo": e.type,
            "Licitación": [e.licitationId],
            ...lotData,
          },
        },
      ]);
    }
  }
}
