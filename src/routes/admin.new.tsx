import { createFileRoute, Link } from "@tanstack/react-router";

import { EventForm } from "@/components/admin/event-form";

export const Route = createFileRoute("/admin/new")({
  component: NewEvent,
});

function NewEvent() {
  return (
    <div>
      <Link to="/admin" className="text-sm text-primary underline">
        ← Back to all events
      </Link>
      <h1 className="mt-4 font-display text-3xl">Add an event</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill in the details, add every day the event runs, then save.
      </p>
      <div className="mt-10">
        <EventForm />
      </div>
    </div>
  );
}
