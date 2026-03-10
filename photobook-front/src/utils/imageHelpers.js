export function buildSrcSet(photo, base) {
  if (!photo) return '';

  const entries = [];

  if (photo.thumbnailPath) {
    entries.push(`${base}${photo.thumbnailPath} 400w`);
  }

  const fullWidth = photo.width || 1200;
  entries.push(`${base}${photo.filePath} ${fullWidth}w`);

  return entries.join(', ');
}

export function defaultSizesForGallery() {
  return '(min-width:1280px) 25vw, (min-width:1024px) 33vw, 50vw';
}

export function defaultSizesForFeatured() {
  return '(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw';
}
