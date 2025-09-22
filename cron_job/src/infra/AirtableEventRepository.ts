import type { AirtableBase } from "airtable/lib/airtable_base.ts";
import { Event } from "../domain/Event.ts";
import type { EventRepository } from "../domain/EventRepository.ts";

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
