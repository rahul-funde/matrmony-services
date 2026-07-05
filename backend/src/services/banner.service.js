const couchbase = require("couchbase");
const { v4: uuidv4 } = require("uuid");
const { connectToCouchbase } = require("../config/db.config");

/* =========================
   CREATE
========================= */
exports.createBanner = async (data) => {
  const { bannersTemplatesCollection } = await connectToCouchbase();

  const id = `banner::${uuidv4()}`;
  await bannersTemplatesCollection.insert(id, data);
  return id;
};

/* =========================
   UPDATE
========================= */
exports.updateBanner = async (id, data) => {
  const { bannersTemplatesCollection } = await connectToCouchbase();

  const ops = Object.entries(data).map(([key, value]) =>
    couchbase.MutateInSpec.upsert(key, value)
  );

  await bannersTemplatesCollection.mutateIn(id, ops);
};

/* =========================
   DELETE
========================= */
exports.deleteBanner = async (id) => {
  const { bannersTemplatesCollection } = await connectToCouchbase();
  await bannersTemplatesCollection.remove(id);
};

/* =========================
   GET ALL
========================= */
exports.getAllBanners = async () => {
  const { cluster } = await connectToCouchbase();
  const bucketName = process.env.COUCHBASE_BUCKET;

  const query = `
    SELECT META(b).id, b.*
    FROM \`${bucketName}\`.socialmedia.banners b
    WHERE b.type = "popup_banner"
      AND b.active = true
    ORDER BY b.priority ASC
  `;

  const result = await cluster.query(query);
  return result.rows;
};


