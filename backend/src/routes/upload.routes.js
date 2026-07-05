const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../middlewares/jwtMiddleware');
const { connectToCouchbase } = require('../config/db.config');

const router = express.Router();

/* ===============================
   MULTER (MEMORY STORAGE)
================================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  }
});

// ID Proof (images + PDFs, 1 file)
const idProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, or PDF allowed'));
    }
    cb(null, true);
  }
});

/* ===============================
   HELPER FUNCTION
================================ */
function getWatermarkSVG(text, width, height) {
  return Buffer.from(`
    <svg width="${width}" height="${height}">
      <text
        x="95%"
        y="95%"
        text-anchor="end"
        dominant-baseline="bottom"
        font-size="36"
        fill="rgba(255, 255, 255, 0.35)"
        font-family="Arial, Helvetica, sans-serif"
      >
        ${text}
      </text>
    </svg>
  `);
}


/* ===============================
   UPLOAD IMAGE ROUTE (MULTI + ROLLING REPLACEMENT)
================================ */
router.post(
  '/images',
  verifyToken,
  upload.array('images', 3),
  async (req, res) => {
    try {
		/* ------------------------------------------------
         DETERMINE TARGET USER ID
         - Admin → req.body.userId
         - Normal user → req.userId (from token)
		------------------------------------------------ */
		const targetUserId = req.body.userId || req.userId;

		if (!targetUserId) {
			return res.status(401).json({
			success: false,
			message: 'User ID is required'
			});
		}

		if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
			return res.status(400).json({
			success: false,
			message: 'No image uploaded'
			});
		}

		const { collection } = await connectToCouchbase();
		const result = await collection.get(targetUserId);
		const userDoc = result.value;
	  
		// Ensure structure
		userDoc.photoDetails = userDoc.photoDetails || {};
		userDoc.photoDetails.profilePicture = Array.isArray(userDoc.photoDetails.profilePicture)
        ? userDoc.photoDetails.profilePicture
        : [];

		/* ------------------------------------------------
         REMOVE OLD IMAGES (SAFE)
		------------------------------------------------ */
		const filesToReplaceCount = req.files.length;
		const oldImages = userDoc.photoDetails.profilePicture.splice(-filesToReplaceCount);

		oldImages.forEach(img => {
			if (!img || typeof img.filename !== 'string') {
			console.warn('⚠️ Skipping invalid old image record:', img);
			return;
        }

        const originalPath = path.join(
          process.cwd(),
          'public/uploads/profile/originals',
          img.filename
        );

        const thumbPath = path.join(
          process.cwd(),
          'public/uploads/profile/thumbs',
          img.filename
        );

        [originalPath, thumbPath].forEach(filePath => {
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, err => err && console.error(err));
          }
        });
      });

      /* ------------------------------------------------
         PREPARE DIRECTORIES
      ------------------------------------------------ */
      const uploadRoot = path.join(process.cwd(), 'public/uploads/profile');
      const originalDir = path.join(uploadRoot, 'originals');
      const thumbDir = path.join(uploadRoot, 'thumbs');

      fs.mkdirSync(originalDir, { recursive: true });
      fs.mkdirSync(thumbDir, { recursive: true });

      /* ------------------------------------------------
         PROCESS NEW IMAGES
      ------------------------------------------------ */
      const newImagesMeta = [];

      for (const file of req.files) {
        if (!file || !file.buffer || !file.originalname) {
          throw new Error('Invalid uploaded file');
        }

        const ext = '.jpg';
        const baseName = path
          .basename(file.originalname, path.extname(file.originalname))
          .replace(/[^a-zA-Z0-9_-]/g, '_');

        const fileName = `${Date.now()}-${baseName}${ext}`;

        const metadata = await sharp(file.buffer).metadata();
        const watermarkBuffer = getWatermarkSVG(
          'Sushil Maratha',
          metadata.width || 1200,
          metadata.height || 800
        );

        /* ---------- ORIGINAL ---------- */
        const originalPath = path.join(originalDir, fileName);

        await sharp(file.buffer)
          .rotate()
          .resize({ width: 1200 })
          .jpeg({ quality: 80 })
          .composite([{ input: watermarkBuffer, gravity: 'southeast', blend: 'overlay' }])
          .toFile(originalPath);

        /* ---------- THUMB ---------- */
        const thumbPath = path.join(thumbDir, fileName);
        const thumbWatermark = getWatermarkSVG('Sushil Maratha', 300, 300);

        await sharp(file.buffer)
          .rotate()
          .resize(300, 300, { fit: 'cover', position: 'attention' })
          .jpeg({ quality: 70 })
          .composite([{ input: thumbWatermark, gravity: 'southeast', blend: 'overlay' }])
          .toFile(thumbPath);

        newImagesMeta.push({
          filename: fileName,
          originalUrl: `/uploads/profile/originals/${fileName}`,
          thumbUrl: `/uploads/profile/thumbs/${fileName}`,
          uploadedAt: new Date().toISOString()
        });
      }

		/* ------------------------------------------------
         SAVE & SANITIZE
		------------------------------------------------ */
		userDoc.photoDetails.profilePicture.push(...newImagesMeta);

		// Keep only last 3 valid images
		userDoc.photoDetails.profilePicture = userDoc.photoDetails.profilePicture
        .filter(img => img && typeof img.filename === 'string')
        .slice(-3);

		await collection.replace(targetUserId, userDoc);

		return res.json({
			success: true,
			images: userDoc.photoDetails.profilePicture
		});

    } catch (err) {
      console.error('❌ Image upload failed:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Image upload failed'
      });
    }
  }
);



