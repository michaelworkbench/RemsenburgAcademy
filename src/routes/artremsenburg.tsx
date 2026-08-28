import { createFileRoute } from "@tanstack/react-router";

import { EventCard } from "@/components/event-card";
import { PublicShell } from "@/components/public-shell";
import { ACADEMY_IMAGES } from "@/lib/academy-images";
import { eventYear, firstDate } from "@/lib/event-format";
import { fetchPublishedEvents } from "@/lib/api";

export const Route = createFileRoute("/artremsenburg")({
  loader: () => fetchPublishedEvents(),
  head: () => ({
    meta: [
      { title: "ArtRemsenburg — The Remsenburg Academy" },
      {
        name: "description",
        content:
          "The ArtRemsenburg season of exhibits and receptions at the historic Remsenburg Academy typically runs from Memorial Day through Labor Day.",
      },
      { property: "og:title", content: "ArtRemsenburg — The Remsenburg Academy" },
      {
        property: "og:description",
        content:
          "Art exhibits and receptions at the 1863 Academy schoolhouse, Memorial Day through Labor Day.",
      },
      { property: "og:image", content: ACADEMY_IMAGES.artBanner },
      { name: "twitter:image", content: ACADEMY_IMAGES.artBanner },
    ],
  }),
  component: ArtRemsenburg,
});

function ArtRemsenburg() {
  const events = Route.useLoaderData();
  const artEvents = events.filter(
    (e) => e.category === "Art Exhibit" || e.category === "Art Reception",
  );

  const currentYear = new Date().getFullYear();
  const seasonYear = artEvents.some((e) => eventYear(e) === currentYear)
    ? currentYear
    : Math.max(...artEvents.map(eventYear), currentYear);

  const seasonEvents = artEvents
    .filter((e) => eventYear(e) === seasonYear)
    .sort((a, b) => (firstDate(a)?.date ?? "").localeCompare(firstDate(b)?.date ?? ""));

  return (
    <PublicShell>
      <img
        src={ACADEMY_IMAGES.artBanner}
        alt="ArtRemsenburg banner for the art season at the Remsenburg Academy."
        className="h-56 w-full border-b border-border object-cover md:h-80"
      />

      <div className="measure pt-16 pb-24 md:pt-20 md:pb-32">
        <p className="eyebrow">Memorial Day – Labor Day</p>
        <h1 className="mt-5 font-display text-[2.75rem] leading-[1.08] md:text-6xl">
          ArtRemsenburg
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-foreground/80">
          The ArtRemsenburg season typically runs from Memorial Day through Labor Day.
        </p>

        <section aria-labelledby="season" className="mt-20 md:mt-28">
          <p className="eyebrow">The Season</p>
          <h2 id="season" className="mt-4 font-display text-[2.5rem] leading-[1.1] md:text-5xl">
            {seasonYear} Season
          </h2>
          {seasonEvents.length > 0 ? (
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {seasonEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-border bg-parchment p-10">
              <p className="font-display text-3xl">Check back soon</p>
              <p className="mt-4 max-w-xl text-base text-muted-foreground">
                The exhibits and receptions for the coming season are still being scheduled. They
                will be posted here and on our events calendar.
              </p>
            </div>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
