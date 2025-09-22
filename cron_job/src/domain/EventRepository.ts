import { Event } from "./Event.js";

export interface EventRepository {
  add(events: Event[]): Promise<void>;
}
