import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { EventCard } from "@/components/event-card";
import { PublicShell } from "@/components/public-shell";
import { splitByTime, usePublishedEvents } from "@/hooks/use-events";
import { ACADEMY_IMAGES } from "@/lib/academy-images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Remsenburg Academy — A Landmark Since 1863" },
      {
        name: "description",
        content:
          "The historic Academy, a Town of Southampton landmark built circa 1863 as a one-room schoolhouse, hosts art shows, artisan markets and community events in Remsenburg, NY.",
      },
      { property: "og:title", content: "The Remsenburg Academy — A Landmark Since 1863" },
      {
        property: "og:description",
        content:
          "A historic one-room schoolhouse on Remsenburg's main street, hosting art shows, artisan markets and community events.",
      },
      { property: "og:image", content: ACADEMY_IMAGES.heroBanner },
      { name: "twitter:image", content: ACADEMY_IMAGES.heroBanner },
    ],
  }),
  component: Home,
});

function Home() {
  const events = usePublishedEvents();
  const { upcoming } = splitByTime(events);
  const next = upcoming.slice(0, 3);

  return (
    <PublicShell>
      <section className="relative isolate">
        <img
          src={ACADEMY_IMAGES.heroBanner}
          alt="The Remsenburg Academy, a white clapboard one-room schoolhouse, photographed in black and white."
          className="h-[62vh] min-h-[26rem] w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/35 to-foreground/15"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="measure w-full pb-14 md:pb-20">
            <p className="eyebrow text-background/85">Remsenburg, New York</p>
            <h1 className="mt-5 max-w-4xl font-display text-[2.75rem] leading-[1.06] text-background md:text-[4rem]">
              The Remsenburg Academy
            </h1>
            <p className="mt-5 max-w-xl text-lg text-background/90 md:text-xl">
              A landmark of community and culture since 1863
            </p>
          </div>
        </div>
      </section>

      <section className="band measure">
        <div className="grid gap-12 md:grid-cols-[1.35fr_1fr] md:items-start">
          <div>
            <p className="eyebrow">The Academy</p>
            <h2 className="mt-5 font-display text-[2.5rem] leading-[1.1] md:text-5xl">
              A Landmark Since 1863
            </h2>
            <p className="mt-7 text-lg leading-relaxed text-foreground/85">
              The historic Academy, a Town of Southampton landmark constructed circa 1863 as a
              one-room schoolhouse, anchors Remsenburg's scenic main street. The Academy hosts art
              shows, artisan markets and other events that are open to the community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/events" className="btn-solid">
                See upcoming events
              </Link>
              <Link to="/history" className="btn-ghost">
                Our history
              </Link>
            </div>
          </div>
          <img
            src={ACADEMY_IMAGES.buildingSquare}
            alt="Black and white view of the Remsenburg Academy schoolhouse and its front steps."
            loading="lazy"
            className="w-full object-cover"
          />
        </div>
      </section>

      <section aria-labelledby="upcoming-events" className="band-parchment">
        <div className="band measure">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Upcoming Events</p>
              <h2 id="upcoming-events" className="mt-4 font-display text-[2.5rem] leading-[1.1] md:text-5xl">
                At the Academy
              </h2>
            </div>
            <Link to="/events" className="text-base text-primary underline">
              View all events
            </Link>
          </div>

          {next.length > 0 ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {next.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-border bg-card p-10 text-center">
              <p className="font-display text-3xl">Check back soon</p>
              <p className="mt-4 text-base text-muted-foreground">
                There are no events on the calendar at the moment. New art shows, markets and
                community gatherings are announced here as they are scheduled.
              </p>
              <Link
                to="/events"
                className="mt-6 inline-block text-base text-primary underline"
              >
                Browse past events
              </Link>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="visit" className="band measure">
        <p className="eyebrow">Visit</p>
        <h2 id="visit" className="mt-4 font-display text-[2.5rem] leading-[1.1] md:text-5xl">
          On Remsenburg's Main Street
        </h2>
        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-start md:gap-16">
          <div className="flex items-start gap-3 text-lg">
            <MapPin className="mt-1.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <address className="not-italic">
              130 South Country Rd
              <br />
              Remsenburg, NY 11960
            </address>
          </div>
          <p className="max-w-md text-lg text-foreground/80">
            The Academy is open during events publicized on our calendar.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
