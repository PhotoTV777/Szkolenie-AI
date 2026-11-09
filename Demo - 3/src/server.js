const path = require('path');
const express = require('express');
const { initDb } = require('./db');

initDb();

const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, '..', 'public');

const app = express();

app.use(express.json());
app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(
  '/api/rooms/:roomId/reservations',
  require('./routes/reservations')
);
app.use('/api/rooms', require('./routes/rooms'));

const { apiNotFound, errorHandler } = require('./middleware/errorHandler');
app.use(apiNotFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
