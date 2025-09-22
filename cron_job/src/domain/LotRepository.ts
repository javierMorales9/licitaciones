import { Lot } from "./Lot.js";

export interface LotRepository {
  getByLicitation(licitationId: string): Promise<Lot[]>;
  create(lots: Lot[]): Promise<void>;
  saveLots(lots: Lot[]): Promise<void>;
}
