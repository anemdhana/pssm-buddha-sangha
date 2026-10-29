import { describe, expect, it } from 'vitest';
import {
  expandGroupedPlacementChoice,
  formatAllotmentMovesMessage,
  groupPlacementsByRoom,
  hotelLocationPeopleSummary,
  priorAllotmentMoves,
  hotelPeopleAccommodatedSoFar,
  hotelRoomFillCounts,
  hotelSuggestionPage,
  listSmartRoomOptions,
  partiesFromSelectedPeople,
  staysOverlap,
  suggestHotelsForSelection,
  suggestPlacementsForHotel
} from './stayAllotmentSuggest.js';

describe('stayAllotmentSuggest', () => {
  const people = [
    {
      id: 'b1:primary',
      bookingId: 'b1',
      name: 'Ravi',
      gender: 'male',
      age: 'adult',
      primary: true,
      place: { kind: 'urban', city: 'Hyderabad' }
    },
    {
      id: 'b1:member:0',
      bookingId: 'b1',
      name: 'Padma',
      gender: 'female',
      age: 'adult',
      primary: false,
      place: { kind: 'urban', city: 'Hyderabad' }
    }
  ];

  const hotels = [
    {
      id: 'h_near',
      name: 'Near Hotel',
      distanceKm: 0.5,
      active: true,
      reserved: false,
      rooms: [{ roomNumber: '101', capacity: 2, kind: 'regular', roomType: 'ac', status: 'available' }]
    },
    {
      id: 'h_far',
      name: 'Far Hotel',
      distanceKm: 8,
      active: true,
      reserved: false,
      rooms: [{ roomNumber: '1', capacity: 4, kind: 'regular', roomType: 'non_ac', status: 'available' }]
    },
    {
      id: 'h_reserved',
      name: 'Reserved',
      distanceKm: 0.2,
      active: true,
      reserved: true,
      rooms: [{ roomNumber: '9', capacity: 10, kind: 'regular', roomType: 'ac', status: 'available' }]
    }
  ];

  it('groups selected people by booking', () => {
    const parties = partiesFromSelectedPeople(new Set(['b1:primary', 'b1:member:0']), people);
    expect(parties).toHaveLength(1);
    expect(parties[0].size).toBe(2);
  });

  it('splits same-booking selection into stay-cohort parties', () => {
    const splitPeople = [
      {
        id: 'b9:primary',
        bookingId: 'b9',
        name: 'Ravi',
        gender: 'male',
        age: 'adult',
        primary: true,
        stayStartDate: '2026-10-01',
        stayEndDate: '2026-10-03',
        place: { kind: 'urban', city: 'Hyderabad' }
      },
      {
        id: 'b9:member:0',
        bookingId: 'b9',
        name: 'Padma',
        gender: 'female',
        age: 'adult',
        primary: false,
        stayStartDate: '2026-10-03',
        stayEndDate: '2026-10-05',
        place: { kind: 'urban', city: 'Hyderabad' }
      }
    ];
    const parties = partiesFromSelectedPeople(
      new Set(['b9:primary', 'b9:member:0']),
      splitPeople
    );
    expect(parties).toHaveLength(2);
    expect(parties.map((p) => `${p.stayStartDate}|${p.stayEndDate}`).sort()).toEqual([
      '2026-10-01|2026-10-03',
      '2026-10-03|2026-10-05'
    ]);
    expect(parties.every((p) => p.bookingId === 'b9')).toBe(true);
    expect(parties.every((p) => p.size === 1)).toBe(true);
  });

  it('allots a late-arriving family member into a room freed by early checkout sibling', () => {
    const hotelsTight = [
      {
        id: 'h_one',
        name: 'One Room',
        distanceKm: 0.4,
        active: true,
        reserved: false,
        rooms: [{ roomNumber: '7', capacity: 1, kind: 'regular', roomType: 'ac', status: 'available' }]
      }
    ];
    const earlyAllotted = [
      {
        hotelId: 'h_one',
        roomNumber: '7',
        checkInDate: '2026-10-01',
        checkOutDate: '2026-10-03',
        bookingId: 'b9',
        guests: [{ name: 'Ravi', gender: 'male', primary: true }]
      }
    ];
    const lateMember = [
      {
        id: 'b9:member:0',
        bookingId: 'b9',
        name: 'Padma',
        gender: 'female',
        age: 'adult',
        primary: false,
        stayStartDate: '2026-10-03',
        stayEndDate: '2026-10-05',
        place: { kind: 'urban', city: 'Hyderabad' }
      }
    ];
    const placements = suggestPlacementsForHotel({
      hotelId: 'h_one',
      hotels: hotelsTight,
      allotments: earlyAllotted,
      selectedIds: new Set(['b9:member:0']),
      people: lateMember
    });
    expect(placements).toHaveLength(1);
    expect(placements[0]).toMatchObject({
      hotelId: 'h_one',
      roomNumber: '7',
      bookingId: 'b9',
      stayStartDate: '2026-10-03',
      stayEndDate: '2026-10-05'
    });
  });

  it('treats checkout day as free for same-day check-in', () => {
    expect(staysOverlap('2026-10-01', '2026-10-05', '2026-10-05', '2026-10-08')).toBe(false);
    expect(staysOverlap('2026-10-01', '2026-10-05', '2026-10-04', '2026-10-08')).toBe(true);
    expect(staysOverlap('2026-10-01', '2026-10-03', '2026-10-03', '2026-10-05')).toBe(false);
  });

  it('can allot into a room freed by same-day checkout', () => {
    const waitPeople = [
      {
        id: 'b2:primary',
        bookingId: 'b2',
        name: 'Kiran',
        gender: 'male',
        age: 'adult',
        primary: true,
        stayStartDate: '2026-10-05',
        stayEndDate: '2026-10-08',
        place: { kind: 'urban', city: 'Hyderabad' }
      }
    ];
    const allotments = [
      {
        hotelId: 'h_near',
        roomNumber: '101',
        checkInDate: '2026-10-01',
        checkOutDate: '2026-10-05',
        guests: [
          { name: 'Leaving', gender: 'male', primary: true },
          { name: 'Leaving2', gender: 'female' }
        ]
      }
    ];
    const placements = suggestPlacementsForHotel({
      hotelId: 'h_near',
      hotels,
      allotments,
      selectedIds: new Set(['b2:primary']),
      people: waitPeople
    });
    expect(placements).toHaveLength(1);
    expect(placements[0]).toMatchObject({
      hotelId: 'h_near',
      roomNumber: '101',
      usedBefore: 0
    });
  });

  it('keeps the room blocked when stays overlap the checkout night', () => {
    const waitPeople = [
      {
        id: 'b3:primary',
        bookingId: 'b3',
        name: 'Arun',
        gender: 'male',
        age: 'adult',
        primary: true,
        stayStartDate: '2026-10-04',
        stayEndDate: '2026-10-08',
        place: { kind: 'urban', city: 'Hyderabad' }
      }
    ];
    const allotments = [
      {
        hotelId: 'h_near',
        roomNumber: '101',
        checkInDate: '2026-10-01',
        checkOutDate: '2026-10-05',
        guests: [
          { name: 'Staying', gender: 'male', primary: true },
          { name: 'Staying2', gender: 'female' }
        ]
      }
    ];
    const placements = suggestPlacementsForHotel({
      hotelId: 'h_near',
      hotels,
      allotments,
      selectedIds: new Set(['b3:primary']),
      people: waitPeople
    });
    expect(placements).toHaveLength(0);
  });

  it('places selection into a chosen hotel on drop', () => {
    const placements = suggestPlacementsForHotel({
      hotelId: 'h_near',
      hotels,
      allotments: [],
      selectedIds: new Set(['b1:primary', 'b1:member:0']),
      people
    });
    expect(placements).toHaveLength(1);
    expect(placements[0]).toMatchObject({
      hotelId: 'h_near',
      roomNumber: '101',
      bookingId: 'b1'
    });
    expect(placements[0].members).toHaveLength(2);
  });

  it('expands a large family across multiple rooms for a tight fill', () => {
    const bigFamily = [
      {
        id: 'b5:primary',
        bookingId: 'b5',
        name: 'Father',
        gender: 'male',
        age: 'adult',
        primary: true,
        place: { kind: 'urban', city: 'Hyderabad' }
      },
      {
        id: 'b5:member:0',
        bookingId: 'b5',
        name: 'Mother',
        gender: 'female',
        age: 'adult',
        primary: false,
        place: { kind: 'urban', city: 'Hyderabad' }
      },
      {
        id: 'b5:member:1',
        bookingId: 'b5',
        name: 'Son',
        gender: 'male',
        age: 'child',
        primary: false,
        place: { kind: 'urban', city: 'Hyderabad' }
      },
      {
        id: 'b5:member:2',
        bookingId: 'b5',
        name: 'Daughter',
        gender: 'female',
        age: 'child',
        primary: false,
        place: { kind: 'urban', city: 'Hyderabad' }
      },
      {
        id: 'b5:member:3',
        bookingId: 'b5',
        name: 'Grandma',
        gender: 'female',
        age: 'senior',
        primary: false,
        place: { kind: 'urban', city: 'Hyderabad' }
      }
    ];
    const multiRoomHotels = [
      {
        id: 'h_split',
        name: 'Split Hotel',
        distanceKm: 1,
        active: true,
        reserved: false,
        rooms: [
          { roomNumber: '201', capacity: 2, kind: 'regular', roomType: 'ac', status: 'available' },
          { roomNumber: '202', capacity: 3, kind: 'regular', roomType: 'ac', status: 'available' },
          { roomNumber: '203', capacity: 2, kind: 'regular', roomType: 'non_ac', status: 'available' }
        ]
      }
    ];
    const placements = suggestPlacementsForHotel({
      hotelId: 'h_split',
      hotels: multiRoomHotels,
      allotments: [],
      selectedIds: new Set(bigFamily.map((p) => p.id)),
      people: bigFamily
    });
    expect(placements.length).toBeGreaterThan(1);
    expect(placements.every((p) => p.hotelId === 'h_split')).toBe(true);
    expect(placements.every((p) => p.bookingId === 'b5')).toBe(true);
    expect(placements.every((p) => p.splitPart)).toBe(true);
    const placedIds = placements.flatMap((p) => p.members.map((m) => m.id)).sort();
    expect(placedIds).toEqual(bigFamily.map((p) => p.id).sort());
    const rooms = new Set(placements.map((p) => p.roomNumber));
    expect(rooms.size).toBe(placements.length);

    const suggestion = suggestHotelsForSelection({
      hotels: multiRoomHotels,
      allotments: [],
      selectedIds: new Set(bigFamily.map((p) => p.id)),
      people: bigFamily
    });
    expect(suggestion.uncoveredPartyIds).toEqual([]);
    expect(suggestion.placements.length).toBeGreaterThan(1);
    expect(suggestion.ranked[0].hotelId).toBe('h_split');
  });

  it('leaves a party uncovered when hotel free beds cannot cover the family', () => {
    const crowd = Array.from({ length: 6 }, (_, i) => ({
      id: `b6:${i}`,
      bookingId: 'b6',
      name: `Guest ${i}`,
      gender: 'male',
      age: 'adult',
      primary: i === 0,
      place: { kind: 'urban', city: 'Hyderabad' }
    }));
    const tinyHotel = [
      {
        id: 'h_tiny',
        name: 'Tiny',
        distanceKm: 0.4,
        active: true,
        reserved: false,
        rooms: [
          { roomNumber: '1', capacity: 2, kind: 'regular', roomType: 'ac', status: 'available' },
          { roomNumber: '2', capacity: 2, kind: 'regular', roomType: 'ac', status: 'available' }
        ]
      }
    ];
    const placements = suggestPlacementsForHotel({
      hotelId: 'h_tiny',
      hotels: tinyHotel,
      allotments: [],
      selectedIds: new Set(crowd.map((p) => p.id)),
      people: crowd
    });
    expect(placements).toHaveLength(0);
  });

  it('ranks nearer non-reserved hotels first and proposes exact capacity', () => {
    const suggestion = suggestHotelsForSelection({
      hotels,
      allotments: [],
      selectedIds: new Set(['b1:primary', 'b1:member:0']),
      people
    });
    expect(suggestion.ranked.map((h) => h.hotelId)).toEqual(['h_near', 'h_far']);
    expect(suggestion.placements).toHaveLength(1);
    expect(suggestion.placements[0]).toMatchObject({
      hotelId: 'h_near',
      roomNumber: '101',
      exactMatch: true
    });
    expect(suggestion.ranked[0].inProposal).toBe(true);
  });

  it('pages hotels by five', () => {
    const ranked = Array.from({ length: 12 }, (_, i) => ({ hotelId: `h${i}` }));
    const page0 = hotelSuggestionPage(ranked, 0, 5);
    expect(page0.items).toHaveLength(5);
    expect(page0.totalPages).toBe(3);
  });

  it('summarises hotel room fill and locations', () => {
    const hotel = {
      id: 'h_near',
      rooms: [
        { roomNumber: '101', capacity: 2 },
        { roomNumber: '102', capacity: 4 },
        { roomNumber: '103', capacity: 3 }
      ]
    };
    const allotments = [
      {
        hotelId: 'h_near',
        roomNumber: '101',
        personCount: 2,
        place: { kind: 'urban', city: 'Tirupati' },
        guests: [{ name: 'A' }, { name: 'B' }]
      },
      {
        hotelId: 'h_near',
        roomNumber: '102',
        personCount: 1,
        place: { kind: 'urban', city: 'Tirupati' },
        guests: [{ name: 'C' }]
      }
    ];
    expect(hotelRoomFillCounts(hotel, allotments)).toEqual({
      full: 1,
      partial: 1,
      free: 1,
      roomCount: 3
    });
    expect(hotelPeopleAccommodatedSoFar('h_near', allotments)).toBe(3);
    expect(hotelLocationPeopleSummary('h_near', allotments)).toEqual([
      { name: 'Tirupati', count: 3 }
    ]);
  });

  it('describes moves from a prior room when re-allotting', () => {
    const moves = priorAllotmentMoves(
      {
        bookingId: 'b1',
        hotelId: 'h2',
        hotelName: 'New Hotel',
        roomNumber: '202',
        members: [{ name: 'Veeraiah', mobile: '9959129737' }]
      },
      [
        {
          bookingId: 'b1',
          hotelId: 'h1',
          hotelName: 'Old Hotel',
          roomNumber: '501',
          guests: [{ name: 'Veeraiah', mobile: '9959129737', primary: true }]
        }
      ]
    );
    expect(moves).toEqual([
      {
        name: 'Veeraiah',
        fromHotel: 'Old Hotel',
        fromRoom: '501',
        toHotel: 'New Hotel',
        toRoom: '202'
      }
    ]);
    expect(formatAllotmentMovesMessage(moves)).toContain('Old Hotel #501 → New Hotel #202');
  });

  it('merges placements that share a room for one confirm panel', () => {
    const grouped = groupPlacementsByRoom([
      {
        bookingId: 'b1',
        hotelId: 'h_near',
        roomNumber: '101',
        members: [{ name: 'Ravi' }]
      },
      {
        bookingId: 'b2',
        hotelId: 'h_near',
        roomNumber: '101',
        members: [{ name: 'Sita' }]
      },
      {
        bookingId: 'b3',
        hotelId: 'h_near',
        roomNumber: '202',
        members: [{ name: 'Other' }]
      }
    ]);
    expect(grouped).toHaveLength(2);
    const room101 = grouped.find((g) => g.roomNumber === '101');
    expect(room101.members.map((m) => m.name)).toEqual(['Ravi', 'Sita']);
    expect(room101.subPlacements).toHaveLength(2);

    const expanded = expandGroupedPlacementChoice({
      placement: room101,
      subPlacements: room101.subPlacements,
      alternatives: [{ roomNumber: '303', roomType: 'ac', capacity: 4 }],
      altIndex: 0
    });
    expect(expanded).toHaveLength(2);
    expect(expanded.map((p) => p.bookingId)).toEqual(['b1', 'b2']);
    expect(expanded.every((p) => p.roomNumber === '303')).toBe(true);
  });

  it('ranks multiple smart room options in a hotel', () => {
    const hotel = {
      id: 'h_near',
      name: 'Near Hotel',
      distanceKm: 0.5,
      active: true,
      reserved: false,
      rooms: [
        { roomNumber: '101', capacity: 2, kind: 'regular', roomType: 'ac', status: 'available' },
        { roomNumber: '202', capacity: 4, kind: 'regular', roomType: 'non_ac', status: 'available' },
        { roomNumber: '303', capacity: 2, kind: 'regular', roomType: 'non_ac', status: 'available' }
      ]
    };
    const options = listSmartRoomOptions(
      'h_near',
      [
        { name: 'A', gender: 'male' },
        { name: 'B', gender: 'female' }
      ],
      [hotel],
      []
    );
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(options[0].roomNumber).toBe('101');
    expect(options[0].exactMatch).toBe(true);
  });
});
