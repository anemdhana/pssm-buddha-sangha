import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StayBreadcrumb } from '../components/stay/StayBreadcrumb.jsx';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { compressHotelImageFile } from '../utils/hotelImage.js';

let roomKeySeq = 0;
function nextRoomKey() {
  roomKeySeq += 1;
  return `room_${Date.now()}_${roomKeySeq}`;
}

const emptyRoom = () => ({
  key: nextRoomKey(),
  roomNumber: '',
  capacity: '4',
  kind: 'regular',
  roomType: 'ac',
  genderAllowed: ''
});

const emptyForm = () => ({
  name: '',
  address: '',
  contact: '',
  image: '',
  distanceKm: '',
  active: true,
  reserved: false,
  rooms: [emptyRoom()]
});

function roomsFromHotel(hotel) {
  const list = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
  if (list.length === 0) return [emptyRoom()];
  return list.map((room) => ({
    key: nextRoomKey(),
    roomNumber: room.roomNumber || '',
    capacity: room.capacity != null ? String(room.capacity) : '4',
    kind: room.kind || 'regular',
    roomType: room.roomType === 'non_ac' ? 'non_ac' : 'ac',
    genderAllowed: room.genderAllowed || ''
  }));
}

function notify(message, status = 'success') {
  if (window.UIkit) {
    window.UIkit.notification({ message, status, pos: 'top-center', timeout: 2200 });
  }
}

