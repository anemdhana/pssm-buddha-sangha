export function hotelRoomStats(hotel) {
  const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
  let ac = 0;
  let nonAc = 0;
  let regular = 0;
  let dormitory = 0;
  let hall = 0;
  let capacity = 0;
  rooms.forEach((room) => {
    if (!room) return;
    capacity += Math.max(0, Number(room.capacity) || 0);
    if (room.roomType === 'non_ac') nonAc += 1;
    else ac += 1;
    if (room.kind === 'dormitory') dormitory += 1;
    else if (room.kind === 'hall') hall += 1;
    else regular += 1;
  });
  return {
    roomCount: rooms.length,
    capacity,
    ac,
    nonAc,
    regular,
    dormitory,
    hall
  };
}

export function hotelStats(hotels) {
  const list = Array.isArray(hotels) ? hotels : [];
  let active = 0;
  let reservedHotels = 0;
  let openHotels = 0;
  let openRooms = 0;
  let openBeds = 0;
  let reservedRooms = 0;
  let reservedBeds = 0;
  list.forEach((hotel) => {
    if (hotel?.active === false) return;
    active += 1;
    const s = hotelRoomStats(hotel);
    if (hotel?.reserved) {
      reservedHotels += 1;
      reservedRooms += s.roomCount;
      reservedBeds += s.capacity;
    } else {
      openHotels += 1;
      openRooms += s.roomCount;
      openBeds += s.capacity;
    }
  });
  return {
    hotels: list.length,
    active,
    reservedHotels,
    openHotels,
    openRooms,
    openBeds,
    reservedRooms,
    reservedBeds,
    rooms: openRooms + reservedRooms,
    beds: openBeds + reservedBeds
  };
}

export function hotelDistanceBucket(distanceKm) {
  const d = Number(distanceKm);
  if (!(d >= 0)) return '';
  if (d < 1) return 'near';
  if (d <= 3) return 'mid';
  return 'far';
}

export function hotelDistanceLabel(bucket) {
  if (bucket === 'near') return 'Under 1 km';
  if (bucket === 'mid') return '1–3 km';
  if (bucket === 'far') return 'Over 3 km';
  return '';
}

/**
 * Filter hotels. Facet counts should call with omitted destination filters
 * (active / reserved / roomType / kind / distance) as needed.
 */
export function filterHotels(hotels, filters = {}) {
  const list = Array.isArray(hotels) ? hotels : [];
  const q = String(filters.nameQuery || '')
    .trim()
    .toLowerCase();
  const active = filters.active || '';
  const reserved = filters.reserved || '';
  const roomType = filters.roomType || '';
  const kind = filters.kind || '';
  const distance = filters.distance || '';

  return list.filter((hotel) => {
    if (!hotel) return false;
    if (q) {
      const hay = [hotel.name, hotel.address, hotel.contact]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }
    if (active === 'yes' && hotel.active === false) return false;
    if (active === 'no' && hotel.active !== false) return false;
    if (reserved === 'yes' && !hotel.reserved) return false;
    if (reserved === 'no' && hotel.reserved) return false;

    const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
    if (roomType === 'ac' && !rooms.some((r) => r && r.roomType !== 'non_ac')) return false;
    if (roomType === 'non_ac' && !rooms.some((r) => r && r.roomType === 'non_ac')) return false;
    if (kind === 'regular' && !rooms.some((r) => r && (!r.kind || r.kind === 'regular'))) return false;
    if (kind === 'dormitory' && !rooms.some((r) => r && r.kind === 'dormitory')) return false;
    if (kind === 'hall' && !rooms.some((r) => r && r.kind === 'hall')) return false;

    if (distance) {
      if (hotelDistanceBucket(hotel.distanceKm) !== distance) return false;
    }
    return true;
  });
}

export function hotelDistanceFacets(hotels) {
  const counts = { near: 0, mid: 0, far: 0 };
  (Array.isArray(hotels) ? hotels : []).forEach((hotel) => {
    const bucket = hotelDistanceBucket(hotel?.distanceKm);
    if (bucket && counts[bucket] != null) counts[bucket] += 1;
  });
  return ['near', 'mid', 'far']
    .filter((key) => counts[key] > 0)
    .map((key) => ({ key, label: hotelDistanceLabel(key), count: counts[key] }));
}
