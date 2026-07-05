const express = require("express");
const router = express.Router();
const verifyToken = require('../middlewares/jwtMiddleware'); // JWT middleware

const {
  saveTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
} = require("../controllers/socialmedia.controller");

// Create a new template
router.post('/templates', verifyToken, saveTemplate);

// Get all templates
router.get('/templates', verifyToken, getTemplates);

// Get a single template by ID
router.get('/templates/:id', verifyToken, getTemplateById);

// Update a template
router.put('/templates/:id', verifyToken, updateTemplate);

// Delete a template
router.delete('/templates/:id', verifyToken, deleteTemplate);

module.exports = router;
