import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { EventForm } from "@/components/admin/event-form";
import { getEvent } from "@/lib/events-store";
import type { AcademyEvent } from "@/lib/events-types";

export const Route = createFileRoute("/admin/$eventId")({
  component: EditEvent,
});

function EditEvent() {
  const { eventId } = Route.useParams();
  const [event, setEvent] = useState<AcademyEvent | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setEvent(undefined);
    void getEvent(eventId)
      .then((found) => {
        if (!cancelled) setEvent(found);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <div>
      <Link to="/admin" className="text-sm text-primary underline">
        ← Back to all events
      </Link>

      {event === undefined ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading event…</p>
      ) : event === null ? (
        <div className="mt-6">
          <h1 className="font-display text-3xl">Event not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This event may have been deleted. Head back to the list to see what's there.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-4 font-display text-3xl">Edit event</h1>
          <p className="mt-2 text-sm text-muted-foreground">{event.title}</p>
          <div className="mt-10">
            <EventForm event={event} />
          </div>
        </>
      )}
    </div>
  );
}
