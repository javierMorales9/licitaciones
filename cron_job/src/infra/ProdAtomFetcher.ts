import type { AtomFetcher } from "../domain/AtomFetcher.ts";

export class ProdAtomFetcher implements AtomFetcher {
  async fetch(url: string) {
    const res = await fetch(url, {
      method: 'GET',
    });
    const data = await res.text();

    return data;
  }
}
