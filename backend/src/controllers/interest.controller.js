import couchbase from 'couchbase';
import { connectToCouchbase } from '../config/db.config.js';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_STATUSES = ['sent', 'received', 'accepted', 'rejected', 'unsent'];
import { sendEmail, sendWhatsappMessage } from "../helpers/notificationHelper.js";

// ===================================
// 🔔 Email + WhatsApp trigger
// ===================================
async function triggerNotifications(cluster, fromUserId, toUserId) {
	console.log("IN notification");
  try {
    const { collection } = await connectToCouchbase();


    // 🚀 Parallel KV fetch (FASTEST)
    const [fromResult, toResult] = await Promise.all([
      collection.get(fromUserId),
      collection.get(toUserId)
    ]);

	console.log(fromResult);
	console.log(toResult);
    const fromUser = fromResult?.content;
    const toUser = toResult?.content;

    if (!fromUser || !toUser) return;

    const fromName = fromUser.personalDetails.firstName || 'Someone';
    const toName = toUser.personalDetails.firstName || 'Member';
    const toEmail = toUser.email;
    const whatsappNumber = toUser.contactDetails.whatsappNumber;
	console.log("EmailId = "+ toEmail);
    // 📧 Email Notification
    if (toEmail) {
      sendEmail({
        to: toEmail,
        subject: '💖 New Interest Received',
        html: newInterestReceivedEmail({
			toName: toName,
			fromName: fromName,
			fromUserId: fromUserId
		  }, "en")
      });
    }

    // 📲 WhatsApp Notification
    if (whatsappNumber) {
		/*
		await sendWhatsappMessage({
		  to: `+91${toMobile}`,
		  type: "template",
		  templateName: "smm_interest_received",
		  variables: [
			toName,
			fromName,
			process.env.APP_NAME
		  ],
		  language: "en"
		});
		*/
    }

  } catch (error) {
    // Non-blocking: log only
    console.error('Notification error:', error.message);
  }
}

const newInterestReceivedEmail = (
  { toName, fromName, fromUserId },
  language = "en"
) => {
  const texts = {
    en: {
      greeting: "Dear",
      title: "💖 New Interest Received!",
      message: "has shown interest in your profile.",
      subMessage: "Login now to view their profile and take the next step.",
      cta: "View Interest",
      regards: "Warm regards",
      team: `${process.env.APP_NAME} Team`
    },
    mr: {
      greeting: "प्रिय",
      title: "💖 नवीन रस दाखवण्यात आला आहे!",
      message: "यांनी आपल्या प्रोफाइलमध्ये रस दाखवला आहे.",
      subMessage: "प्रोफाइल पाहण्यासाठी लॉगिन करा आणि पुढील पाऊल उचला.",
      cta: "रस पहा",
      regards: "सस्नेह",
      team: `${process.env.APP_NAME} टीम`
    }
  };

  const t = texts[language] || texts.en;

  return `
<div style="font-family:'Segoe UI', Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">

  <!-- Logo -->
  <div style="background:#f8f9fb; padding:16px; text-align:center;">
    <a href="https://sushilmaratha.in" target="_blank">
      <img src="https://sushilmaratha.in/en-US/images/smLogo.png"
        alt="${process.env.APP_NAME}"
        style="height:60px; object-fit:contain;">
    </a>
  </div>

  <!-- Body -->
  <div style="padding:20px;">
    <p>${t.greeting} <strong>${toName}</strong>,</p>

    <p style="font-size:16px; margin-top:12px;">
      <strong>${t.title}</strong>
    </p>

    <div style="background:#f4f6f8; padding:16px; border-radius:6px; margin:18px 0;">
      <p style="margin:0;">
        <strong>${fromName}</strong> ${t.message}
      </p>
    </div>

    <p>${t.subMessage}</p>

    <!-- CTA -->
    <p style="text-align:center; margin:26px 0;">
      <a href="https://sushilmaratha.in/en-US/interests"
         target="_blank"
         style="background:#f16b2b; color:#fff; text-decoration:none; padding:12px 28px;
                border-radius:6px; font-weight:bold; display:inline-block;">
        ${t.cta}
      </a>
    </p>

    <p>
      ${t.regards},<br/>
      <strong>${t.team}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f8f9fb; padding:16px; font-size:12px; color:#555; border-top:1px solid #eee;">
    <p style="margin:6px 0;">
      📞 <strong>Contact:</strong> 9370225218 | 9370220481<br/>
      📧 <strong>Email:</strong> contact@sushilmaratha.in<br/>
      📍 <strong>Address:</strong> Pune – 411045
    </p>

    <p style="margin:10px 0; font-size:11px; color:#777;">
      🔐 <strong>Security Notice:</strong>
      Never share your password, OTP, or reset links with anyone.
    </p>

    <p style="margin:8px 0; text-align:center; font-size:11px; color:#888;">
      © ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.
    </p>
  </div>
</div>
`;
};


