function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: "Route not found",
    requestId: req.requestId,
  });
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error("Server Error:", {
      requestId: req.requestId,
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(status).json({
    success: false,
    code: err.code || "INTERNAL_ERROR",
    message: status >= 500 ? "Internal Server Error" : err.message,
    requestId: req.requestId,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
