
export interface AtomFetcher {
  fetch(url: string): Promise<string>;
}
