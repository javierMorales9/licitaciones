import type { CursorRepository } from "../../domain/CursorRepository.js";

export class TestCursorRepository implements CursorRepository {
  private lastCursorDate: Date;

  constructor(lastCursorDate: Date) {
    this.lastCursorDate = lastCursorDate;
  }

  async getLastCursor() {
    return this.lastCursorDate;
  }

  async updateCursor(newLastExtracted: Date | null, entriesProcessed: number) {
  }
}
