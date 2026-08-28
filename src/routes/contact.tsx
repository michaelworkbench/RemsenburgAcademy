import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin } from "lucide-react";

import { PageHeader, PublicShell } from "@/components/public-shell";
import { ACADEMY_IMAGES } from "@/lib/academy-images";
import { ogMeta } from "@/lib/site";

const OFFICERS = [
  { name: "Maggie Brush", role: "President" },
  { name: "Bob Busking", role: "Vice President and Treasurer" },
  { name: "Sally Pope", role: "Secretary" },
];

const MEMBERS = [
  "Chris Cohen",
  "Matthew Conlon",
  "Paul Dempsey",
  "Tom Downing",
  "Ceil Frank",
  "Dorothy Labowski",
  "Nancy Lombardi",
  "Claudia Woods",
];

export const Route = createFileRoute("/contact")({
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
            {OFFICERS.map((person) => (
              <li key={person.name} className="border-b border-border pb-4">
                <p className="font-display text-2xl">{person.name}</p>
                <p className="label-caps mt-1">{person.role}</p>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 eyebrow">Members</h3>
          <ul className="mt-4 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            {MEMBERS.map((name) => (
              <li key={name} className="text-foreground/85">
                {name}
              </li>
            ))}
          </ul>
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
