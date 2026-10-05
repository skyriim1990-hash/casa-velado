// Image kinds from blueprint 6.8: responsive widths and WebP quality.
// The image component (Stage 6) reads this table; nothing here is a format choice,
// because the image service (webp-image-service.mjs) only ever outputs WebP.

export const IMAGE_FORMAT = 'webp' as const;

export interface ImageKind {
  /** srcset widths in CSS pixels */
  widths: readonly number[];
  /** WebP quality, 0–100 */
  quality: number;
  /** Size budget, for the QA check only */
  budget: string;
}

export const imageKinds = {
  hero: {
    widths: [640, 960, 1280, 1920, 2560],
    quality: 75,
    budget: '≤120KB on mobile, ≤240KB at 1920',
  },
  editorial: { widths: [480, 768, 1080, 1440, 1920], quality: 75, budget: '≤160KB at 1440' },
  productCatalog: { widths: [400, 600, 900, 1200], quality: 80, budget: '≤60KB at 900' },
  productGallery: { widths: [600, 900, 1400, 2000], quality: 80, budget: '≤140KB at 1400' },
  articleCover: { widths: [480, 768, 1080, 1600], quality: 75, budget: '≤120KB at 1080' },
  cartThumb: { widths: [120, 240], quality: 80, budget: '≤12KB' },
} as const satisfies Record<string, ImageKind>;

export type ImageKindName = keyof typeof imageKinds;
