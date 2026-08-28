import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="measure pt-16 pb-10 md:pt-24 md:pb-14">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-5 font-display text-[2.75rem] leading-[1.08] md:text-6xl">{title}</h1>
      {intro ? (
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-foreground/80">{intro}</p>
      ) : null}
    </div>
  );
}
