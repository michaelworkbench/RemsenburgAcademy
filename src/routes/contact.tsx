import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin } from "lucide-react";

import { PageHeader, PublicShell } from "@/components/public-shell";
import { ACADEMY_IMAGES } from "@/lib/academy-images";
import { fetchCommittee } from "@/lib/api";
import { ogMeta } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  loader: () => fetchCommittee(),
  head: () => ({
    meta: [
      { title: "Contact — The Remsenburg Academy" },
      {
        name: "description",
        content:
          "Reach the Remsenburg Academy Association committee at info@remsenburgacademy.org, or visit the Academy at 130 South Country Rd, Remsenburg, NY 11960.",
      },
      { property: "og:title", content: "Contact — The Remsenburg Academy" },
      {
        property: "og:description",
        content:
          "Committee roster and contact details for the Remsenburg Academy Association, Inc.",
      },
      ...ogMeta("/contact", ACADEMY_IMAGES.buildingSquare),
    ],
  }),
  component: Contact,
});

function Contact() {
  const committee = Route.useLoaderData();
  const officers = committee.filter((m) => m.title.trim() !== "");
  const members = committee.filter((m) => m.title.trim() === "");

  return (
    <PublicShell>
      <PageHeader eyebrow="Get in touch" title="Contact" />

      <div className="measure grid gap-14 pb-24 md:grid-cols-[1fr_1fr] md:pb-32">
        <section aria-labelledby="committee">
          <p className="eyebrow">Committee</p>
          <h2 id="committee" className="mt-4 font-display text-[2.25rem] leading-[1.1]">
            The Committee
          </h2>
          <ul className="mt-6 list-none space-y-4 p-0">
            {officers.map((person) => (
              <li key={person.id} className="border-b border-border pb-4">
                <p className="font-display text-2xl">{person.name}</p>
                <p className="label-caps mt-1">{person.title}</p>
              </li>
            ))}
          </ul>
          {members.length > 0 ? (
            <>
              <h3 className="mt-8 eyebrow">Members</h3>
              <ul className="mt-4 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
                {members.map((person) => (
                  <li key={person.id} className="text-foreground/85">
                    {person.name}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section aria-labelledby="details">
          <p className="eyebrow">Contact</p>
          <h2 id="details" className="mt-4 font-display text-[2.25rem] leading-[1.1]">
            Reach Us
          </h2>
          <div className="mt-6 space-y-6">
            <p className="flex items-start gap-3">
              <Mail className="mt-1.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <a
                href="mailto:info@remsenburgacademy.org"
                className="text-lg underline hover:text-primary"
              >
                info@remsenburgacademy.org
              </a>
            </p>
            <div className="flex items-start gap-3">
              <MapPin className="mt-1.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <address className="text-lg not-italic">
                130 South Country Rd
                <br />
                Remsenburg, NY 11960
              </address>
            </div>
            <p className="text-base text-muted-foreground">
              The Academy is open during events publicized on our calendar.
            </p>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
