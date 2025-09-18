export interface CursorRepository {
  getLastCursor(): Promise<Date | null>;
  updateCursor(newLastExtracted: Date | null, entriesProcessed: number): Promise<void>;
}
