import type { Licitation } from "./Licitation.js";
import { Lot } from "./Lot.js";

export interface LotRepository {
  getByLicitation(licitation: Licitation): Promise<Lot[]>;
  create(lots: Lot[]): Promise<void>;
  saveLots(lots: Lot[]): Promise<void>;
}
