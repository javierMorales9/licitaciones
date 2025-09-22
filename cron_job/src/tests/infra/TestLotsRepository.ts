import { Lot } from "../../domain/Lot.js";
import type { LotRepository } from "../../domain/LotRepository.js";

export class TestLotsRepository implements LotRepository {
  private lotsToReturn: Lot[];

  constructor(lotsToReturn: Lot[]) {
    this.lotsToReturn = lotsToReturn;
  }

  async getByLicitation(licitationId: string): Promise<Lot[]> {
    return this.lotsToReturn;
  }

  async create(lots: Lot[]) {

  }

  async saveLots(lots: Lot[]) {

  }
}
