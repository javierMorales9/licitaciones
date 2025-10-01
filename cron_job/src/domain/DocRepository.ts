import { Doc } from "./Doc.js";
import { Licitation } from "./Licitation.js";

export interface DocRepository {
  get(lic: Licitation): Promise<Doc[]>;
  create(docs: Doc[]): Promise<void>;
  saveDocs(docs: Doc[]): Promise<void>;
}
