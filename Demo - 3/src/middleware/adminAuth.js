function adminAuth(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    next();
    return;
  }

  const key = req.get('X-Admin-Key');
  if (key !== secret) {
    res.status(401).json({ error: 'Brak uprawnień administratora' });
    return;
  }

  next();
}

module.exports = { adminAuth };
