// Photographs are committed to the repo and served from this site's own
// origin (public/images/) — the original WordPress site blocks hotlinking,
// and self-hosting keeps the site independent of the old host entirely.

export const ACADEMY_IMAGES = {
  logo: "/images/logo/Remsenburg-Academy-Logo-2021.jpg",
  heroBanner: "/images/building/DSC_6054-banner-bw-2.jpg",
  buildingSquare: "/images/building/Remsenburg-Academy-DSC_6056-1x1-bw.jpg",
  artBanner: "/images/artremsenburg/ARTRemsenburg-banner-4.jpg",
};

export const EVENT_POSTERS = {
  celebrateLife: "/images/posters/Celebrate-Life.jpg",
  artisansMarket: "/images/posters/artisans-market.jpg",
};

export interface HistoricPhoto {
  src: string;
  alt: string;
}

export const HISTORIC_PHOTOS: HistoricPhoto[] = [
  {
    src: "/images/historic/Academy-Photo-1961-crop-scaled.jpg",
    alt: "The Remsenburg Academy photographed in 1961, when the building served as a family residence.",
  },
  {
    src: "/images/historic/Academy-Post-Office.jpg",
    alt: "The front of the Academy in use as the Remsenburg Post Office between 1958 and 1967.",
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    src: `/images/historic/RA-${i + 1}.jpg`,
    alt: `Archival photograph ${i + 1} of the Remsenburg Academy and its restoration.`,
  })),
];
