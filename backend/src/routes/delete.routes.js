const express = require('express');
const fs = require('fs');
const path = require('path');
const verifyToken = require('../middlewares/jwtMiddleware');
const { connectToCouchbase } = require('../config/db.config');

const router = express.Router();

router.delete('/delete-image/:fileName', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { fileName } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID not found in token' });
  }

  try {
    const { collection } = await connectToCouchbase();
    const result = await collection.get(userId);
    const userDoc = result.value;

    const pictures = userDoc.photoDetails?.profilePicture || [];

    // Find the image in metadata
    const imageIndex = pictures.findIndex(pic => pic.filename === fileName);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found in profile' });
    }

    // Remove from Couchbase metadata
    pictures.splice(imageIndex, 1);
    userDoc.photoDetails.profilePicture = pictures;
    await collection.replace(userId, userDoc);

    // Paths to delete
    const originalPath = path.join(process.cwd(), 'public/uploads/profile/originals', fileName);
    const thumbPath = path.join(process.cwd(), 'public/uploads/profile/thumbs', fileName);

    // Delete files safely
    [originalPath, thumbPath].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
          if (err) console.error(`Failed to delete ${filePath}:`, err);
        });
      }
    });

    return res.json({ success: true, message: 'Image deleted successfully' });

  } catch (err) {
    console.error('❌ Error deleting image:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


/* ===============================
   DELETE ID PROOF
================================ */
router.delete('/delete-id-proof', verifyToken, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID not found in token'
    });
  }

  try {
    const { collection } = await connectToCouchbase();
    const result = await collection.get(userId);
    const userDoc = result.value;

    if (!userDoc.photoDetails || !userDoc.photoDetails.idProof) {
      return res.status(404).json({
        success: false,
        message: 'ID proof not found'
      });
    }

    const { filename } = userDoc.photoDetails.idProof;

    /* ===============================
       DELETE FILE FROM DISK
    ================================ */
    const idProofPath = path.join(
      process.cwd(),
      'public/uploads/id-proof',
      filename
    );

    if (fs.existsSync(idProofPath)) {
      fs.unlink(idProofPath, err => {
        if (err) {
          console.error(`❌ Failed to delete ID proof file`, err);
        }
      });
    }

    /* ===============================
       UPDATE COUCHBASE
    ================================ */
    delete userDoc.photoDetails.idProof;

    await collection.replace(userId, userDoc);

    return res.json({
      success: true,
      message: 'ID proof deleted successfully'
    });

  } catch (err) {
    console.error('❌ Error deleting ID proof:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
