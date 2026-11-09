const { initDb, getDb, getDbPath } = require('../src/db');

initDb();
console.log('DB path:', getDbPath());

const rows = getDb()
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  )
  .all();

console.log('Tables:', rows.map((r) => r.name).join(', '));
