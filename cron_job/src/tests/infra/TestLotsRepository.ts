import { Lot } from "../../domain/Lot.js";
import type { LotRepository } from "../../domain/LotRepository.js";

export class TestLotsRepository implements LotRepository {
  private lotsToReturn: Lot[];
  private createArgs: Lot[];
  private saveArgs: Lot[];

  constructor(lotsToReturn: Lot[]) {
    this.lotsToReturn = lotsToReturn;
    this.createArgs = [];
    this.saveArgs = [];
  }

  async getByLicitation(licitationId: string): Promise<Lot[]> {
    return this.lotsToReturn;
  }

  async create(lots: Lot[]) {
    this.createArgs = lots;
  }

  async saveLots(lots: Lot[]) {
    this.saveArgs = lots;
  }

  getCreateArgs() {
    return this.createArgs;
  }

  getSaveArgs() {
    return this.saveArgs;
  }
}
