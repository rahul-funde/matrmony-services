const couchbase = require("couchbase");
require("dotenv").config();

const clusterConnStr = process.env.COUCHBASE_CONN_STR;
const username = process.env.COUCHBASE_USERNAME;
const password = process.env.COUCHBASE_PASSWORD;
const bucketName = process.env.COUCHBASE_BUCKET;
const collectionName = process.env.COUCHBASE_COLLECTION;

let cluster;
let bucket;
let usersScope;

let collection;
let blacklistCollection;
let profileUtilityCollection;
let defaultCollection;
let admincollection;
let interests;
let packageCollection;
let planCollection;
let userVerifications;
let userPlanCollection;
let planLogCollection;
let notificationCollection;
let paymentCollection;
let contactViewCollection;

let socialmediaTemplatesCollection;
let bannersTemplatesCollection;

async function connectToCouchbase() {
  if (!cluster) {
    try {
      cluster = await couchbase.connect(clusterConnStr, {
        username,
        password,
        kvTimeout: 50000,
        queryTimeout: 50000,
      });

      console.log("✅ Connected to Couchbase");

      bucket = cluster.bucket(bucketName);
      if (!bucket) {
        throw new Error(`Bucket '${bucketName}' not found`);
      }

      /* ===== USERS SCOPE ===== */
      usersScope = bucket.scope("users");

      collection = usersScope.collection(collectionName);
      blacklistCollection = usersScope.collection("blacklisted");
      profileUtilityCollection = usersScope.collection("utility");
      admincollection = usersScope.collection("admin");
      interests = usersScope.collection("interests");
      packageCollection = usersScope.collection("packages");
      planCollection = usersScope.collection("plans");
      userVerifications = usersScope.collection("userVerifications");
      userPlanCollection = usersScope.collection("user_plans");
      planLogCollection = usersScope.collection("user_plan_logs");
      notificationCollection = usersScope.collection("notification");
      paymentCollection = usersScope.collection("payments");
      contactViewCollection = usersScope.collection("contactViewCollection");

      defaultCollection = bucket.defaultCollection();

      /* ===== SOCIALMEDIA SCOPE ===== */
      const socialmediaScope = bucket.scope("socialmedia");
      socialmediaTemplatesCollection = socialmediaScope.collection("templates");
      bannersTemplatesCollection = socialmediaScope.collection("banners");

      console.log("✅ Couchbase collections initialized");
    } catch (error) {
      console.error("❌ Couchbase connection failed:", error);
      throw error;
    }
  }

  return {
    cluster,
    bucket,
    collection,
    blacklistCollection,
    profileUtilityCollection,
    defaultCollection,
    admincollection,
    interests,
    packageCollection,
    planCollection,
    userVerifications,
    userPlanCollection,
    planLogCollection,
    notificationCollection,
    paymentCollection,
    contactViewCollection,
    socialmediaTemplatesCollection,
    bannersTemplatesCollection,
  };
}

module.exports = { connectToCouchbase };
