class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 does not catch rejected promises from async handlers.
const asyncHandler = (handler) => (req, res, next) => handler(req, res, next).catch(next);

function notFound(_req, res) {
  res.status(404).json({ message: 'No such API endpoint' });
}

// Express identifies error handlers by their four arguments, so _next has to stay.
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body is not valid JSON' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ message: `That ${field} is already taken` });
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}

module.exports = { HttpError, asyncHandler, notFound, errorHandler };
