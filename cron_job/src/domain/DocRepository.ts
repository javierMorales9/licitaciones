import { Doc } from "./Doc.js";

export interface DocRepository {
  get(licId: string): Promise<Doc[]>;
  create(docs: Doc[]): Promise<void>;
  saveDocs(docs: Doc[]): Promise<void>;
}
