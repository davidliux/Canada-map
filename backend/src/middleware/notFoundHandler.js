const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.url}`,
      path: req.url,
      method: req.method,
    },
  });
};

module.exports = notFoundHandler;