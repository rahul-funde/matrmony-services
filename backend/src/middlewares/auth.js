const jwt = require("jsonwebtoken");

function getBearerToken(req) {
  const authorization = req.header("Authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function authenticate(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Authentication required",
      requestId: req.requestId,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id || decoded.userId || decoded.sub;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Invalid or expired token",
      requestId: req.requestId,
    });
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user && (req.user.role || req.user.userType || req.user.type);

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
        requestId: req.requestId,
      });
    }

    next();
  };
}

const requireAdmin = requireRoles("admin", "superadmin", "super_admin");

module.exports = {
  authenticate,
  requireRoles,
  requireAdmin,
};
