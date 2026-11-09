const { getDb } = require('../db');

function mapRoom(row) {
  return {
    id: row.id,
    name: row.name,
    building: row.building,
    capacity: row.capacity,
    has_projector: row.has_projector === 1,
    has_computers: row.has_computers === 1,
  };
}

function listRooms() {
  const rows = getDb()
    .prepare(
      'SELECT id, name, building, capacity, has_projector, has_computers FROM rooms ORDER BY building, name'
    )
    .all();
  return rows.map(mapRoom);
}

function getRoomById(id) {
  const row = getDb()
    .prepare(
      'SELECT id, name, building, capacity, has_projector, has_computers FROM rooms WHERE id = ?'
    )
    .get(id);
  return row ? mapRoom(row) : null;
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }
  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return null;
}

function createRoom(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const building = typeof body.building === 'string' ? body.building.trim() : '';
  const capacity = body.capacity;

  if (!name || !building) {
    return { status: 400, error: 'Pola name i building są wymagane' };
  }

  if (
    typeof capacity !== 'number' ||
    !Number.isInteger(capacity) ||
    capacity < 1
  ) {
    return { status: 400, error: 'capacity musi być liczbą całkowitą większą od 0' };
  }

  const hasProjector = parseBoolean(body.has_projector, false);
  const hasComputers = parseBoolean(body.has_computers, false);
  if (hasProjector === null || hasComputers === null) {
    return {
      status: 400,
      error: 'has_projector i has_computers muszą być wartościami logicznymi',
    };
  }

  const createdAt = new Date().toISOString();
  const insert = getDb().prepare(`
    INSERT INTO rooms (name, building, capacity, has_projector, has_computers, created_at)
    VALUES (@name, @building, @capacity, @has_projector, @has_computers, @created_at)
  `);

  try {
    const result = insert.run({
      name,
      building,
      capacity,
      has_projector: hasProjector ? 1 : 0,
      has_computers: hasComputers ? 1 : 0,
      created_at: createdAt,
    });
    return { status: 201, room: getRoomById(result.lastInsertRowid) };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return {
        status: 409,
        error: 'Sala o tej nazwie w tym budynku już istnieje',
      };
    }
    throw err;
  }
}

module.exports = { listRooms, getRoomById, createRoom };
