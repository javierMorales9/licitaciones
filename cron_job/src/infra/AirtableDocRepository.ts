import type { AirtableBase } from "airtable/lib/airtable_base.js";
import { Doc } from "../domain/Doc.js";
import type { DocRepository } from "../domain/DocRepository.js";
import type { Licitation } from "../domain/Licitation.js";

export class AirtableDocRepository implements DocRepository {
  private base: AirtableBase;

  constructor(base: AirtableBase) {
    this.base = base
  }

  async get(lic: Licitation): Promise<Doc[]> {
    const records = await this.base("Documentos Licitación")
      .select({
        filterByFormula: `{Licitación} = "${lic.entry_id}"`,
      })
      .all();

    return records.map((rec) => {
      const f = rec.fields;
      return Doc.fromDb({
        id: rec.id,
        docId: f["ID Documento"] as string,
        licitationId: f["Licitación"] as string,
        name: (f["Nombre"] as string) ?? "",
        url: (f["URL Documento"] as string) ?? "",
        type: f["Tipo de Documento"] as string | undefined,
      });
    });
  }

  async create(docs: Doc[]) {
    for (const d of docs) {
      await this.base("Documentos Licitación").create([
        {
          fields: {
            "ID Documento": d.docId,
            "Nombre": d.name,
            "Licitación": [d.licitationId],
            "URL Documento": d.url,
            "Tipo de Documento": d.type,
          },
        },
      ]);
    }
  }

  async saveDocs(docs: Doc[]) {
    for (const d of docs) {
      if (!d.id) continue;

      await this.base("Documentos Licitación").update([
        {
          id: d.id,
          fields: {
            "Nombre": d.name,
            "URL Documento": d.url,
          },
        },
      ]);
    }
  }
}
