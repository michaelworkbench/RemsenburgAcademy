import { Link } from "@tanstack/react-router";

const footerLink = "text-primary-foreground/75 transition-colors hover:text-primary-foreground";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="measure grid gap-12 py-16 md:grid-cols-3 md:py-20">
        <div>
          <h2 className="font-display text-3xl text-primary-foreground">The Remsenburg Academy</h2>
          <p className="mt-4 text-base text-primary-foreground/75">
            A landmark of community and culture since 1863.
          </p>
        </div>
        <div>
          <h3 className="eyebrow text-primary-foreground/70">Visit</h3>
          <address className="mt-4 not-italic text-base text-primary-foreground/75">
            130 South Country Rd
            <br />
            Remsenburg, NY 11960
          </address>
          <p className="mt-4 text-base">
            <a className={footerLink} href="mailto:info@remsenburgacademy.org">
              info@remsenburgacademy.org
            </a>
          </p>
        </div>
        <div>
          <h3 className="eyebrow text-primary-foreground/70">Explore</h3>
          <ul className="mt-4 space-y-2 text-base">
            <li>
              <Link className={footerLink} to="/events">
                Events
              </Link>
            </li>
            <li>
              <Link className={footerLink} to="/history">
                History
              </Link>
            </li>
            <li>
              <Link className={footerLink} to="/support">
                Support Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20">
        <div className="measure flex flex-col gap-2 py-6 text-sm text-primary-foreground/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            The Remsenburg Academy Association, Inc. is a 501(c)(3) not for profit corporation.
            Mailing address: P.O. Box 372, Remsenburg, NY 11960.
          </p>
          <p className="shrink-0">
            Designed by{" "}
            <a
              href="https://workbenchwebsites.com/"
              target="_blank"
              rel="noopener"
              className="no-underline transition-colors hover:text-primary-foreground hover:underline"
            >
              Workbench Websites
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
