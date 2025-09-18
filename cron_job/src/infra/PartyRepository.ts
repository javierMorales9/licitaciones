import type { AirtableBase } from "airtable/lib/airtable_base.js";
import { Party } from "../domain/Party.js";

export class PartyRepository {
  private base: AirtableBase;

  constructor(base: AirtableBase) {
    this.base = base
  }

  async get(nif: string): Promise<Party | null> {
    const records = await this.base("Organismos")
      .select({
        // Coincidencia exacta por NIF (mismo nombre de campo que en save)
        filterByFormula: `{NIF} = "${nif}"`,
        maxRecords: 1,
      })
      .all();

    const rec = records[0];
    const f = rec?.fields;
    if (!f) return null;

    return Party.fromDb({
      id: rec.id,
      nif: (f["NIF"] as string) ?? "",
      updated: (f["Última modificación"] ?? "") as string,
      profile_url: f["Perfil Contratante URL"] as string | undefined,
      website: f["Website"] as string | undefined,
      dir3: f["DIR3"] as string | undefined,
      name: f["Nombre Organismo"] as string | undefined,
      address: f["Dirección"] as string | undefined,
      zip: f["Código Postal"] != null ? String(f["Código Postal"]) : undefined,
      city: f["Ciudad"] as string | undefined,
      country: f["País"] as string | undefined,
      countryCode: f["País Código"] as string | undefined,
      phone: f["Teléfono"] != null ? String(f["Teléfono"]) : undefined,
      email: f["Email"] as string | undefined,
    });
  }

  async create(org: Party) {
    const result = await this.base("Organismos").create([
      {
        fields: {
          'Nombre Organismo': org.name,
          'NIF': org.nif,
          'DIR3': org.dir3,
          'Perfil Contratante URL': org.profile_url,
          ...this.createEditableObject(org),
        },
      },
    ]);

    return result[0]?.id ?? "";
  }

  async save(party: Party) {
    if (!party.id) return;

    await this.base("Organismos").update([
      {
        id: party.id,
        fields: this.createEditableObject(party),
      },
    ]);
  }

  createEditableObject(org: Party) {
    return {
      'Website': org.website,
      'Dirección': org.address,
      'Código Postal': org.zip,
      'Ciudad': org.city,
      'País': org.country,
      'País Código': org.countryCode,
      'Teléfono': org.phone,
      'Email': org.email,
    };
  }
}

