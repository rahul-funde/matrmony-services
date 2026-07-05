const { randomUUID } = require("crypto");

function requestContext(req, res, next) {
  const requestId = req.header("X-Request-Id") || randomUUID();
  const language = req.header("Accept-Language") || "mr";

  req.requestId = requestId;
  req.language = language.split(",")[0].trim().toLowerCase();

  res.setHeader("X-Request-Id", requestId);
  next();
}

module.exports = requestContext;
