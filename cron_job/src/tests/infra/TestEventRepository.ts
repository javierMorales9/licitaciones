import { Event } from "../../domain/Event.js";
import type { EventRepository } from "../../domain/EventRepository.js";

export class TestEventRepository implements EventRepository {
  constructor() { }

  async add(events: Event[]) {

  }
}
