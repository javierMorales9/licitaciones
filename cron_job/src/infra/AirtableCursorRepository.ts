import type { AirtableBase } from "airtable/lib/airtable_base.js";
import type { CursorRepository } from "../domain/CursorRepository.js";

export class AirtableCursorRepository implements CursorRepository {
  private base: AirtableBase;
  constructor(base: AirtableBase) {
    this.base = base;
  }

  async getLastCursor() {
    const records = await this.base("Cursor").select({
      sort: [{ field: 'Fecha Última Revisión', direction: "desc" }],
      maxRecords: 1,
    }).all();

    if (!records[0]?.fields) {
      return null;
    }

    const lastUpdate = records[0].fields['Fecha Última Revisión'];
    if (!lastUpdate)
      return null;

    return new Date(lastUpdate.toString());
  }

  async updateCursor(newLastExtracted: Date | null, entriesProcessed: number) {
    if (newLastExtracted) {
      await this.base("Cursor").create([
        {
          fields: {
            'Fecha Última Revisión': newLastExtracted.toString(),
            'Entradas procesadas': entriesProcessed,
          },
        },
      ]);
    }
  }
}
