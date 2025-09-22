import { Event } from "./Event.ts";

export interface EventRepository {
  add(events: Event[]): Promise<void>;
}