/* ===============================
   ID PROOF UPLOAD (AUTO-REPLACE)
================================ */
router.post(
  '/id-proof',
  verifyToken,
  idProofUpload.single('idProof'),
  async (req, res) => {
    const userId = req.userId;
    const { idNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
      const { collection } = await connectToCouchbase();
      const result = await collection.get(userId);
      const userDoc = result.value;

      userDoc.photoDetails = userDoc.photoDetails || {};

      /* ===============================
         DELETE OLD ID PROOF (AUTO)
      ================================ */
      const oldIdProof = userDoc.photoDetails.idProof;
      if (oldIdProof?.filename) {
        const oldFilePath = path.join(
          process.cwd(),
          'public/uploads/id-proof',
          oldIdProof.filename
        );

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      /* ===============================
         PREPARE DIRECTORIES
      ================================ */
      const uploadRoot = path.join(process.cwd(), 'public/uploads/id-proof');
      fs.mkdirSync(uploadRoot, { recursive: true });

      const ext = path.extname(req.file.originalname).toLowerCase();
      const baseName = path
        .basename(req.file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      const fileName = `idproof-${Date.now()}-${baseName}${ext}`;
      const filePath = path.join(uploadRoot, fileName);

      /* ===============================
         SAVE FILE (IMAGE / PDF)
      ================================ */
      if (req.file.mimetype.startsWith('image/')) {
        const metadata = await sharp(req.file.buffer).metadata();
        const watermarkBuffer = getWatermarkSVG(
          userId,
          metadata.width,
          metadata.height
        );

        await sharp(req.file.buffer)
          .rotate()
          .resize({ width: 1200 })
          .jpeg({ quality: 80 })
          .composite([
            {
              input: watermarkBuffer,
              gravity: 'southeast',
              blend: 'overlay'
            }
          ])
          .toFile(filePath);
      } else {
        // PDF
        fs.writeFileSync(filePath, req.file.buffer);
      }

      /* ===============================
         SAVE METADATA (OVERWRITE)
      ================================ */
      userDoc.photoDetails.idProof = {
        filename: fileName,
        url: `/uploads/id-proof/${fileName}`,
        fileType: req.file.mimetype,
        idNumber: idNumber || '',
        uploadedAt: new Date().toISOString()
      };

      await collection.replace(userId, userDoc);

      return res.json({
        success: true,
        message: 'ID proof uploaded successfully',
        idProof: userDoc.photoDetails.idProof
      });

    } catch (err) {
      console.error('❌ ID proof upload failed:', err);
      return res.status(500).json({
        success: false,
        message: 'ID proof upload failed'
      });
    }
  }
);

module.exports = router;
