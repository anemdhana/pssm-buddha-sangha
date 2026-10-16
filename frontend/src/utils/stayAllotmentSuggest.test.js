import { describe, expect, it } from 'vitest';
import {
  expandGroupedPlacementChoice,
  groupPlacementsByRoom,
  hotelLocationPeopleSummary,
  hotelPeopleAccommodatedSoFar,
  hotelRoomFillCounts,
  hotelSuggestionPage,
  listSmartRoomOptions,
  partiesFromSelectedPeople,
  suggestHotelsForSelection
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
