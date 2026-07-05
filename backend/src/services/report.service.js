import { connectToCouchbase } from "../config/db.config.js";

const BUCKET = process.env.COUCHBASE_BUCKET;
const SCOPE = process.env.COUCHBASE_SCOPE;

/**
 * 1️⃣ Revenue by Plan + Payment Mode (Offline/Online) with optional planId filter
 */
export const revenueByPlanAndMode = async (fromDate, toDate, planId = null) => {
  const { cluster } = await connectToCouchbase();

  let query = `
    SELECT
      p.planId,
      pl.name AS planName,
      CASE WHEN p.paymentMode LIKE "offline%" THEN "OFFLINE" ELSE "ONLINE" END AS paymentCategory,
      COUNT(1) AS transactions,
      SUM(p.amount) AS revenue
    FROM \`${BUCKET}\`.\`${SCOPE}\`.payments AS p
    LEFT JOIN \`${BUCKET}\`.\`${SCOPE}\`.plans AS pl
      ON KEYS p.planId
    WHERE p.status = "approved"
      AND p.createdAt BETWEEN $1 AND $2
  `;

  const parameters = [fromDate, toDate];

  if (planId) {
    query += ` AND p.planId = $3`;
    parameters.push(planId);
  }

  query += `
    GROUP BY p.planId, pl.name, CASE WHEN p.paymentMode LIKE "offline%" THEN "OFFLINE" ELSE "ONLINE" END
    ORDER BY planName;
  `;

  const { rows } = await cluster.query(query, { parameters });
  return rows;
};

/**
 * 2️⃣ Revenue Summary for Dashboard with optional planId filter
 */
export const revenueSummary = async (fromDate, toDate, planId = null) => {
  const { cluster } = await connectToCouchbase();

  let query = `
    SELECT
      COUNT(1) AS totalPayments,
      IFNULL(SUM(amount),0) AS totalRevenue,
      IFNULL(SUM(CASE WHEN paymentMode LIKE "offline%" THEN amount ELSE 0 END),0) AS offlineRevenue,
      IFNULL(SUM(CASE WHEN paymentMode NOT LIKE "offline%" THEN amount ELSE 0 END),0) AS onlineRevenue
    FROM \`${BUCKET}\`.\`${SCOPE}\`.payments
    WHERE status = "approved"
      AND createdAt BETWEEN $1 AND $2
  `;

  const parameters = [fromDate, toDate];
  if (planId) {
    query += ` AND planId = $3`;
    parameters.push(planId);
  }

  const { rows } = await cluster.query(query, { parameters });
  return rows[0] || {};
};

/**
 * 3️⃣ Revenue by Day (charts) with optional planId filter
 */
export const revenueByDay = async (fromDate, toDate, planId = null) => {
  const { cluster } = await connectToCouchbase();

  let query = `
    SELECT
      DATE_TRUNC_STR(createdAt, "day") AS day,
      SUM(amount) AS revenue
    FROM \`${BUCKET}\`.\`${SCOPE}\`.payments
    WHERE status = "approved"
      AND createdAt BETWEEN $1 AND $2
  `;

  const parameters = [fromDate, toDate];
  if (planId) {
    query += ` AND planId = $3`;
    parameters.push(planId);
  }

  query += `
    GROUP BY DATE_TRUNC_STR(createdAt, "day")
    ORDER BY DATE_TRUNC_STR(createdAt, "day");
  `;

  const { rows } = await cluster.query(query, { parameters });
  return rows;
};

/**
 * 4️⃣ Revenue by Plan with Active Paying Users with optional planId filter
 */
