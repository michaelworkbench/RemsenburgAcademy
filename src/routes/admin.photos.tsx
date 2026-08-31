import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthError, useSessionRefresh } from "@/lib/admin-auth";
import {
  addGalleryPhotoFn,
  deleteGalleryPhotoFn,
  fetchGallery,
  saveGalleryMetaFn,
} from "@/lib/api";

export const Route = createFileRoute("/admin/photos")({
  component: AdminPhotos,
});

interface Row {
  id: string;
  image_url: string;
  caption: string;
}

const GALLERY_KEY = ["gallery"] as const;

function AdminPhotos() {
  const queryClient = useQueryClient();
  const refreshSession = useSessionRefresh();
  const fileInput = useRef<HTMLInputElement>(null);
  const { data, isPending } = useQuery({ queryKey: GALLERY_KEY, queryFn: () => fetchGallery() });

  const [rows, setRows] = useState<Row[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data && rows === null) {
      setRows(data.map((p) => ({ id: p.id, image_url: p.image_url, caption: p.caption })));
    }
  }, [data, rows]);

  if (isPending || rows === null) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading photos…
      </p>
    );
  }

  function refetch() {
    setRows(null);
    void queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
  }

  function handleError(error: unknown, fallback: string) {
    if (isAuthError(error)) {
      toast.error("Your session has expired — please sign in again.");
      refreshSession();
    } else {
      toast.error(fallback);
    }
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
    setSaving(true);
    void saveGalleryMetaFn({
      data: rows!.map((r) => ({ id: r.id, caption: r.caption.trim() })),
    })
      .then(() => {
        toast.success("Gallery saved.");
        refetch();
      })
      .catch((error: unknown) =>
        handleError(error, "The gallery couldn't be saved. Please try again."),
      )
      .finally(() => setSaving(false));
  }

  function handleDelete(row: Row) {
    if (!window.confirm(`Remove this photo from the gallery? This can't be undone.`)) return;
    void deleteGalleryPhotoFn({ data: { id: row.id } })
      .then(() => {
        toast.success("Photo removed.");
        refetch();
      })
      .catch((error: unknown) =>
        handleError(error, "The photo couldn't be removed. Please try again."),
      );
  }

  async function handleFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("That image is larger than 4 MB. Please choose a smaller one.");
      return;
    }
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const result = await addGalleryPhotoFn({
        data: {
          upload: {
            fileName: file.name,
            contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
            dataBase64: btoa(binary),
          },
          caption: "",
        },
      });
      if (result.ok) {
        toast.success("Photo added — give it a caption below.");
        refetch();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      handleError(error, "The photo couldn't be uploaded. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Photo gallery</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            These photos appear on the public Gallery page in this order. Captions are optional but
            help visitors (and screen readers) know what they're seeing.
          </p>
        </div>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Choose a photo to add"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="lg"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            {uploading ? "Uploading…" : "Add photo"}
          </Button>
        </div>
      </div>

      <ul className="mt-8 list-none space-y-3 p-0">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="grid gap-4 border border-border bg-card p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center"
          >
            <img
              src={row.image_url}
              alt={row.caption || "Gallery photo"}
              loading="lazy"
              className="aspect-[4/3] w-full border border-border object-cover sm:w-32"
            />
            <div className="space-y-1.5">
              <Label htmlFor={`caption-${row.id}`}>Caption</Label>
              <Input
                id={`caption-${row.id}`}
                value={row.caption}
                placeholder="e.g. Artisans Market, 2024"
                onChange={(e) =>
                  setRows((prev) =>
                    prev!.map((r, i) => (i === index ? { ...r, caption: e.target.value } : r)),
                  )
                }
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Move photo up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Move photo down"
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Remove photo"
                className="text-destructive"
                onClick={() => handleDelete(row)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-end">
        <Button type="button" size="lg" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save captions & order"}
        </Button>
      </div>
    </div>
  );
}
