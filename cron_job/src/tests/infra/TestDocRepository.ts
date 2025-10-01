import { Doc } from "../../domain/Doc.js";
import type { DocRepository } from "../../domain/DocRepository.js";

export class TestDocRepository implements DocRepository {
  private docs: Doc[];

  constructor(docs: Doc[]) {
    this.docs = docs;
  }

  async get(licId: Licitation): Promise<Doc[]> {
    return this.docs;
  }

  async create(docs: Doc[]) {

  }

  async saveDocs(docs: Doc[]) {

  }
}
