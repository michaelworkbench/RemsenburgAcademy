// Photographs are hosted on the Academy's own CDN so they render everywhere:
// the original WordPress site serves them with a same-origin resource policy
// that blocks hotlinking from another domain.
import logoAsset from "@/assets/Remsenburg-Academy-Logo-2021.jpg.asset.json";
import heroAsset from "@/assets/DSC_6054-banner-bw-2.jpg.asset.json";
import buildingAsset from "@/assets/Remsenburg-Academy-DSC_6056-1x1-bw.jpg.asset.json";
import artBannerAsset from "@/assets/ARTRemsenburg-banner-4.jpg.asset.json";
import photo1961 from "@/assets/Academy-Photo-1961-crop-scaled.jpg.asset.json";
import photoPostOffice from "@/assets/Academy-Post-Office.jpg.asset.json";
import ra1 from "@/assets/RA-1.jpg.asset.json";
import ra2 from "@/assets/RA-2.jpg.asset.json";
import ra3 from "@/assets/RA-3.jpg.asset.json";
import ra4 from "@/assets/RA-4.jpg.asset.json";
import ra5 from "@/assets/RA-5.jpg.asset.json";
import ra6 from "@/assets/RA-6.jpg.asset.json";
import ra7 from "@/assets/RA-7.jpg.asset.json";
import ra8 from "@/assets/RA-8.jpg.asset.json";
import ra9 from "@/assets/RA-9.jpg.asset.json";
import ra10 from "@/assets/RA-10.jpg.asset.json";
import ra11 from "@/assets/RA-11.jpg.asset.json";
import ra12 from "@/assets/RA-12.jpg.asset.json";
import celebrateLifePoster from "@/assets/Celebrate-Life.jpg.asset.json";
import artisansMarketPoster from "@/assets/artisans-market.jpg.asset.json";

export const ACADEMY_IMAGES = {
  logo: logoAsset.url,
  heroBanner: heroAsset.url,
  buildingSquare: buildingAsset.url,
  artBanner: artBannerAsset.url,
};

export const EVENT_POSTERS = {
  celebrateLife: celebrateLifePoster.url,
  artisansMarket: artisansMarketPoster.url,
};

export interface HistoricPhoto {
  src: string;
  alt: string;
}

export const HISTORIC_PHOTOS: HistoricPhoto[] = [
  {
    src: photo1961.url,
    alt: "The Remsenburg Academy photographed in 1961, when the building served as a family residence.",
  },
  {
    src: photoPostOffice.url,
    alt: "The front of the Academy in use as the Remsenburg Post Office between 1958 and 1967.",
  },
  ...[ra1, ra2, ra3, ra4, ra5, ra6, ra7, ra8, ra9, ra10, ra11, ra12].map((asset, i) => ({
    src: asset.url,
    alt: `Archival photograph ${i + 1} of the Remsenburg Academy and its restoration.`,
  })),
];
