import type { ParsedDocRef } from "../feedParser.ts";

export class Doc {
  id?: string | undefined;
  licitationId: string;
  name: string;
  url: string;
  type?: string;

  constructor(args: { id?: string; licitationId: string; name: string; url: string; type?: string }) {
    this.id = args.id;
    this.licitationId = args.licitationId;
    this.name = args.name;
    this.url = args.url;
    this.type = args.type;
  }

  static fromParsed(d: { name: string; url: string; type?: string }, licitationId: string): Doc {
    return new Doc({
      name: d.name,
      licitationId,
      url: d.url,
      type: d.type,
    });
  }

  static fromDb(row: { id?: string; licitationId: string, name?: string; url?: string; type?: string }): Doc {
    return new Doc({
      id: row.id,
      licitationId: row.licitationId,
      name: row.name ?? "",
      url: row.url ?? "",
      type: row.type,
    });
  }

  update(newData: Partial<ParsedDocRef>): void {
    for (const [key, value] of Object.entries(newData)) {
      if (value !== undefined && value !== null) {
        (this as any)[key] = value;
      }
    }
  }
}

