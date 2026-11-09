PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  has_projector INTEGER NOT NULL DEFAULT 0 CHECK (has_projector IN (0, 1)),
  has_computers INTEGER NOT NULL DEFAULT 0 CHECK (has_computers IN (0, 1)),
  created_at TEXT NOT NULL,
  UNIQUE (name, building)
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  purpose TEXT NOT NULL,
  person_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_reservations_room_date
  ON reservations (room_id, date);
