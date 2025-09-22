import { Doc } from "./Doc.ts";

export interface DocRepository {
  get(licId: string): Promise<Doc[]>;
  create(docs: Doc[]): Promise<void>;
  saveDocs(docs: Doc[]): Promise<void>;
}
