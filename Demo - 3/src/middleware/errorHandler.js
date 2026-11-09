function apiNotFound(req, res, next) {
  if (!req.path.startsWith('/api')) {
    next();
    return;
  }
  res.status(404).json({ error: 'Nie znaleziono zasobu' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({ error: 'Nieprawidłowy JSON w treści żądania' });
    return;
  }

  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error(err);
    res.status(500).json({ error: 'Błąd wewnętrzny serwera' });
    return;
  }

  res.status(status).json({
    error: err.message || 'Żądanie nie powiodło się',
  });
}

module.exports = { apiNotFound, errorHandler };
