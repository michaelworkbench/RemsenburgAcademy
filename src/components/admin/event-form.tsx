import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

import { EVENTS_QUERY_KEY } from "@/hooks/use-events";
import { isAuthError, useSessionRefresh } from "@/lib/admin-auth";
import { createEvent, updateEvent, uploadPoster, type EventDateInput } from "@/lib/events-store";
import { EVENT_CATEGORIES, type AcademyEvent, type EventCategory } from "@/lib/events-types";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** A validation problem tied to the field that owns it (id doubles as the summary item's DOM id). */
interface FormError {
  id: string;
  message: string;
}

function blankDate(): EventDateInput {
  return { date: "", start_time: "10:00", end_time: "16:00" };
}

export function EventForm({ event }: { event?: AcademyEvent }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refreshSession = useSessionRefresh();
  const fileInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState(event?.title ?? "");
  const [category, setCategory] = useState<EventCategory>(event?.category ?? "General");
  const [description, setDescription] = useState(event?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(event?.image_url ?? null);
  const [published, setPublished] = useState(event?.published ?? false);
  const [dates, setDates] = useState<EventDateInput[]>(
    event && event.dates.length > 0
      ? event.dates.map((d) => ({
          date: d.date,
          start_time: d.start_time,
          end_time: d.end_time,
        }))
      : [blankDate()],
  );
  const [errors, setErrors] = useState<FormError[]>([]);

  function updateDate(index: number, patch: Partial<EventDateInput>) {
    setDates((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("That image is larger than 4 MB. Please choose a smaller one.");
      return;
    }
    setUploading(true);
    const result = await uploadPoster(file).finally(() => setUploading(false));
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setImageUrl(result.url);
    toast.success("Poster added.");
  }

  function validate(): FormError[] {
    const found: FormError[] = [];
    if (!title.trim()) found.push({ id: "err-title", message: "Please give the event a title." });
    if (!dates.some((d) => d.date)) {
      found.push({ id: "err-dates", message: "Please add at least one date for the event." });
    }
    dates.forEach((d, index) => {
      if (d.date && d.start_time && d.end_time && d.end_time <= d.start_time) {
        found.push({
          id: `err-date-${index}`,
          message: `On ${d.date}, the end time must be later than the start time.`,
        });
      }
    });
    return found;
  }

  const hasError = (id: string) => errors.some((e) => e.id === id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (found.length > 0) {
      toast.error("Please fix the highlighted items before saving.");
      return;
    }

    const payload = {
      title,
      description,
      category,
      image_url: imageUrl,
      published,
      dates: dates.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date)),
    };

    setSaving(true);
    const save = event ? updateEvent(event.id, payload) : createEvent(payload);
    void save
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
        toast.success(event ? "Event saved." : "Event created.");
        void navigate({ to: "/admin" });
      })
      .catch((error: unknown) => {
        if (isAuthError(error)) {
          toast.error("Your session has expired — please sign in again. Your form is unchanged.");
          refreshSession();
        } else {
          toast.error("The event couldn't be saved. Please try again.");
        }
      })
      .finally(() => setSaving(false));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {errors.length > 0 ? (
        <div
          role="alert"
          className="border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive"
        >
          <p className="font-semibold">There's a little more to fill in:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error.id} id={error.id}>
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Event title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Art @ The Academy presents: Celebrate Life!"
            aria-invalid={hasError("err-title") || undefined}
            aria-describedby={hasError("err-title") ? "err-title" : undefined}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
            <SelectTrigger id="category" aria-describedby="category-hint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p id="category-hint" className="text-xs text-muted-foreground">
            The category decides where the event appears. <strong>Art Exhibit</strong> and{" "}
            <strong>Art Reception</strong> show on both the Events page and the ArtRemsenburg
            page; <strong>General</strong> shows on the Events page only.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="poster">Poster image</Label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInput}
              id="poster"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Choose image"}
            </Button>
            {imageUrl ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setImageUrl(null)}
                className="text-destructive"
              >
                Remove
              </Button>
            ) : null}
          </div>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Selected event poster preview"
              className="mt-3 max-h-48 border border-border object-contain"
            />
          ) : (
            <p className="text-xs text-muted-foreground">Optional. JPG or PNG up to 4 MB.</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short paragraph describing the event for visitors."
          />
        </div>
      </div>

      <fieldset className="border border-border bg-card p-6">
        <legend className="px-2 font-display text-xl">Dates &amp; times</legend>
        <p className="text-sm text-muted-foreground">
          One event can run on many days. Add a row for each day — a six-day exhibit is one event
          with six dates.
        </p>

        <ul className="mt-6 list-none space-y-4 p-0">
          {dates.map((d, index) => (
            <li
              key={index}
              className="grid gap-4 border-b border-border pb-4 last:border-0 last:pb-0 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor={`date-${index}`}>Date</Label>
                <Input
                  id={`date-${index}`}
                  type="date"
                  value={d.date}
                  onChange={(e) => updateDate(index, { date: e.target.value })}
                  aria-invalid={hasError("err-dates") || undefined}
                  aria-describedby={hasError("err-dates") ? "err-dates" : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`start-${index}`}>Start time</Label>
                <Input
                  id={`start-${index}`}
                  type="time"
                  value={d.start_time}
                  onChange={(e) => updateDate(index, { start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`end-${index}`}>End time</Label>
                <Input
                  id={`end-${index}`}
                  type="time"
                  value={d.end_time}
                  onChange={(e) => updateDate(index, { end_time: e.target.value })}
                  aria-invalid={hasError(`err-date-${index}`) || undefined}
                  aria-describedby={hasError(`err-date-${index}`) ? `err-date-${index}` : undefined}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Remove date ${index + 1}`}
                disabled={dates.length === 1}
                onClick={() => setDates((prev) => prev.filter((_, i) => i !== index))}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() =>
            setDates((prev) => [
              ...prev,
              {
                date: "",
                start_time: prev[prev.length - 1]?.start_time ?? "10:00",
                end_time: prev[prev.length - 1]?.end_time ?? "16:00",
              },
            ])
          }
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add another date
        </Button>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-6 border border-border bg-parchment p-6">
        <div className="flex items-center gap-4">
          <Switch id="published" checked={published} onCheckedChange={setPublished} />
          <Label htmlFor="published" className="text-base">
            Published
            <span className="block text-sm font-normal text-muted-foreground">
              {published
                ? "Visible on the public website."
                : "Saved as a draft — nobody outside the admin sees it."}
            </span>
          </Label>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={saving || uploading}
          className="min-w-40 text-base"
        >
          {saving ? "Saving…" : "Save event"}
        </Button>
      </div>
    </form>
  );
}
