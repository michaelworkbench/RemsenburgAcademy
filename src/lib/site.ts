/** Canonical public origin, used for absolute URLs in social/OG meta. */
export const SITE_URL = "https://remsenburgacademy.org";
export const SITE_NAME = "The Remsenburg Academy";

/** Standard OG/Twitter tags shared by every page. */
export function ogMeta(path: string, imagePath: string) {
  return [
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:url", content: `${SITE_URL}${path}` },
    { property: "og:image", content: `${SITE_URL}${imagePath}` },
    { name: "twitter:image", content: `${SITE_URL}${imagePath}` },
  ];
}
