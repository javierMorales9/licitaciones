import { Licitation } from "../../domain/Licitation.js";
import type { LicitationRepository } from "../../domain/LicitationRepository.js";

export class TestLicitationRepository implements LicitationRepository {
  private licitationToReturn: Licitation | null;

  constructor(licitationToReturn: Licitation | null) {
    this.licitationToReturn = licitationToReturn;
  }

  async get(id: string): Promise<Licitation | null> {
    return this.licitationToReturn;
  }

  async create(lic: Licitation) {
    return '1234';
  }

  async save(lic: Licitation) {

  }
}
