import { Party } from "../../domain/Party.js";
import type { PartyRepository } from "../../domain/PartyRepository.js";

export class TestPartyRepository implements PartyRepository {
  private partyToReturn: Party | null;
  private createdObject: Party | null;

  constructor(partyToReturn: Party | null) {
    this.partyToReturn = partyToReturn;
    this.createdObject = null;
  }

  async get(nif: string): Promise<Party | null> {
    return this.partyToReturn;
  }

  async create(org: Party) {
    this.createdObject = org;
    return "1234";
  }

  async save(party: Party) {

  }

  getCreateCall() {
    return this.createdObject;
  }
}
