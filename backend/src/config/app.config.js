const requiredEnv = [
  "COUCHBASE_CONN_STR",
  "COUCHBASE_USERNAME",
  "COUCHBASE_PASSWORD",
  "COUCHBASE_BUCKET",
  "COUCHBASE_COLLECTION",
  "JWT_SECRET",
  "REFRESH_SECRET",
];

const productionRequiredEnv = [
  "FRONTEND_URL",
  "COOKIE_DOMAIN",
];

function readCsvEnv(name, fallback = []) {
  const value = process.env[name];
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateEnv() {
  const missing = requiredEnv.filter((name) => !process.env[name]);

  if (process.env.NODE_ENV === "production") {
    missing.push(...productionRequiredEnv.filter((name) => !process.env[name]));
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (isProduction && process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }

  if (!isProduction && process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn("Warning: JWT_SECRET should be at least 32 characters long before production.");
  }
}

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  isProduction,
  port: process.env.PORT || 5000,
  allowedOrigins: readCsvEnv("ALLOWED_ORIGINS", [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    "http://147.79.70.252:8080",
    "https://sushilmaratha.in",
    "https://www.sushilmaratha.in",
  ]),
  validateEnv,
};
