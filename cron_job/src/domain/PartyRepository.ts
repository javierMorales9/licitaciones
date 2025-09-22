import type { Party } from "./Party.ts";

export interface PartyRepository {
  get(nif: string): Promise<Party | null>;
  create(org: Party): Promise<string>;
  save(party: Party): Promise<void>;
}