/* ===================================== */
/*         UPDATE INTEREST STATUS        */
/* ===================================== */
export const updateInterestStatus = async (req, res) => {
  try {
    const { interests } = await connectToCouchbase();

    const currentUserId = req.userId;
    //const { interestId } = req.params; // optional for pending
    const { interestId, otherUserId, newStatus } = req.body;

    const VALID_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'];

    /* ===================== */
    /* BASIC VALIDATION      */
    /* ===================== */

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing status"
      });
    }

    const now = new Date().toISOString();

    /* ===================================================== */
    /* 1️⃣ CREATE OR RESEND (PENDING)                        */
    /* ===================================================== */

    if (newStatus === 'pending') {

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: "otherUserId is required for pending"
        });
      }

      if (currentUserId === otherUserId) {
        return res.status(400).json({
          success: false,
          message: "You cannot send interest to yourself"
        });
      }

      const generatedInterestId = generateInterestId(currentUserId, otherUserId);

      let existingDoc = null;
      let cas;

      try {
        const result = await interests.get(generatedInterestId);
        existingDoc = result.content;
        cas = result.cas;
      } catch {
        existingDoc = null;
      }

      // Create new interest
      if (!existingDoc) {
        const newDoc = {
          type: "interest",
          interestId: generatedInterestId,
          user1: currentUserId,
          user2: otherUserId,
          initiatedBy: currentUserId,
          status: "pending",
          createdAt: now,
          updatedAt: now,
          statusHistory: [
            {
              status: "pending",
              timestamp: now,
              updatedBy: currentUserId
            }
          ]
        };

        await interests.insert(generatedInterestId, newDoc);

        return res.json({
          success: true,
          interestId: generatedInterestId,
          status: "pending"
        });
      }

      // Already pending
      if (existingDoc.status === 'pending') {
        return res.status(409).json({
          success: false,
          message: "Interest already pending"
        });
      }

      // Already accepted
      if (existingDoc.status === 'accepted') {
        return res.status(409).json({
          success: false,
          message: "Interest already accepted"
        });
      }

      // Resend if rejected or cancelled
      existingDoc.status = 'pending';
      existingDoc.updatedAt = now;

      existingDoc.statusHistory = existingDoc.statusHistory || [];
      existingDoc.statusHistory.push({
        status: 'pending',
        timestamp: now,
        updatedBy: currentUserId
      });

      await interests.replace(generatedInterestId, existingDoc, { cas });

      return res.json({
        success: true,
        interestId: generatedInterestId,
        status: "pending"
      });
    }

    /* ===================================================== */
    /* 2️⃣ UPDATE (ACCEPT / REJECT / CANCEL)                 */
    /* ===================================================== */

    if (!interestId) {
      return res.status(400).json({
        success: false,
        message: "interestId is required"
      });
    }

    let existingDoc;
    let cas;

    try {
      const result = await interests.get(interestId);
      existingDoc = result.content;
      cas = result.cas;
    } catch {
      return res.status(404).json({
        success: false,
        message: "Interest not found"
      });
    }

    // Authorization
    if (
      existingDoc.user1 !== currentUserId &&
      existingDoc.user2 !== currentUserId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this interest"
      });
    }

    if (existingDoc.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `Cannot change status from ${existingDoc.status}`
      });
    }

    const isSender = existingDoc.initiatedBy === currentUserId;

    if ((newStatus === 'accepted' || newStatus === 'rejected') && isSender) {
      return res.status(403).json({
        success: false,
        message: "Sender cannot accept or reject"
      });
    }

    if (newStatus === 'cancelled' && !isSender) {
      return res.status(403).json({
        success: false,
        message: "Only sender can cancel"
      });
    }

    existingDoc.status = newStatus;
    existingDoc.updatedAt = now;

    existingDoc.statusHistory = existingDoc.statusHistory || [];
    existingDoc.statusHistory.push({
      newStatus,
      timestamp: now,
      updatedBy: currentUserId
    });

    await interests.replace(interestId, existingDoc, { cas });

    return res.json({
      success: true,
      interestId,
      newStatus
    });

  } catch (err) {
    console.error("Interest Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};


/* ===================== */
/* HELPER FUNCTION       */
/* ===================== */

function generateInterestId(user1, user2) {
  return `interest::${[user1, user2].sort().join("::")}`;
}


export const getInterests = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
    const userId = req.userId;

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const query = `
      SELECT 
        META(i).id AS interestId,
        i.status,
        i.initiatedBy,
        i.createdAt,
        i.updatedAt,
        i.statusHistory,
        i.user1,
        i.user2,

        u.userId AS otherUserId,
        u.educationDetails.highestQualification,
        u.careerDetails.occupation,
        u.personalDetails.firstName,
        u.personalDetails.lastName,
        u.photoDetails.profilePicture,
        u.personalDetails.age,
        u.personalDetails.height,
        u.personalDetails.religion,
        u.personalDetails.caste,
        u.contactDetails.city

      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i

      JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      ON (
        CASE 
          WHEN i.user1 = $userId THEN i.user2
          ELSE i.user1
        END
      ) = u.userId

      WHERE (i.user1 = $userId OR i.user2 = $userId)
        AND i.type = "interest"

      ORDER BY i.updatedAt DESC
      LIMIT $limit OFFSET $offset
    `;

    const { rows } = await cluster.query(query, {
      parameters: { userId, limit, offset }
    });

    const buckets = {
      sent: [],
      received: [],
      accepted: [],
      rejected: []
    };

    for (const row of rows) {

      const isSender = row.initiatedBy === userId;
      const direction = isSender ? "sent" : "received";

      // 🔥 Bucket logic
      if (row.status === "accepted") {
        buckets.accepted.push({ ...row, direction });
      } 
      else if (row.status === "rejected") {
        buckets.rejected.push({ ...row, direction });
      } 
      else if (row.status === "pending") {
        if (isSender) {
          buckets.sent.push({ ...row, direction });
        } else {
          buckets.received.push({ ...row, direction });
        }
      }
    }

    return res.status(200).json({
      success: true,
      total: rows.length,
      ...buckets
    });

  } catch (err) {
    console.error("Error fetching interests:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching interests",
      error: err.message
    });
  }
};
