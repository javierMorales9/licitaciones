import { Event } from "../../domain/Event.js";
import type { EventRepository } from "../../domain/EventRepository.js";

export class TestEventRepository implements EventRepository {
  private args: Event[];
  constructor() {
    this.args = [];
  }

  async add(events: Event[]) {
    this.args = events;
  }

  getAddArgs() {
    return this.args;
  }
}
