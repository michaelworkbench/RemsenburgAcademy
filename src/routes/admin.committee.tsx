import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthError, useSessionRefresh } from "@/lib/admin-auth";
import { fetchCommittee, saveCommitteeFn } from "@/lib/api";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-guard";

export const Route = createFileRoute("/admin/committee")({
  component: AdminCommittee,
});

interface Row {
  /** Present for people already saved; absent for newly added rows. */
  id?: string;
  name: string;
  title: string;
}

function rosterOf(rows: Row[]) {
  return JSON.stringify(rows.map((r) => ({ name: r.name.trim(), title: r.title.trim() })));
}

function AdminCommittee() {
  const queryClient = useQueryClient();
  const refreshSession = useSessionRefresh();
  const { data, isPending } = useQuery({
    queryKey: ["committee"],
    queryFn: () => fetchCommittee(),
  });

  const [rows, setRows] = useState<Row[] | null>(null);
  const [saving, setSaving] = useState(false);

  // Seed the editable rows once the roster loads.
  useEffect(() => {
    if (data && rows === null) {
      setRows(data.map((m) => ({ id: m.id, name: m.name, title: m.title })));
    }
  }, [data, rows]);

  const dirty =
    rows !== null &&
    data !== undefined &&
    rosterOf(rows) !== rosterOf(data.map((m) => ({ name: m.name, title: m.title })));
  useUnsavedChangesGuard(dirty);

  if (isPending || rows === null) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading committee…
      </p>
    );
  }

  function update(index: number, patch: Partial<Row>) {
    setRows((prev) => prev!.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function move(index: number, delta: -1 | 1) {
    setRows((prev) => {
      const next = [...prev!];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function handleSave() {
    const cleaned = rows!.map((r) => ({ id: r.id, name: r.name.trim(), title: r.title.trim() }));
    if (cleaned.some((r) => !r.name)) {
      toast.error("Every person needs a name — remove empty rows before saving.");
      return;
    }
    if (cleaned.length === 0) {
      toast.error("The committee can't be empty.");
      return;
    }
    setSaving(true);
    void saveCommitteeFn({ data: cleaned })
      .then(() => {
        setRows(null);
        void queryClient.invalidateQueries({ queryKey: ["committee"] });
        toast.success("Committee saved. The Contact page is updated.");
      })
      .catch((error: unknown) => {
        if (isAuthError(error)) {
          toast.error("Your session has expired — please sign in again.");
          refreshSession();
        } else {
          toast.error("The committee couldn't be saved. Please try again.");
        }
      })
      .finally(() => setSaving(false));
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Committee</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        This list appears on the public Contact page. Give officers a title (President, Secretary,
        …); people without a title are listed as members. Use the arrows to set the order.
      </p>

      <ul className="mt-8 list-none space-y-3 p-0">
        {rows.map((row, index) => (
          <li
            key={row.id ?? `new-${index}`}
            className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1.2fr_1.2fr_auto] sm:items-end"
          >
            <div className="space-y-1.5">
              <Label htmlFor={`name-${index}`}>Name</Label>
              <Input
                id={`name-${index}`}
                value={row.name}
                onChange={(e) => update(index, { name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`title-${index}`}>
                Title (officers only — leave blank for members)
              </Label>
              <Input
                id={`title-${index}`}
                value={row.title}
                placeholder="e.g. President"
                onChange={(e) => update(index, { title: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Move ${row.name || "person"} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Move ${row.name || "person"} down`}
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove ${row.name || "person"}`}
                className="text-destructive"
                onClick={() => setRows((prev) => prev!.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRows((prev) => [...prev!, { name: "", title: "" }])}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add person
        </Button>
        <Button type="button" size="lg" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save committee"}
        </Button>
      </div>
    </div>
  );
}
