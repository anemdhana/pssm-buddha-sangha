/** Compact JPEG data URL for a hotel thumbnail (max edge ~360px). */
export function compressHotelImageFile(file, { maxEdge = 360, quality = 0.78 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      reject(new Error('Choose an image file (JPG or PNG).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not open that image.'));
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          reject(new Error('Could not open that image.'));
          return;
        }
        const scale = Math.min(1, maxEdge / Math.max(w, h));
        const outW = Math.max(1, Math.round(w * scale));
        const outH = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process that image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, outW, outH);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

/** Tiny SVG placeholder used in sample hotels (no network). */
export function hotelPlaceholderImage(label = 'Hotel') {
  const letters = String(label || 'H')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'H';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120">` +
    `<rect width="160" height="120" fill="#e8eef5"/>` +
    `<rect x="12" y="18" width="136" height="72" rx="6" fill="#c5d4e4"/>` +
    `<text x="80" y="62" text-anchor="middle" font-family="Arial,sans-serif" ` +
    `font-size="28" font-weight="700" fill="#4a5d73">${letters}</text>` +
    `<rect x="0" y="96" width="160" height="24" fill="#d7e2ee"/>` +
    `</svg>`;
  if (typeof btoa === 'function') {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function hotelTelHref(contact) {
  const digits = String(contact || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}
