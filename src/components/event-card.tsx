import { CalendarDays, Clock } from "lucide-react";

import { formatEventDates, timeSummary } from "@/lib/event-format";
import type { AcademyEvent } from "@/lib/events-types";
import { cn } from "@/lib/utils";

function CategoryBadge({ category }: { category: AcademyEvent["category"] }) {
  return (
    <span
      className="label-caps block"
    >
      {category}
    </span>
  );
}

export function EventCard({
  event,
  muted = false,
}: {
  event: AcademyEvent;
  muted?: boolean;
}) {
  const { primary, detail } = formatEventDates(event);
  const times = timeSummary(event);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden border border-border bg-card",
        muted && "opacity-95",
      )}
    >
      {event.image_url ? (
        <img
          src={event.image_url}
          alt={`Poster for ${event.title}`}
          loading="lazy"
          className="aspect-4/3 w-full border-b border-border object-cover grayscale-0"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-4/3 w-full items-center justify-center border-b border-border bg-parchment"
        >
          <span className="font-display text-3xl text-muted-foreground">1863</span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-6">
        <CategoryBadge category={event.category} />
        <h3 className="font-display text-[1.75rem] leading-snug">{event.title}</h3>

        <dl className="space-y-2 text-base text-muted-foreground">
          <div className="flex gap-2">
            <dt className="sr-only">Dates</dt>
            <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <dd>
              {primary}
              {detail ? <span className="block text-xs">{detail}</span> : null}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Times</dt>
            <Clock className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <dd>{times.join(" · ")}</dd>
          </div>
        </dl>

        {event.description ? (
          <p className="text-base leading-relaxed text-foreground/80">{event.description}</p>
        ) : null}
      </div>
    </article>
  );
}
