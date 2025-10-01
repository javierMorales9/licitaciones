import type { ParsedDocRef } from "../feedParser.js";

export class Doc {
  id?: string | undefined;
  docId: string;
  licitationId: string;
  name: string;
  url: string;
  type?: string;

  constructor(args: {
    id?: string;
    docId: string;
    licitationId: string;
    name: string;
    url: string;
    type?: string
  }) {
    this.id = args.id;
    this.docId = args.docId;
    this.licitationId = args.licitationId;
    this.name = args.name;
    this.url = args.url;
    this.type = args.type;
  }

  static fromParsed(d: {
    docId: string;
    name: string;
    url: string;
    type?: string
  }, licitationId: string): Doc {
    return new Doc({
      name: d.name,
      docId: d.docId,
      licitationId,
      url: d.url,
      type: d.type,
    });
  }

  static fromDb(row: {
    id?: string;
    docId: string;
    licitationId: string;
    name?: string;
    url?: string;
    type?: string
  }): Doc {
    return new Doc({
      id: row.id,
      docId: row.docId,
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

