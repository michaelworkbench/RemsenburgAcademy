import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { ACADEMY_IMAGES } from "@/lib/academy-images";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/events", label: "Events" },
  { to: "/history", label: "History" },
  { to: "/artremsenburg", label: "ArtRemsenburg" },
  { to: "/support", label: "Support Us" },
  { to: "/contact", label: "Contact" },
] as const;

const linkBase =
  "text-[0.9375rem] tracking-wide text-foreground/80 transition-colors hover:text-primary";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={ACADEMY_IMAGES.logo}
            alt="The Remsenburg Academy logo"
            className="h-11 w-11 object-cover"
            width={44}
            height={44}
          />
          <span className="font-display text-lg leading-tight md:text-xl">
            The Remsenburg Academy
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkBase}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="inline-flex items-center justify-center border border-primary p-2 text-primary lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="bg-background">
            <SheetTitle className="font-display text-xl">Menu</SheetTitle>
            <nav aria-label="Mobile" className="mt-6 flex flex-col gap-5 px-4">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="font-display text-2xl text-foreground"
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ className: "text-primary" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
