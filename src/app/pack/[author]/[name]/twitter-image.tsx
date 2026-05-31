// Twitter/X reads twitter:image separately from og:image.
// Re-use the exact same generator as opengraph-image so the holographic
// pack card shows on X too.
export {
  default,
  runtime,
  dynamic,
  alt,
  size,
  contentType,
  generateStaticParams,
} from './opengraph-image';
