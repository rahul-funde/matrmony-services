
import couchbase from 'couchbase';
import jwt from 'jsonwebtoken';
import { connectToCouchbase } from "../config/db.config.js";
import { sendEmail, sendWhatsappMessage } from "../helpers/notificationHelper.js";

export const getData = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
    const query = `
    SELECT META(users).id AS doc_id,
           users.userId,
           users.email,
           users.mobilenumber,
           users.age,
           users.careerDetails,
           users.personalDetails,
           users.additionalInfoDetails,
           users.contactDetails,
           users.educationDetails,
           users.familyDetails,
           users.horoscopeDetails,
           users.lifestyleDetails,
           users.partnerPreferencesDetails,
           users.plan,
           users.status,
           users.createdAt
    FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` users 
    WHERE users.status != 'deleted' ORDER BY users.createdAt DESC`;
    console.log("Query = " + query);
      const result = await cluster.query(query);
    res.status(200).json(result);

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export const searchProfiles = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();

    /* -----------------------------------------
       1. NORMALIZATION HELPERS
    ----------------------------------------- */
    const normalize = (value) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      if (Array.isArray(value) && value.length === 0) return null;
      return value;
    };

    const normalizeNumber = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const n = Number(value);
      return isNaN(n) ? null : n;
    };

    /* -----------------------------------------
       2. NORMALIZE ALL REQUEST FIELDS
    ----------------------------------------- */
    Object.keys(req.body).forEach(key => {
      req.body[key] = normalize(req.body[key]);
    });

    /* -----------------------------------------
       3. PAGINATION
    ----------------------------------------- */
    const page = Number(req.body.page || 1);
    const pageSize = Number(req.body.pageSize || 6);
    const offset = (page - 1) * pageSize;

    /* -----------------------------------------
       4. RANGE FILTERS (SAFE)
    ----------------------------------------- */
    const ageMin = normalizeNumber(req.body.ageMin ?? req.body.age?.min);
    const ageMax = normalizeNumber(req.body.ageMax ?? req.body.age?.max);

    const heightMin = normalizeNumber(req.body.heightMin ?? req.body.height?.min);
    const heightMax = normalizeNumber(req.body.heightMax ?? req.body.height?.max);

    const incomeMin = normalizeNumber(req.body.incomeMin ?? req.body.income?.min);
    const incomeMax = normalizeNumber(req.body.incomeMax ?? req.body.income?.max);

    /* -----------------------------------------
       5. LOCATION HANDLING
    ----------------------------------------- */
    let nativeState = null;
    let nativeDistrict = null;
    let nativeCity = null;

    if (req.body.nativePlace) {
      nativeCity = req.body.nativePlace;
    }

    let workState = null;
    let workDistrict = null;
    let workCity = null;

    if (req.body.workPlace) {
      workCity = req.body.workPlace;
    }

    /* -----------------------------------------
       6. DESTRUCTURE FILTERS
    ----------------------------------------- */
    const {
      profileId = null,
      seeking = null,
      maritalStatus = null,
      occupationType = null,
      education = null,
      subCaste = null,
      manglik = null,
      diet = null
    } = req.body;

    /* -----------------------------------------
       7. N1QL QUERY
    ----------------------------------------- */
    const query = `
      SELECT u.userId,
             u.createdAt,
             u.type,
             u.status,
             u.plan,
             u.start_date,
             u.lastLogin,
             u.horoscopeDetails,
             u.personalDetails,
             u.familyDetails,
             u.educationDetails,
             u.careerDetails,
             u.lifestyleDetails,
             u.partnerPreferencesDetails,
             u.contactDetails,
             u.photoDetails,
             u.additionalInfoDetails,
             u.profileCompletion
		FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
		WHERE u.status IN ["active","verified"]

        AND ($profileId IS NOT VALUED OR u.userId = $profileId)
        AND ($seeking IS NOT VALUED OR u.personalDetails.gender = $seeking)
        AND ($maritalStatus IS NOT VALUED OR u.personalDetails.maritalStatus IN $maritalStatus)
        AND ($education IS NOT VALUED OR u.educationDetails.highestQualification IN $education)
        AND ($occupationType IS NOT VALUED OR u.careerDetails.occupation IN $occupationType)

        AND ($nativeState IS NOT VALUED OR u.familyDetails.nativeState = $nativeState)
        AND ($nativeDistrict IS NOT VALUED OR u.familyDetails.nativeDistrict = $nativeDistrict)
        AND ($nativeCity IS NOT VALUED OR u.familyDetails.nativeCity = $nativeCity)

        AND ($workState IS NOT VALUED OR u.careerDetails.workLocationState = $workState)
        AND ($workDistrict IS NOT VALUED OR u.careerDetails.workLocationDistrict = $workDistrict)
        AND ($workCity IS NOT VALUED OR u.careerDetails.workLocationCity = $workCity)

        AND ($subCaste IS NOT VALUED OR u.personalDetails.subCaste IN $subCaste)
        AND ($manglik IS NOT VALUED OR u.horoscopeDetails.mangal = $manglik)
        AND ($diet IS NOT VALUED OR u.personalDetails.diet = $diet)

        AND ($ageMin IS NOT VALUED OR u.personalDetails.age >= $ageMin)
        AND ($ageMax IS NOT VALUED OR u.personalDetails.age <= $ageMax)
        AND ($heightMin IS NOT VALUED OR TO_NUMBER(u.personalDetails.height) >= $heightMin)
        AND ($heightMax IS NOT VALUED OR TO_NUMBER(u.personalDetails.height) <= $heightMax)
        AND ($incomeMin IS NOT VALUED OR TO_NUMBER(u.careerDetails.annualIncome) >= $incomeMin)
        AND ($incomeMax IS NOT VALUED OR TO_NUMBER(u.careerDetails.annualIncome) <= $incomeMax)

      ORDER BY u.createdAt DESC
    `;
	//LIMIT $pageSize OFFSET $offset;
    /* -----------------------------------------
       8. QUERY PARAMETERS
    ----------------------------------------- */
    const params = {
      profileId,
      seeking,

      maritalStatus: Array.isArray(maritalStatus) ? maritalStatus : maritalStatus ? [maritalStatus] : null,
      occupationType: Array.isArray(occupationType) ? occupationType : occupationType ? [occupationType] : null,
      education: Array.isArray(education) ? education : education ? [education] : null,
      subCaste: Array.isArray(subCaste) ? subCaste : subCaste ? [subCaste] : null,

      nativeState,
      nativeDistrict,
      nativeCity,
      workState,
      workDistrict,
      workCity,

      manglik,
      diet,

      ageMin,
      ageMax,
      heightMin,
      heightMax,
      incomeMin,
      incomeMax,

      pageSize,
      offset
    };

    /* -----------------------------------------
       9. EXECUTE QUERY
    ----------------------------------------- */
    const result = await cluster.query(query, { parameters: params });

    res.status(200).json({
      page,
      pageSize,
      totalResults: result.rows.length,
      profiles: result.rows
    });

  } catch (error) {
    console.error('Search Query Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
};


/* ==========================
   Send Contact Email
========================== */
export const sendContactMail = async (req, res) => {
  try {
    const { name, email, mobile, subject, message } = req.body;

    if (![name, email, mobile, subject, message].every(Boolean)) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    await sendEmail({
      to: `${process.env.CONTACT_EMAIL}`,
      subject: `Contact Form: ${subject}`,
      replyTo: email, // 👈 VERY IMPORTANT for admin
      html: contactEmailTemplate(
        name,
        email,
        mobile,
        subject,
        message
      )
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Contact Email Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email'
    });
  }
};


export const contactEmailTemplate = (
  name,
  email,
  mobile,
  subject,
  message
) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>New Contact Message</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td align="center">

          <!-- MAIN CARD -->
          <table width="600" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

            <!-- HEADER -->
            <tr>
              <td style="background:#b71c1c;color:#ffffff;padding:16px 24px;">
                <h2 style="margin:0;font-size:20px;">📩 New Contact Form Message</h2>
                <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">
                  Sushil Maratha Matrimony
                </p>
              </td>
            </tr>

            <!-- CONTENT -->
            <tr>
              <td style="padding:24px;">

                <p style="margin:0 0 16px;font-size:14px;color:#333;">
                  You have received a new message from your website contact form.
                </p>

                <!-- DETAILS TABLE -->
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="border-collapse:collapse;font-size:14px;">
                  
                  <tr>
                    <td style="padding:10px;border:1px solid #e0e0e0;background:#fafafa;width:35%;">
                      <b>👤 Name</b>
                    </td>
                    <td style="padding:10px;border:1px solid #e0e0e0;">
                      ${name}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px;border:1px solid #e0e0e0;background:#fafafa;">
                      <b>📧 Email</b>
                    </td>
                    <td style="padding:10px;border:1px solid #e0e0e0;">
                      <a href="mailto:${email}" style="color:#b71c1c;text-decoration:none;">
                        ${email}
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px;border:1px solid #e0e0e0;background:#fafafa;">
                      <b>📞 Mobile</b>
                    </td>
                    <td style="padding:10px;border:1px solid #e0e0e0;">
                      <a href="tel:${mobile}" style="color:#b71c1c;text-decoration:none;">
                        ${mobile}
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px;border:1px solid #e0e0e0;background:#fafafa;">
                      <b>📌 Subject</b>
                    </td>
                    <td style="padding:10px;border:1px solid #e0e0e0;">
                      ${subject}
                    </td>
                  </tr>
                </table>

                <!-- MESSAGE -->
                <div style="margin-top:20px;">
                  <h4 style="margin:0 0 8px;font-size:15px;color:#333;">
                    💬 Message
                  </h4>
                  <div style="padding:12px;border:1px solid #e0e0e0;border-radius:4px;background:#fafafa;font-size:14px;line-height:1.6;color:#333;">
                    ${message.replace(/\n/g, '<br/>')}
                  </div>
                </div>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f0f0f0;padding:14px 24px;font-size:12px;color:#666;text-align:center;">
                This message was sent from the contact form on
                <b>Sushil Maratha Matrimony</b>.
                <br/>
                Please reply directly to this email to contact the user.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};
