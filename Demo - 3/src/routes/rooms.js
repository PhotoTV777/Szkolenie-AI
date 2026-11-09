const express = require('express');
const roomsService = require('../services/roomsService');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(roomsService.listRooms());
});

router.post('/', adminAuth, (req, res) => {
  const result = roomsService.createRoom(req.body);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(201).json(result.room);
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Nieprawidłowe id sali' });
    return;
  }

  const room = roomsService.getRoomById(id);
  if (!room) {
    res.status(404).json({ error: 'Sala nie istnieje' });
    return;
  }

  res.json(room);
});

module.exports = router;
