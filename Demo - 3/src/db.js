const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const projectRoot = path.join(__dirname, '..');
const defaultDbPath = path.join(projectRoot, 'data', 'rooms.db');

let db;

function getDbPath() {
  const fromEnv = process.env.DB_PATH;
  if (!fromEnv) {
    return defaultDbPath;
  }
  return path.isAbsolute(fromEnv)
    ? fromEnv
    : path.join(projectRoot, fromEnv);
}

function initDb() {
  const dbPath = getDbPath();
  const dataDir = path.dirname(dbPath);

  fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  const { seedIfEmpty } = require('./seed');
  seedIfEmpty();

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

module.exports = { initDb, getDb, getDbPath };
