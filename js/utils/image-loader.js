export default function imageLoader({ src, width, quality }) {
  // For external images (starting with http/https), return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // For local images, use relative paths for static deployment
  return src.startsWith('/') ? `.${src}` : src;
}
