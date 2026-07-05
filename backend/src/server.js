require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");
const corsMiddleware = require("./config/cors.config");
const { isProduction, port, validateEnv } = require("./config/app.config");
const requestContext = require("./middlewares/requestContext");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

validateEnv();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(requestContext);
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(corsMiddleware());
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/webhooks")) {
    return next();
  }

  return express.json({ limit: "10mb" })(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(process.cwd(), "public/uploads");
app.use(isProduction ? "/backend/uploads" : "/uploads", express.static(uploadsPath));

const apiRoutes = require("./app");
app.use("/", apiRoutes);

const webhookRouter = require("./routes/webhook.routes");
app.use("/webhooks", express.raw({ type: "application/json" }), webhookRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("Razorpay webhook ready at /webhooks/razorpay");
});
