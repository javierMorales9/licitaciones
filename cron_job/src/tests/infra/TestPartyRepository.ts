import { Party } from "../../domain/Party.js";
import type { PartyRepository } from "../../domain/PartyRepository.js";

export class TestPartyRepository implements PartyRepository {
  private partyToReturn: Party | null;
  private createArgs: Party | null;
  private saveArgs: Party | null;

  constructor(partyToReturn: Party | null) {
    this.partyToReturn = partyToReturn;
    this.createArgs = null;
    this.saveArgs = null;
  }

  async get(nif: string): Promise<Party | null> {
    return this.partyToReturn;
  }

  async create(org: Party) {
    this.createArgs = org;
    return "1234";
  }

  async save(party: Party) {
    this.saveArgs = party;
  }

  getCreateArgs() {
    return this.createArgs;
  }

  getSaveArgs() {
    return this.saveArgs;
  }
}
