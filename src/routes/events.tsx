import { createFileRoute } from "@tanstack/react-router";

import { EventCard } from "@/components/event-card";
import { PageHeader, PublicShell } from "@/components/public-shell";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { groupByYear, splitByTime } from "@/hooks/use-events";
import { ACADEMY_IMAGES } from "@/lib/academy-images";
import { fetchPublishedEvents } from "@/lib/api";
import { ChevronDown } from "lucide-react";
import { ogMeta } from "@/lib/site";

export const Route = createFileRoute("/events")({
  loader: () => fetchPublishedEvents(),
  head: () => ({
    meta: [
      { title: "Events at The Remsenburg Academy" },
      {
        name: "description",
        content:
          "Upcoming art exhibits, receptions, artisan markets and community events at the historic Remsenburg Academy, plus an archive of past events by year.",
      },
      { property: "og:title", content: "Events at The Remsenburg Academy" },
      {
        property: "og:description",
        content:
          "Art shows, artisan markets and community gatherings at the 1863 schoolhouse in Remsenburg, NY.",
      },
      ...ogMeta("/events", ACADEMY_IMAGES.heroBanner),
    ],
  }),
  component: Events,
});

function Events() {
  const events = Route.useLoaderData();
  const { upcoming, past } = splitByTime(events);
  const pastByYear = groupByYear(past);

  return (
    <PublicShell>
      <PageHeader
        eyebrow="Calendar"
        title="Events"
        intro="Art shows, artisan markets and community gatherings at the Academy. The Academy is open during events publicized here."
      />

      <div className="measure pb-24 md:pb-32">
        <section aria-labelledby="upcoming">
          <p className="eyebrow">Upcoming Events</p>
          <h2 id="upcoming" className="mt-4 font-display text-[2.5rem] leading-[1.1] md:text-5xl">
            At the Academy
          </h2>
          {upcoming.length > 0 ? (
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-border bg-parchment p-10">
              <p className="font-display text-3xl">Check back soon</p>
              <p className="mt-4 max-w-xl text-base text-muted-foreground">
                Nothing is on the calendar right now. New exhibits, markets and community events are
                posted here as soon as they are scheduled.
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="past" className="mt-24 md:mt-32">
          <p className="eyebrow">Archive</p>
          <h2 id="past" className="mt-4 font-display text-[2.5rem] leading-[1.1] md:text-5xl">
            Past Events
          </h2>
          {pastByYear.length === 0 ? (
            <p className="mt-6 text-base text-muted-foreground">No past events yet.</p>
          ) : (
            <div className="mt-8 space-y-4">
              {pastByYear.map(([year, yearEvents]) => (
                <Collapsible key={year} className="border border-border bg-card">
                  <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span className="font-display text-3xl">{year}</span>
                    <span className="flex items-center gap-3 text-base text-muted-foreground">
                      {yearEvents.length} {yearEvents.length === 1 ? "event" : "events"}
                      <ChevronDown
                        className="h-4 w-4 text-primary transition-transform group-data-[state=open]:rotate-180"
                        aria-hidden="true"
                      />
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-8 border-t border-border bg-parchment p-6 sm:grid-cols-2 lg:grid-cols-3">
                      {yearEvents.map((event) => (
                        <EventCard key={event.id} event={event} muted />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
