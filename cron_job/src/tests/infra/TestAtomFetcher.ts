import type { AtomFetcher } from "../../domain/AtomFetcher.js";

export class TestAtomFetcher implements AtomFetcher {
  private toReturn: string;

  constructor(toReturn: string) {
    this.toReturn = toReturn;
  }

  async fetch(url: string) {
    return this.toReturn;
  }
}
