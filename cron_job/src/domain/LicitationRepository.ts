import { Licitation } from "./Licitation.js";

export interface LicitationRepository {
  get(id: string): Promise<Licitation | null>;
  create(lic: Licitation): Promise<string>;
  save(lic: Licitation): Promise<void>;
}
