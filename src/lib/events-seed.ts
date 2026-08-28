import { ACADEMY_IMAGES, EVENT_POSTERS } from "./academy-images";
import type { AcademyEvent, EventCategory } from "./events-types";

interface SeedSpec {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  image_url: string | null;
  /** Inclusive date ranges, e.g. [["2024-08-02", "2024-08-04"]] */
  ranges: [string, string][];
  start_time: string;
  end_time: string;
}

function expand(range: [string, string]): string[] {
  const [start, end] = range;
  const out: string[] = [];
  const [ys = 1970, ms = 1, ds = 1] = start.split("-").map(Number);
  const cursor = new Date(ys, ms - 1, ds);
  const [ye = 1970, me = 1, de = 1] = end.split("-").map(Number);
  const stop = new Date(ye, me - 1, de);

  while (cursor.getTime() <= stop.getTime()) {
    out.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
        cursor.getDate(),
      ).padStart(2, "0")}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

const SEED: SeedSpec[] = [
  {
    id: "celebrate-life-2024",
    title: "Art @ The Academy presents: Celebrate Life!",
    description:
      "An exhibition of work by East End artists at the historic Academy, open to the community across two weekends.",
    category: "Art Exhibit",
    image_url:
      EVENT_POSTERS.celebrateLife,
    ranges: [
      ["2024-08-02", "2024-08-04"],
      ["2024-08-09", "2024-08-11"],
    ],
    start_time: "10:00",
    end_time: "17:00",
  },
  {
    id: "birds-barns-waterfront-2024",
    title: "Birds, Barns and Waterfront: Scenes from the East End",
    description:
      "A summer exhibition of East End landscapes, barns, birds and waterfront scenes, shown over two weekends at the Academy.",
    category: "Art Exhibit",
    image_url: null,
    ranges: [
      ["2024-08-16", "2024-08-18"],
      ["2024-08-23", "2024-08-25"],
    ],
    start_time: "10:00",
    end_time: "16:00",
  },
  {
    id: "fall-community-party-2024",
    title: "Remsenburg Fall Community Party",
    description: "An evening gathering for neighbors and friends at the Academy.",
    category: "General",
    image_url: null,
    ranges: [["2024-10-26", "2024-10-26"]],
    start_time: "18:00",
    end_time: "20:00",
  },
  {
    id: "walking-tour-2024",
    title: "Walking Tour of Historic Main Street Remsenburg",
    description:
      "A guided walk along South Country Road, tracing the history of the Academy and its neighboring landmarks.",
    category: "General",
    image_url: null,
    ranges: [["2024-11-09", "2024-11-09"]],
    start_time: "14:00",
    end_time: "16:00",
  },
  {
    id: "artisans-market-2024",
    title: "Artisans Market",
    description:
      "Local artisans fill the Academy with handmade work over a two-day market weekend.",
    category: "General",
    image_url:
      EVENT_POSTERS.artisansMarket,
    ranges: [["2024-11-16", "2024-11-17"]],
    start_time: "11:00",
    end_time: "16:00",
  },
  {
    id: "norman-lear-2024",
    title: "Norman Lear: His Life and Times",
    description:
      "A community talk on the life and work of Norman Lear, held at the Academy.",
    category: "General",
    image_url: null,
    ranges: [["2024-11-23", "2024-11-23"]],
    start_time: "16:00",
    end_time: "18:00",
  },
  {
    id: "art-at-the-academy-2025",
    title: "Art @ The Academy",
    description:
      "The ArtRemsenburg season opens with an exhibition of work by area artists across two weekends at the Academy.",
    category: "Art Exhibit",
    image_url: ACADEMY_IMAGES.artBanner,
    ranges: [
      ["2025-05-23", "2025-05-25"],
      ["2025-05-30", "2025-06-01"],
    ],
    start_time: "11:00",
    end_time: "16:00",
  },
];

export const SEED_EVENTS: AcademyEvent[] = SEED.map((spec) => {
  const days = spec.ranges.flatMap(expand);
  return {
    id: spec.id,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    image_url: spec.image_url,
    published: true,
    created_at: `${days[0]}T00:00:00.000Z`,
    dates: days.map((date, i) => ({
      id: `${spec.id}-d${i + 1}`,
      event_id: spec.id,
      date,
      start_time: spec.start_time,
      end_time: spec.end_time,
    })),
  };
});
