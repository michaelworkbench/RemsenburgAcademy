import { describe, expect, it } from "vitest";

import {
  formatEventDates,
  formatTime,
  isUpcoming,
  timeSummary,
  todayAtTheAcademy,
} from "./event-format";
import type { AcademyEvent, EventDate } from "./events-types";

function event(dates: [string, string, string][]): AcademyEvent {
  return {
    id: "evt-test",
    title: "Test",
    description: "",
    category: "General",
    image_url: null,
    published: true,
    created_at: "2024-01-01T00:00:00Z",
    dates: dates.map(([date, start_time, end_time], i): EventDate => ({
      id: `d${i}`,
      event_id: "evt-test",
      date,
      start_time,
      end_time,
    })),
  };
}

describe("isUpcoming", () => {
  it("keeps an event upcoming through its last day", () => {
    const e = event([["2026-08-28", "18:00", "20:00"]]);
    expect(isUpcoming(e, "2026-08-28")).toBe(true);
    expect(isUpcoming(e, "2026-08-29")).toBe(false);
  });

  it("uses the last date of a multi-day run", () => {
    const e = event([
      ["2026-08-01", "10:00", "16:00"],
      ["2026-08-10", "10:00", "16:00"],
    ]);
    expect(isUpcoming(e, "2026-08-05")).toBe(true);
    expect(isUpcoming(e, "2026-08-11")).toBe(false);
  });

  it("treats an event with no dates as past", () => {
    expect(isUpcoming(event([]), "2026-01-01")).toBe(false);
  });

  it("todayAtTheAcademy returns an ISO calendar date", () => {
    expect(todayAtTheAcademy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatTime", () => {
  it("formats on-the-hour and off-the-hour times", () => {
    expect(formatTime("10:00")).toBe("10 am");
    expect(formatTime("14:30")).toBe("2:30 pm");
    expect(formatTime("12:00")).toBe("12 pm");
    expect(formatTime("00:15")).toBe("12:15 am");
  });
});

describe("formatEventDates", () => {
  it("formats a single day in full", () => {
    const { primary, detail } = formatEventDates(event([["2024-11-23", "16:00", "18:00"]]));
    expect(primary).toBe("Saturday, November 23, 2024");
    expect(detail).toBeNull();
  });

  it("labels weekend-run groups with weekdays and span", () => {
    const { primary, detail } = formatEventDates(
      event([
        ["2024-08-02", "10:00", "17:00"],
        ["2024-08-03", "10:00", "17:00"],
        ["2024-08-04", "10:00", "17:00"],
        ["2024-08-09", "10:00", "17:00"],
        ["2024-08-10", "10:00", "17:00"],
        ["2024-08-11", "10:00", "17:00"],
      ]),
    );
    expect(primary).toContain("Aug 2–11, 2024");
    expect(detail).toBe("Aug 2–4 & Aug 9–11, 2024");
  });

  it("does not split a run that crosses the November DST changeover", () => {
    // US DST ended 2024-11-03; a ms-based day diff would split here.
    const { primary } = formatEventDates(
      event([
        ["2024-11-02", "10:00", "16:00"],
        ["2024-11-03", "10:00", "16:00"],
        ["2024-11-04", "10:00", "16:00"],
      ]),
    );
    expect(primary).toBe("Nov 2–4, 2024");
  });

  it("shows both years for a run that crosses New Year", () => {
    const { primary } = formatEventDates(
      event([
        ["2024-12-30", "10:00", "16:00"],
        ["2024-12-31", "10:00", "16:00"],
        ["2025-01-01", "10:00", "16:00"],
      ]),
    );
    expect(primary).toContain("2024");
    expect(primary).toContain("2025");
  });

  it("announces missing dates gracefully", () => {
    expect(formatEventDates(event([])).primary).toBe("Dates to be announced");
  });
});

describe("timeSummary", () => {
  it("deduplicates identical time ranges", () => {
    const e = event([
      ["2024-08-02", "10:00", "17:00"],
      ["2024-08-03", "10:00", "17:00"],
      ["2024-08-04", "11:00", "18:00"],
    ]);
    expect(timeSummary(e)).toEqual(["10 am – 5 pm", "11 am – 6 pm"]);
  });
});
