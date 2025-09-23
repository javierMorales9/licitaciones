import { Licitation } from "../../domain/Licitation.js";
import type { LicitationRepository } from "../../domain/LicitationRepository.js";

export class TestLicitationRepository implements LicitationRepository {
  private licitationToReturn: Licitation | null;
  private createArg: Licitation | null;
  private saveArg: Licitation | null;

  constructor(licitationToReturn: Licitation | null) {
    this.licitationToReturn = licitationToReturn;
    this.createArg = null;
    this.saveArg = null;
  }

  async get(id: string): Promise<Licitation | null> {
    return this.licitationToReturn;
  }

  async create(lic: Licitation) {
    this.createArg = lic;
    return '1234';
  }

  async save(lic: Licitation) {
    this.saveArg = lic;
  }

  getCreateArgs() {
    return this.createArg;
  }

  getSaveArgs() {
    return this.saveArg;
  }
}
