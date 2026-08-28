import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EVENTS_QUERY_KEY, splitByTime, useAllEvents } from "@/hooks/use-events";
import { formatEventDates, timeSummary } from "@/lib/event-format";
import { deleteEvent, setPublished } from "@/lib/events-store";
import type { AcademyEvent } from "@/lib/events-types";

export const Route = createFileRoute("/admin/")({
  component: AdminEventsList,
});

function EventRow({ event }: { event: AcademyEvent }) {
  const { primary } = formatEventDates(event);
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });

  return (
    <li className="flex flex-wrap items-start justify-between gap-4 border border-border bg-card p-5 shadow-frame">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {event.category}
          </span>
          <span
            className={
              event.published
                ? "rounded-full border border-primary/25 bg-navy-soft px-3 py-0.5 text-xs font-semibold text-primary"
                : "rounded-full border border-border bg-secondary px-3 py-0.5 text-xs font-semibold text-muted-foreground"
            }
          >
            {event.published ? "Published" : "Draft"}
          </span>
        </div>
        <h3 className="mt-2 font-display text-xl">{event.title}</h3>
        <p className="text-sm text-muted-foreground">
          {primary} · {timeSummary(event).join(" · ")} ·{" "}
          {event.dates.length === 1 ? "1 date" : `${event.dates.length} dates`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void setPublished(event.id, !event.published)
              .then(() => {
                refresh();
                toast.success(event.published ? "Moved back to draft." : "Published to the website.");
              })
              .catch(() => toast.error("That change didn't save. Please try again."))
          }
        >
          {event.published ? "Unpublish" : "Publish"}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/$eventId" params={{ eventId: event.id }}>
            <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{event.title}”?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the event and all of its dates from the website. This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep event</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  void deleteEvent(event.id)
                    .then(() => {
                      refresh();
                      toast.success("Event deleted.");
                    })
                    .catch(() => toast.error("The event couldn't be deleted. Please try again."))
                }
              >
                Delete event
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}

function AdminEventsList() {
  const { events, isLoading } = useAllEvents();
  const { upcoming, past } = splitByTime(events);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading events…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">All events</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Changes appear on the public website right away.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/admin/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add event
          </Link>
        </Button>
      </div>

      <section aria-labelledby="admin-upcoming" className="mt-10">
        <h2 id="admin-upcoming" className="eyebrow">
          Upcoming
        </h2>
        {upcoming.length > 0 ? (
          <ul className="mt-4 list-none space-y-4 p-0">
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 border border-border bg-card p-6 text-sm text-muted-foreground">
            No upcoming events yet. Use “Add event” to put one on the calendar.
          </p>
        )}
      </section>

      <section aria-labelledby="admin-past" className="mt-12">
        <h2 id="admin-past" className="eyebrow">
          Past
        </h2>
        {past.length > 0 ? (
          <ul className="mt-4 list-none space-y-4 p-0">
            {past.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 border border-border bg-card p-6 text-sm text-muted-foreground">
            No past events.
          </p>
        )}
      </section>
    </div>
  );
}
