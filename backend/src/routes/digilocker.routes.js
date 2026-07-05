const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const crypto = require('crypto');
const NodeCache = require('node-cache');

const verifyToken = require('../middlewares/jwtMiddleware');
const { connectToCouchbase } = require('../config/db.config');

/* ===============================
   TEMP TOKEN STORE (5 MIN)
================================ */
const tokenCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

/* ===============================
   ENV VALIDATION
================================ */
[
  'DIGILOCKER_BASE_URL',
  'DIGILOCKER_CLIENT_ID',
  'DIGILOCKER_CLIENT_SECRET',
  'DIGILOCKER_REDIRECT_URI'
].forEach(key => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing ENV: ${key}`);
  }
});

/* ===============================
   STEP 1: REDIRECT TO DIGILOCKER
================================ */
router.get('/digilocker/auth', verifyToken, (req, res) => {
  const state = crypto.randomUUID();

  tokenCache.set(`state_${state}`, req.userId);

  const authUrl =
    `${process.env.DIGILOCKER_BASE_URL}/public/oauth2/1/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.DIGILOCKER_CLIENT_ID}` +
    `&redirect_uri=${process.env.DIGILOCKER_REDIRECT_URI}` +
    `&state=${state}`;

  res.redirect(authUrl);
});

/* ===============================
   STEP 2: DIGILOCKER CALLBACK
================================ */
router.get('/digilocker/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Authorization failed');
  }

  const userId = tokenCache.get(`state_${state}`);
  if (!userId) {
    return res.status(400).send('Invalid session');
  }

  try {
    const tokenResponse = await axios.post(
      `${process.env.DIGILOCKER_BASE_URL}/public/oauth2/1/token`,
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: process.env.DIGILOCKER_CLIENT_ID,
          client_secret: process.env.DIGILOCKER_CLIENT_SECRET,
          redirect_uri: process.env.DIGILOCKER_REDIRECT_URI
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const sessionId = crypto.randomUUID();

    tokenCache.set(`token_${sessionId}`, {
      accessToken,
      userId
    });

    res.redirect(`/kyc-success?sid=${sessionId}`);

  } catch (err) {
    console.error('❌ Token exchange failed:', err.response?.data);
    res.status(500).send('Token exchange failed');
  }
});

/* ===============================
   STEP 3: FETCH & VERIFY AADHAAR
================================ */
router.get('/digilocker/verify', async (req, res) => {
  const { sid } = req.query;
  if (!sid) {
    return res.status(400).json({ success: false, message: 'Session missing' });
  }

  const session = tokenCache.get(`token_${sid}`);
  if (!session) {
    return res.status(400).json({ success: false, message: 'Session expired' });
  }

  const { accessToken, userId } = session;

  try {
    const { collection } = await connectToCouchbase();
    const result = await collection.get(userId);
    const userDoc = result.value;

    // Prevent re-verification
    if (userDoc.verification?.aadhaar?.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar already verified'
      });
    }

    const ekycResponse = await axios.get(
      `${process.env.DIGILOCKER_BASE_URL}/public/oauth2/1/xml/eaadhaar`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const parsed = await xml2js.parseStringPromise(ekycResponse.data, {
      explicitArray: false
    });

    const uidData = parsed?.KycRes?.UidData;
    const poi = uidData?.Poi;

    if (!poi) {
      return res.status(400).json({ success: false, message: 'Invalid eKYC data' });
    }

    /* ===============================
       STORE VERIFIED DATA
    ================================ */
    userDoc.verification = userDoc.verification || {};

    userDoc.verification.aadhaar = {
      status: 'VERIFIED',
      provider: 'DigiLocker',
      aadhaarLast4: uidData?.Uid?.slice(-4),
      name: poi.name,
      dob: poi.dob,
      gender: poi.gender,
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + 5 * 365 * 24 * 60 * 60 * 1000
      ).toISOString()
    };

    userDoc.kycAudit = {
      provider: 'DigiLocker',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      verifiedAt: new Date().toISOString()
    };

    await collection.replace(userId, userDoc);

    tokenCache.del(`token_${sid}`);

    res.json({
      success: true,
      message: 'Aadhaar verified successfully',
      data: userDoc.verification.aadhaar
    });

  } catch (err) {
    console.error('❌ Aadhaar verification failed:', err.response?.data || err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;
