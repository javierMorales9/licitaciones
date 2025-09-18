import type { Party } from "./Party.js";

export interface PartyRepository {
  get(nif: string): Promise<Party | null>;
  create(org: Party): Promise<string>;
  save(party: Party): Promise<void>;
}
