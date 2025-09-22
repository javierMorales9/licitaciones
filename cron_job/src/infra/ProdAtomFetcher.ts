import type { AtomFetcher } from "../domain/AtomFetcher.js";

export class ProdAtomFetcher implements AtomFetcher {
  async fetch(url: string) {
    const res = await fetch(url, {
      method: 'GET',
    });
    const data = await res.text();

    return data;
  }
}
