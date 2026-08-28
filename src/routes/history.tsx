import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PublicShell } from "@/components/public-shell";
import { HISTORIC_PHOTOS } from "@/lib/academy-images";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — The Remsenburg Academy" },
      {
        name: "description",
        content:
          "Built about 1863 by John W. Tuthill as a one-room schoolhouse, the Academy has been a private school, a residence and the local Post Office before becoming a Town of Southampton landmark.",
      },
      { property: "og:title", content: "History — The Remsenburg Academy" },
      {
        property: "og:description",
        content:
          "From 1863 schoolhouse to Post Office to Town of Southampton landmark: the story of the Remsenburg Academy.",
      },
      { property: "og:image", content: HISTORIC_PHOTOS[0]!.src },
      { name: "twitter:image", content: HISTORIC_PHOTOS[0]!.src },

    ],
  }),
  component: History,
});

function History() {
  return (
    <PublicShell>
      <PageHeader eyebrow="Since 1863" title="History of the Academy" />

      <div className="measure pb-24 md:pb-32">
        <div className="prose-academy max-w-3xl text-lg leading-relaxed text-foreground/85">
          <p>
            The Remsenburg Academy, originally a private school, then a residence, then a Post
            Office, and now owned by the Town of Southampton, is a designated Landmark of the Town
            of Southampton.
          </p>
          <p>
            The Academy was constructed in about 1863 by John W. Tuthill as a one-room schoolhouse
            on a large property the Tuthill family had owned since the 1700s. It served as an
            intermediate school for young gentlemen from New York City who boarded with local farm
            families. John Tuthill closed the school in 1869 to open the Ocean House, a boarding
            house next door, which still stands at 132 South Country Road. The Academy continued to
            serve as a guest quarters or family residence.
          </p>
          <p>
            By 1958 the Academy property was subdivided from the former boarding house property and
            was used as family residence. Between October 1958 and 1967 the front of the Academy
            also served as the local Post Office. The last private residents, Robert Burchette and
            Joseph D. Ryle, bequeathed it to the community in the 1990's to be used as a library and
            repository for local artifacts and records. The building sat empty for several years
            until a committee of volunteers from the community converted the structure from a family
            residence back to its original design as a schoolhouse.
          </p>
          <p>
            The Remsenburg Academy Association, Inc., a 501(c)(3) not for profit corporation,
            currently operates and maintains the Academy.
          </p>
        </div>

        <section aria-labelledby="gallery" className="mt-16 md:mt-24">
          <p className="eyebrow">Our History</p>
          <h2 id="gallery" className="mt-4 font-display text-[2.5rem] leading-[1.1] md:text-5xl">
            A Schoolhouse Since 1863
          </h2>
          <ul className="mt-10 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {HISTORIC_PHOTOS.map((photo) => (
              <li key={photo.src} className="border border-border bg-parchment p-2">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="aspect-4/3 w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicShell>
  );
}
