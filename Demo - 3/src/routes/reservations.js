const express = require('express');
const reservationsService = require('../services/reservationsService');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const roomId = Number(req.params.roomId);
  if (!Number.isInteger(roomId) || roomId < 1) {
    res.status(400).json({ error: 'Nieprawidłowe id sali' });
    return;
  }

  const result = reservationsService.listReservationsForRoom(
    roomId,
    req.query.from,
    req.query.to
  );

  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.json(result.reservations);
});

router.post('/', (req, res) => {
  const roomId = Number(req.params.roomId);
  if (!Number.isInteger(roomId) || roomId < 1) {
    res.status(400).json({ error: 'Nieprawidłowe id sali' });
    return;
  }

  const result = reservationsService.createReservation(roomId, req.body);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(201).json(result.reservation);
});

module.exports = router;