export const revenueByPlanWithUsers = async (fromDate, toDate, planId = null) => {
  const { cluster } = await connectToCouchbase();

  let query = `
    SELECT
      p.planId,
      pl.name AS planName,
      COUNT(DISTINCT META(p).id) AS activeUsers,
      SUM(p.amount) AS revenue
    FROM \`${BUCKET}\`.\`${SCOPE}\`.payments AS p
    LEFT JOIN \`${BUCKET}\`.\`${SCOPE}\`.plans AS pl
      ON KEYS p.planId
    WHERE p.status = "approved"
      AND p.createdAt BETWEEN $1 AND $2
  `;

  const parameters = [fromDate, toDate];
  if (planId) {
    query += ` AND p.planId = $3`;
    parameters.push(planId);
  }

  query += `
    GROUP BY p.planId, pl.name
    ORDER BY revenue DESC;
  `;

  const { rows } = await cluster.query(query, { parameters });
  return rows;
};


/**
 * Revenue grouped by period (day/week/month) or by plan/payment mode
 xample Requests

By Day (default)

GET /api/reports/revenue/period?fromDate=2026-01-01&toDate=2026-01-31


By Week

GET /api/reports/revenue/period?fromDate=2026-01-01&toDate=2026-01-31&groupBy=week


By Month

GET /api/reports/revenue/period?fromDate=2026-01-01&toDate=2026-01-31&groupBy=month


By Plan

GET /api/reports/revenue/period?fromDate=2026-01-01&toDate=2026-01-31&groupBy=plan


By Payment Mode

GET /api/reports/revenue/period?fromDate=2026-01-01&toDate=2026-01-31&groupBy=paymentMode
 */
export const revenueByPeriod = async (fromDate, toDate, groupBy = "day") => {
  const { cluster } = await connectToCouchbase();

  let groupExpr, selectExpr, joinExpr = "", groupByClause, orderBy;

  switch (groupBy) {
    case "week":
      // weekStart is the Monday of the week
      groupExpr = 'DATE_TRUNC_STR(p.createdAt, "week")';
      selectExpr = `${groupExpr} AS periodStart, DATE_ADD_STR(${groupExpr}, 6, "day") AS periodEnd, SUM(p.amount) AS revenue, COUNT(1) AS transactions`;
      groupByClause = groupExpr;
      orderBy = "periodStart";
      break;

    case "month":
      groupExpr = 'DATE_TRUNC_STR(p.createdAt, "month")';
      selectExpr = `${groupExpr} AS monthStart, SUM(p.amount) AS revenue, COUNT(1) AS transactions`;
      groupByClause = groupExpr;
      orderBy = "monthStart";
      break;

    case "plan":
      groupExpr = "p.planId";
      selectExpr = "p.planId, pl.name AS planName, SUM(p.amount) AS revenue, COUNT(1) AS transactions";
      joinExpr = `LEFT JOIN \`${BUCKET}\`.\`${SCOPE}\`.plans AS pl ON KEYS p.planId`;
      groupByClause = "p.planId, pl.name";
      orderBy = "planName";
      break;

    case "paymentMode":
      groupExpr = 'CASE WHEN p.paymentMode LIKE "offline%" THEN "OFFLINE" ELSE "ONLINE" END';
      selectExpr = `${groupExpr} AS paymentCategory, SUM(p.amount) AS revenue, COUNT(1) AS transactions`;
      groupByClause = groupExpr;
      orderBy = "paymentCategory";
      break;

    default: // day
      groupExpr = 'DATE_TRUNC_STR(p.createdAt, "day")';
      selectExpr = `${groupExpr} AS day, SUM(p.amount) AS revenue, COUNT(1) AS transactions`;
      groupByClause = groupExpr;
      orderBy = "day";
  }

  const query = `
    SELECT ${selectExpr}
    FROM \`${BUCKET}\`.\`${SCOPE}\`.payments AS p
    ${joinExpr}
    WHERE p.status = "approved"
      AND p.createdAt BETWEEN $1 AND $2
    GROUP BY ${groupByClause}
    ORDER BY ${orderBy};
  `;

  const { rows } = await cluster.query(query, { parameters: [fromDate, toDate] });
  return rows;
};