const { getDb } = require('../db');
const roomsService = require('./roomsService');

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function mapReservation(row) {
  return {
    id: row.id,
    room_id: row.room_id,
    date: row.date,
    time_start: row.time_start,
    time_end: row.time_end,
    purpose: row.purpose,
    person_name: row.person_name,
  };
}

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) {
    return false;
  }
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function listReservationsForRoom(roomId, from, to) {
  if (!roomsService.getRoomById(roomId)) {
    return { status: 404, error: 'Sala nie istnieje' };
  }

  if (from === undefined || to === undefined || from === '' || to === '') {
    return { status: 400, error: 'Parametry from i to są wymagane (YYYY-MM-DD)' };
  }

  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    return { status: 400, error: 'Nieprawidłowy format daty — użyj YYYY-MM-DD' };
  }

  if (from > to) {
    return { status: 400, error: 'from nie może być późniejsze niż to' };
  }

  const rows = getDb()
    .prepare(
      `
      SELECT id, room_id, date, time_start, time_end, purpose, person_name
      FROM reservations
      WHERE room_id = ? AND date >= ? AND date <= ?
      ORDER BY date, time_start
    `
    )
    .all(roomId, from, to);

  return { status: 200, reservations: rows.map(mapReservation) };
}

function isValidTime(value) {
  return typeof value === 'string' && TIME_RE.test(value);
}

function getReservationById(id) {
  const row = getDb()
    .prepare(
      `
      SELECT id, room_id, date, time_start, time_end, purpose, person_name
      FROM reservations
      WHERE id = ?
    `
    )
    .get(id);
  return row ? mapReservation(row) : null;
}

function createReservation(roomId, body) {
  if (!roomsService.getRoomById(roomId)) {
    return { status: 404, error: 'Sala nie istnieje' };
  }

  const date = typeof body.date === 'string' ? body.date.trim() : '';
  const timeStart =
    typeof body.time_start === 'string' ? body.time_start.trim() : '';
  const timeEnd = typeof body.time_end === 'string' ? body.time_end.trim() : '';
  const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : '';
  const personName =
    typeof body.person_name === 'string' ? body.person_name.trim() : '';

  if (!isValidIsoDate(date)) {
    return { status: 400, error: 'Nieprawidłowa data — użyj YYYY-MM-DD' };
  }

  if (!isValidTime(timeStart) || !isValidTime(timeEnd)) {
    return {
      status: 400,
      error: 'Godziny muszą być w formacie HH:MM (24h)',
    };
  }

  if (timeEnd <= timeStart) {
    return {
      status: 400,
      error: 'time_end musi być późniejsze niż time_start',
    };
  }

  if (!purpose || !personName) {
    return { status: 400, error: 'Pola purpose i person_name są wymagane' };
  }

  const db = getDb();
  const findConflict = db.prepare(`
    SELECT id FROM reservations
    WHERE room_id = ? AND date = ?
      AND time_start < ? AND time_end > ?
    LIMIT 1
  `);
  const insert = db.prepare(`
    INSERT INTO reservations (
      room_id, date, time_start, time_end, purpose, person_name, created_at
    )
    VALUES (@room_id, @date, @time_start, @time_end, @purpose, @person_name, @created_at)
  `);

  const createdAt = new Date().toISOString();

  const insertReservation = db.transaction(() => {
    const conflict = findConflict.get(roomId, date, timeEnd, timeStart);
    if (conflict) {
      return { conflict: true };
    }

    const result = insert.run({
      room_id: roomId,
      date,
      time_start: timeStart,
      time_end: timeEnd,
      purpose,
      person_name: personName,
      created_at: createdAt,
    });

    return { id: result.lastInsertRowid };
  });

  const outcome = insertReservation();
  if (outcome.conflict) {
    return {
      status: 409,
      error: 'Termin koliduje z istniejącą rezerwacją',
    };
  }

  return {
    status: 201,
    reservation: getReservationById(outcome.id),
  };
}

module.exports = {
  listReservationsForRoom,
  createReservation,
  isValidIsoDate,
};
