import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, PublicShell } from "@/components/public-shell";
import { ACADEMY_IMAGES } from "@/lib/academy-images";
import { fetchGallery } from "@/lib/api";
import { ogMeta } from "@/lib/site";

export const Route = createFileRoute("/gallery")({
  loader: () => fetchGallery(),
  head: () => ({
    meta: [
      { title: "Gallery — The Remsenburg Academy" },
      {
        name: "description",
        content:
          "Photographs from art shows, artisan markets and community life at the historic Remsenburg Academy schoolhouse.",
      },
      { property: "og:title", content: "Gallery — The Remsenburg Academy" },
      {
        property: "og:description",
        content: "Scenes from the Academy — exhibits, markets and the 1863 schoolhouse itself.",
      },
      ...ogMeta("/gallery", ACADEMY_IMAGES.buildingSquare),
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const photos = Route.useLoaderData();

  return (
    <PublicShell>
      <PageHeader
        eyebrow="Photo Gallery"
        title="The Academy in Pictures"
        intro="Scenes from exhibits, markets and community life at the schoolhouse."
      />

      <div className="measure pb-24 md:pb-32">
        {photos.length === 0 ? (
          <p className="border border-border bg-parchment p-10 text-base text-muted-foreground">
            Photos are on their way — check back soon.
          </p>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.id}>
                <figure>
                  <img
                    src={photo.image_url}
                    alt={photo.caption || "Photograph from The Remsenburg Academy"}
                    loading="lazy"
                    className="aspect-[4/3] w-full border border-border object-cover"
                  />
                  {photo.caption ? (
                    <figcaption className="mt-3 text-sm text-muted-foreground">
                      {photo.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-16 border-t border-border pt-10">
          <p className="text-lg">
            Looking for what's happened at the Academy?{" "}
            <Link to="/events" hash="past" className="text-primary underline">
              Browse past events by year
            </Link>
            .
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
