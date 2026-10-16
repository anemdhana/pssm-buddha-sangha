import { describe, expect, it } from 'vitest';
import { hotelPlaceholderImage, hotelTelHref } from './hotelImage.js';

describe('hotelImage', () => {
  it('builds a data-url placeholder', () => {
    const url = hotelPlaceholderImage('Sai Prakash');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(url.length).toBeGreaterThan(40);
  });

  it('builds tel href from contact text', () => {
    expect(hotelTelHref('040-23203131')).toBe('tel:04023203131');
    expect(hotelTelHref('+91 98765 43210')).toBe('tel:+919876543210');
    expect(hotelTelHref('')).toBe('');
  });
});
