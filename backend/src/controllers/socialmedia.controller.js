// templateController.js
const { connectToCouchbase } = require("../config/db.config");

// Save a new template
exports.saveTemplate = async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ success: false, message: "Name and content are required" });
    }

    const { socialmediaTemplatesCollection } = await connectToCouchbase();

    const id = `template::${Date.now()}`; // Unique ID
    const doc = { id, name, content, createdAt: new Date().toISOString() };

    await socialmediaTemplatesCollection.upsert(id, doc);
    res.json({ success: true, template: doc });
  } catch (err) {
    console.error("Error saving template:", err);
    res.status(500).json({ success: false, message: "Error saving template" });
  }
};

// Get all templates
exports.getTemplates = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
    const bucketName = process.env.COUCHBASE_BUCKET;
    const query = `
      SELECT t.*
      FROM \`${bucketName}\`.\`socialmedia\`.\`templates\` t
      ORDER BY t.createdAt DESC
    `;
    const result = await cluster.query(query);
    res.json({ success: true, templates: result.rows });
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ success: false, message: "Error fetching templates" });
  }
};

// Get single template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { socialmediaTemplatesCollection } = await connectToCouchbase();

    const doc = await socialmediaTemplatesCollection.get(id);
    res.json({ success: true, template: doc.content });
  } catch (err) {
    console.error("Template not found:", err);
    res.status(404).json({ success: false, message: "Template not found" });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content } = req.body;

    if (!name && !content) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const { socialmediaTemplatesCollection } = await connectToCouchbase();

    const existing = await socialmediaTemplatesCollection.get(id);
    const updatedDoc = {
      ...existing.content,
      name: name || existing.content.name,
      content: content || existing.content.content,
      updatedAt: new Date().toISOString(),
    };

    await socialmediaTemplatesCollection.replace(id, updatedDoc);
    res.json({ success: true, template: updatedDoc });
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ success: false, message: "Error updating template" });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { socialmediaTemplatesCollection } = await connectToCouchbase();

    await socialmediaTemplatesCollection.remove(id);
    res.json({ success: true, message: "Template deleted successfully" });
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ success: false, message: "Error deleting template" });
  }
};
