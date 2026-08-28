export type EventCategory = "Art Exhibit" | "Art Reception" | "General";

export const EVENT_CATEGORIES: EventCategory[] = [
  "Art Exhibit",
  "Art Reception",
  "General",
];

/** One calendar occurrence of an event. An event may have many. */
export interface EventDate {
  id: string;
  event_id: string;
  /** ISO date, e.g. "2024-08-02" */
  date: string;
  /** 24h time, e.g. "10:00" */
  start_time: string;
  /** 24h time, e.g. "17:00" */
  end_time: string;
}

export interface AcademyEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  image_url: string | null;
  published: boolean;
  created_at: string;
  dates: EventDate[];
}
