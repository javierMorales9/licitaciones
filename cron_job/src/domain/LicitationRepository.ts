import { Licitation } from "./Licitation.ts";

export interface LicitationRepository {
  get(id: string): Promise<Licitation | null>;
  create(lic: Licitation): Promise<string>;
  save(lic: Licitation): Promise<void>;
}
