const express = require("express");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userprofileRoutes = require("./routes/userprofile.routes");
const adminRoutes = require("./routes/admin.routes");
const userInterest = require("./routes/interests.route");
const packageRoutes = require("./routes/package.routes");
const uploadImages = require("./routes/upload.routes");
const deleteImages = require("./routes/delete.routes");
const dashboard = require("./routes/dashboard.routes");
const landingPage = require("./routes/landingPage.routes");
const planRoutes = require("./routes/plan.routes");
const paymentRoutes = require("./routes/payment.routes");
const socialMediaRoutes = require("./routes/socialmedia.routes");
const reportRoutes = require("./routes/report.routes");
const healthRoutes = require("./routes/health.routes");
const startExtendFemalePlansCron = require("./cron/extendPlans.cron");

const app = express.Router();

app.use("/", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/home", userprofileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/interest", userInterest);
app.use("/api/package", packageRoutes);
app.use("/api/upload", uploadImages);
app.use("/api/delete", deleteImages);
app.use("/api/dashboard", dashboard);
app.use("/api/landingPage", landingPage);
app.use("/memberships", planRoutes);
app.use("/api/payment", paymentRoutes);

app.use(
  "/payments",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../public/uploads/payments"))
);

app.use("/socialmedia", socialMediaRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/banners", require("./routes/banner.routes"));
app.use("/api/reports", reportRoutes);

if (process.env.DISABLE_CRON !== "true") {
  startExtendFemalePlansCron();
}

module.exports = app;