export function StayHotelFormPage() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { signedIn, isAccommodationAdmin, isPssmAdmin, loading: authLoading } = useAuth();
  const { picked } = useEventPick();
  const canManage = isAccommodationAdmin || isPssmAdmin;
  const isEdit = Boolean(hotelId);

  const [form, setForm] = useState(emptyForm);
  const [hotelEventId, setHotelEventId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const imageInputRef = useRef(null);
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (!signedIn || !canManage || !isEdit) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    api
      .getHotel(hotelId)
      .then((res) => {
        if (cancelled) return;
        const hotel = res.data || {};
        setHotelEventId(hotel.eventId || '');
        setForm({
          name: hotel.name || '',
          address: hotel.address || '',
          contact: hotel.contact || '',
          image: hotel.image || '',
          distanceKm: hotel.distanceKm != null ? String(hotel.distanceKm) : '',
          active: hotel.active !== false,
          reserved: Boolean(hotel.reserved),
          rooms: roomsFromHotel(hotel)
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load hotel.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, canManage, isEdit, hotelId]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateRoom(key, field, value) {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) => {
        if (room.key !== key) return room;
        const next = { ...room, [field]: value };
        if (field === 'kind' && value === 'regular') next.genderAllowed = '';
        if (field === 'kind' && value !== 'regular' && !next.genderAllowed) {
          next.genderAllowed = 'gents';
        }
        return next;
      })
    }));
  }

  function addRoom() {
    setForm((prev) => ({ ...prev, rooms: [...prev.rooms, emptyRoom()] }));
  }

  function removeRoom(key) {
    setForm((prev) => {
      const next = prev.rooms.filter((room) => room.key !== key);
      return { ...prev, rooms: next.length ? next : [emptyRoom()] };
    });
  }

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageBusy(true);
    setError('');
    try {
      const dataUrl = await compressHotelImageFile(file);
      updateField('image', dataUrl);
    } catch (err) {
      setError(err.message || 'Could not attach hotel image.');
    } finally {
      setImageBusy(false);
    }
  }

  async function onSave(e) {
    e.preventDefault();
    if (!canManage || saving) return;
    const eventId = String(hotelEventId || picked.id || '').trim();
    if (!eventId) {
      setError('Pick an event in the header before saving a hotel.');
      return;
    }
    setError('');
    setSaving(true);
    const latest = formRef.current || form;
    const image = String(latest.image || '').trim();
    const payload = {
      eventId,
      name: latest.name.trim(),
      address: latest.address.trim(),
      contact: latest.contact.trim(),
      image,
      distanceKm: Number(latest.distanceKm),
      active: Boolean(latest.active),
      reserved: Boolean(latest.reserved),
      rooms: latest.rooms.map((room) => ({
        roomNumber: String(room.roomNumber || '').trim(),
        capacity: Number(room.capacity),
        kind: room.kind,
        roomType: room.roomType,
        genderAllowed: room.kind === 'regular' ? '' : room.genderAllowed,
        status: 'available'
      }))
    };
    try {
      const res = isEdit
        ? await api.updateHotel(hotelId, payload)
        : await api.createHotel(payload);
      const savedImage = String(res?.data?.image || '').trim();
      if (image && !savedImage) {
        throw new Error(
          'Hotel saved, but the image was not stored. Restart the backend and try attaching the image again.'
        );
      }
      notify(isEdit ? 'Hotel updated.' : 'Hotel saved.');
      navigate('/stay/hotels');
    } catch (err) {
      setError(err.message || 'Could not save hotel.');
    } finally {
      setSaving(false);
    }
  }

  const crumbs = [
    { label: 'Stay' },
    { label: 'Hotels & rooms', to: '/stay/hotels' },
    { label: isEdit ? 'Edit hotel' : 'Add hotel' }
  ];

  if (authLoading || (isEdit && loading)) {
    return (
      <main className="uk-section uk-section-small uk-padding-remove-top">
        <div className="uk-container app-column">
          <p className="hint">Loading…</p>
        </div>
      </main>
    );
  }

  if (!signedIn || !canManage) {
    return (
      <main className="uk-section uk-section-small uk-padding-remove-top">
        <div className="uk-container app-column app-narrow">
          <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
            <StayBreadcrumb crumbs={crumbs} />
            <header className="x-step-head form-head">
              <h2 className="form-title">Hotels &amp; rooms</h2>
              <p className="form-summary">
                Only Accommodation Admin or PSSM Admin can manage hotels and rooms.
              </p>
            </header>
            <Link className="uk-button uk-button-default" to="/">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!isEdit && !picked.id) {
    return (
      <main className="uk-section uk-section-small uk-padding-remove-top">
        <div className="uk-container app-column app-narrow">
          <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
            <StayBreadcrumb crumbs={crumbs} />
            <header className="x-step-head form-head">
              <h2 className="form-title">Add hotel</h2>
              <p className="form-summary">Pick an event in the header first. New hotels belong to that event.</p>
            </header>
            <Link className="uk-button uk-button-default" to="/stay/hotels">
              Back to hotels
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <StayBreadcrumb crumbs={crumbs} />

          <header className="x-step-head form-head">
            <h2 className="form-title">{isEdit ? 'Edit hotel' : 'Add hotel'}</h2>
            <p className="form-summary">
              {isEdit
                ? 'Hotel details and rooms for this event. Use + / − on the room table to add or remove rows.'
                : `Adding for ${picked.name}. Use + / − on the room table to add or remove rows.`}
            </p>
          </header>

          {error ? <p className="uk-text-danger uk-margin-small">{error}</p> : null}

          <form className="uk-form-stacked" onSubmit={onSave}>
            <section className="x-group" aria-labelledby="hotel-details-title">
              <h3 className="x-group-title" id="hotel-details-title">
                <span uk-icon="icon: home; ratio: 0.75" /> Hotel details
              </h3>
              <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
                <div className="x-field uk-width-1-1">
                  <label className="x-label" htmlFor="hotel-name">
                    Hotel name
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="hotel-name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Sai Prakash"
                    required
                  />
                </div>
                <div className="x-field uk-width-1-1">
                  <label className="x-label" htmlFor="hotel-address">
                    Address
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="hotel-address"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Near Santh Kabir Das Pyramid Centre"
                    required
                  />
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="hotel-contact">
                    Contact number
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="hotel-contact"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.contact}
                    onChange={(e) => updateField('contact', e.target.value)}
                    placeholder="040-23203131"
                    required
                  />
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="hotel-distance">
                    Distance from event (km)
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="hotel-distance"
                    inputMode="decimal"
                    value={form.distanceKm}
                    onChange={(e) => updateField('distanceKm', e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="0.4"
                    required
                  />
                </div>
                <div className="x-field">
                  <label className="x-label">Active</label>
                  <label className="uk-flex uk-flex-middle gap-8">
                    <input
                      className="uk-checkbox"
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => updateField('active', e.target.checked)}
                    />
                    <span className="uk-text-small">Show for allotment</span>
                  </label>
                </div>
                <div className="x-field">
                  <label className="x-label">Reserved</label>
                  <label className="uk-flex uk-flex-middle gap-8">
                    <input
                      className="uk-checkbox"
                      type="checkbox"
                      checked={form.reserved}
                      onChange={(e) => updateField('reserved', e.target.checked)}
                    />
                    <span className="uk-text-small">Manual assignment only</span>
                  </label>
                </div>
                <div className="x-field uk-width-1-1">
                  <span className="x-label" id="hotel-image-label">
                    Hotel image
                  </span>
                  <div className="x-hotel-image-attach" aria-labelledby="hotel-image-label">
                    <div className={`x-hotel-image-preview${form.image ? ' has-image' : ''}`}>
                      {form.image ? (
                        <img src={form.image} alt="" />
                      ) : (
                        <span uk-icon="icon: image; ratio: 1.2" />
                      )}
                    </div>
                    <div className="x-hotel-image-actions">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="uk-hidden"
                        onChange={onPickImage}
                        aria-label="Attach hotel image"
                      />
                      <button
                        type="button"
                        className="uk-button uk-button-default uk-button-small"
                        disabled={imageBusy}
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {imageBusy ? 'Working…' : form.image ? 'Change image' : 'Attach image'}
                      </button>
                      {form.image ? (
                        <button
                          type="button"
                          className="uk-button uk-button-text uk-button-small"
                          onClick={() => updateField('image', '')}
                        >
                          Remove
                        </button>
                      ) : null}
                      <p className="hint uk-margin-remove">Small photo of the hotel front — optional.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="x-group" aria-labelledby="hotel-rooms-title">
              <div className="hotel-rooms-head">
                <h3 className="x-group-title" id="hotel-rooms-title">
                  <span uk-icon="icon: grid; ratio: 0.75" /> Rooms
                </h3>
                <button
                  type="button"
                  className="uk-button uk-button-default uk-button-small hotel-room-add"
                  onClick={addRoom}
                  aria-label="Add room row"
                >
                  <span uk-icon="icon: plus; ratio: 0.8" /> Add room
                </button>
              </div>

              <div className="uk-overflow-auto">
                <table className="uk-table uk-table-small uk-table-divider hotel-rooms-table">
                  <thead>
                    <tr>
                      <th scope="col">Room no.</th>
                      <th scope="col">Capacity</th>
                      <th scope="col">Kind</th>
                      <th scope="col">AC / Non-AC</th>
                      <th scope="col">Who may stay</th>
                      <th scope="col" className="hotel-room-actions">
                        <span className="uk-text-meta">Rows</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.rooms.map((room) => {
                      const needsGender = room.kind === 'dormitory' || room.kind === 'hall';
                      return (
                        <tr key={room.key}>
                          <td>
                            <input
                              className="uk-input uk-form-small"
                              value={room.roomNumber}
                              onChange={(e) => updateRoom(room.key, 'roomNumber', e.target.value)}
                              placeholder="231"
                              required
                              aria-label="Room number"
                            />
                          </td>
                          <td>
                            <input
                              className="uk-input uk-form-small hotel-room-capacity"
                              inputMode="numeric"
                              value={room.capacity}
                              onChange={(e) =>
                                updateRoom(room.key, 'capacity', e.target.value.replace(/\D/g, ''))
                              }
                              placeholder="4"
                              required
                              aria-label="Capacity"
                            />
                          </td>
                          <td>
                            <select
                              className="uk-select uk-form-small"
                              value={room.kind}
                              onChange={(e) => updateRoom(room.key, 'kind', e.target.value)}
                              aria-label="Kind of room"
                            >
                              <option value="regular">Regular</option>
                              <option value="dormitory">Dormitory</option>
                              <option value="hall">Hall</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="uk-select uk-form-small"
                              value={room.roomType}
                              onChange={(e) => updateRoom(room.key, 'roomType', e.target.value)}
                              aria-label="AC or Non-AC"
                            >
                              <option value="ac">AC</option>
                              <option value="non_ac">Non-AC</option>
                            </select>
                          </td>
                          <td>
                            {needsGender ? (
                              <select
                                className="uk-select uk-form-small"
                                value={room.genderAllowed || 'gents'}
                                onChange={(e) => updateRoom(room.key, 'genderAllowed', e.target.value)}
                                aria-label="Who may stay"
                                required
                              >
                                <option value="gents">Gents only</option>
                                <option value="ladies">Ladies only</option>
                              </select>
                            ) : (
                              <span className="uk-text-meta">—</span>
                            )}
                          </td>
                          <td className="hotel-room-actions">
                            <button
                              type="button"
                              className="uk-button uk-button-text hotel-room-icon-btn"
                              onClick={() => removeRoom(room.key)}
                              aria-label={`Remove room ${room.roomNumber || ''}`.trim()}
                            >
                              <span uk-icon="icon: minus-circle; ratio: 0.95" />
                            </button>
                            <button
                              type="button"
                              className="uk-button uk-button-text hotel-room-icon-btn"
                              onClick={addRoom}
                              aria-label="Add room row"
                            >
                              <span uk-icon="icon: plus-circle; ratio: 0.95" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="step-actions is-split">
              <Link className="uk-button uk-button-default" to="/stay/hotels">
                Cancel
              </Link>
              <button className="uk-button uk-button-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Update hotel' : 'Save hotel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
