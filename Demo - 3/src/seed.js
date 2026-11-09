const { getDb } = require('./db');

const DEV_ROOMS = [
  {
    name: 'A-101',
    building: 'Budynek A',
    capacity: 30,
    has_projector: 1,
    has_computers: 0,
  },
  {
    name: 'B-205',
    building: 'Budynek B',
    capacity: 20,
    has_projector: 1,
    has_computers: 1,
  },
];

function seedRoomsIfEmpty() {
  const db = getDb();
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM rooms').get();
  if (n > 0) {
    return;
  }

  const createdAt = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO rooms (name, building, capacity, has_projector, has_computers, created_at)
    VALUES (@name, @building, @capacity, @has_projector, @has_computers, @created_at)
  `);

  const insertMany = db.transaction((rooms) => {
    for (const room of rooms) {
      insert.run({ ...room, created_at: createdAt });
    }
  });

  insertMany(DEV_ROOMS);
}

const DEV_RESERVATIONS = [
  {
    roomIndex: 0,
    date: '2026-11-10',
    time_start: '10:00',
    time_end: '12:00',
    purpose: 'Spotkanie działu',
    person_name: 'Anna Nowak',
  },
  {
    roomIndex: 0,
    date: '2026-11-12',
    time_start: '14:00',
    time_end: '16:00',
    purpose: 'Konferencja projektowa',
    person_name: 'Piotr Wiśniewski',
  },
  {
    roomIndex: 1,
    date: '2026-11-10',
    time_start: '09:00',
    time_end: '11:00',
    purpose: 'Zajęcia laboratoryjne',
    person_name: 'Maria Kowalczyk',
  },
];

function seedReservationsIfEmpty() {
  const db = getDb();
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM reservations').get();
  if (n > 0) {
    return;
  }

  const roomIds = db
    .prepare('SELECT id FROM rooms ORDER BY id ASC')
    .all()
    .map((r) => r.id);
  if (roomIds.length === 0) {
    return;
  }

  const createdAt = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO reservations (room_id, date, time_start, time_end, purpose, person_name, created_at)
    VALUES (@room_id, @date, @time_start, @time_end, @purpose, @person_name, @created_at)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      const roomId = roomIds[item.roomIndex];
      if (!roomId) {
        continue;
      }
      insert.run({
        room_id: roomId,
        date: item.date,
        time_start: item.time_start,
        time_end: item.time_end,
        purpose: item.purpose,
        person_name: item.person_name,
        created_at: createdAt,
      });
    }
  });

  insertMany(DEV_RESERVATIONS);
}

function seedIfEmpty() {
  seedRoomsIfEmpty();
  seedReservationsIfEmpty();
}

module.exports = { seedRoomsIfEmpty, seedReservationsIfEmpty, seedIfEmpty };
