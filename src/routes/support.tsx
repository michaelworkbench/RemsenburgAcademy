import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PublicShell } from "@/components/public-shell";
import { ACADEMY_IMAGES } from "@/lib/academy-images";
import { ogMeta } from "@/lib/site";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support Us — The Remsenburg Academy" },
      {
        name: "description",
        content:
          "The historic Academy is maintained by community support. Send a tax-deductible check to the Remsenburg Academy Association, Inc., P.O. Box 372, Remsenburg, NY 11960.",
      },
      { property: "og:title", content: "Support Us — The Remsenburg Academy" },
      {
        property: "og:description",
        content:
          "Make a tax-deductible contribution to the Remsenburg Academy Association, Inc., a 501(c)(3) not for profit corporation.",
      },
      ...ogMeta("/support", ACADEMY_IMAGES.buildingSquare),
    ],
  }),
  component: Support,
});

function Support() {
  return (
    <PublicShell>
      <PageHeader eyebrow="Contribute" title="Support Us" />

      <div className="measure grid gap-12 pb-24 md:grid-cols-[1.2fr_1fr] md:pb-32">
        <div>
          <p className="eyebrow">Support</p>
          <h2 className="mt-4 font-display text-[2.5rem] leading-[1.1] md:text-5xl">
            Preserving a Landmark
          </h2>
          <div className="prose-academy mt-8 text-lg leading-relaxed text-foreground/85">
            <p>
              The costs of maintaining the historic Academy building and property are funded
              primarily by the generous support of the community. The Remsenburg Academy
              Association, Inc., which operates the Academy, is a 501(c)(3) not for profit
              corporation.
            </p>
            <p>
              To make a tax-deductible contribution, please send a check made out to the Remsenburg
              Academy Association, Inc. to P.O. Box 372, Remsenburg, NY 11960.
            </p>
          </div>
        </div>

        <aside className="border border-border bg-parchment p-8">
          <p className="eyebrow">Make checks payable to</p>
          <p className="mt-4 font-display text-[1.75rem] leading-snug">
            Remsenburg Academy Association, Inc.
          </p>
          <address className="mt-4 not-italic text-foreground/80">
            P.O. Box 372
            <br />
            Remsenburg, NY 11960
          </address>
        </aside>
      </div>
    </PublicShell>
  );
}
