import { Doc } from "../../domain/Doc.js";
import type { DocRepository } from "../../domain/DocRepository.js";
import { Licitation } from "../../domain/Licitation.js";

export class TestDocRepository implements DocRepository {
  private docs: Doc[];
  private docArgs: Doc[];
  private saveArgs: Doc[];

  constructor(docs: Doc[]) {
    this.docs = docs;
  }

  async get(licId: Licitation): Promise<Doc[]> {
    return this.docs;
  }

  async create(docs: Doc[]) {
    this.docArgs = docs;
  }

  getCreateArgs() {
    return this.docArgs;
  }

  async saveDocs(docs: Doc[]) {
    this.saveArgs = docs;
  }

  getSaveArgs() {
    return this.saveArgs;
  }
}
