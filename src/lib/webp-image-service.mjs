// Image service for Casa Velado: Astro's Sharp service, restricted to WebP output.
// Blueprint 6.8: every raster image in dist/ is WebP; no JPEG or PNG fallback.
// SVG sources pass through untouched (brand assets are SVG).
import sharpService from 'astro/assets/services/sharp';

const RASTER_OUTPUT = 'webp';

function toWebp(options, logger) {
  const format = options.format;
  if (format === undefined || format === 'svg' || format === RASTER_OUTPUT) {
    return { ...options, ...(format === 'svg' ? {} : { format: RASTER_OUTPUT }) };
  }
  const src = typeof options.src === 'string' ? options.src : (options.src?.fsPath ?? 'an image');
  logger?.warn(
    `Image output format "${format}" requested for "${src}". Casa Velado publishes WebP only, so it was changed to WebP.`,
  );
  return { ...options, format: RASTER_OUTPUT };
}

const service = {
  ...sharpService,

  async validateOptions(options, imageConfig, logger) {
    const validated = await sharpService.validateOptions(
      toWebp(options, logger),
      imageConfig,
      logger,
    );
    return toWebp(validated, logger);
  },

  async transform(inputBuffer, transform, imageConfig, logger) {
    return sharpService.transform(
      inputBuffer,
      transform.format === 'svg' ? transform : { ...transform, format: RASTER_OUTPUT },
      imageConfig,
      logger,
    );
  },
};

export default service;
