const couchbase = require('couchbase');
const { connectToCouchbase } = require("../config/db.config");
const jwt = require('jsonwebtoken');

exports.getRecommendations = async (req, res) => 
{
    const { cluster, interests } = await connectToCouchbase();
    const currentUserId = req.userId; // Extracted from JWT
	
		const fieldsToNormalize = [
		  "SrchUserId",
		  "nativePlace",
		  "highestQualification",
		  "occupation",
		  "ageMin",
		  "ageMax",
		  "heightMin",
		  "heightMax",
		  "mangal",
		  "maritalStatus"
		];
		
		// Normalize each field in req.body
		fieldsToNormalize.forEach(field => {
		  if (req.body[field] === "") {
			req.body[field] = null;
		  }
		});
		
	  // Destructure with null defaults
		const {
			page = 1,
			pageSize = 6,
			SrchUserId = null,
			nativePlace = null,
			highestQualification = null,
			occupation = null,
			ageMin = null,
			ageMax = null,
			heightMin = null,
			heightMax = null,
			mangal = null,
			maritalStatus = null
		  } = req.body;	  
		  
		  // Destructure after normalization

		  const offset = (page - 1) * pageSize;
			if (!currentUserId) {
			  return res.status(400).json({ success: false, message: 'User ID not found in token' });
			}
			
			try 
			{
				const query = `
					  SELECT 
						u.userId,
						u.personalDetails.firstName,
						u.personalDetails.lastName,
						u.personalDetails.middleName,
						u.personalDetails.dateOfBirth,
						u.personalDetails.subCaste,
						u.personalDetails.heightUnit,
						u.personalDetails.weight,
						u.personalDetails.bloodGroup,
						u.personalDetails.spectacles,
						u.personalDetails.age,
						u.personalDetails.height,
						u.personalDetails.religion,
						u.personalDetails.caste,
						u.personalDetails.maritalStatus,
						u.photoDetails.profilePicture AS photoUrl,
						u.contactDetails.city,
						u.contactDetails.state,
						u.contactDetails.country,
						u.educationDetails.highestQualification,
						u.educationDetails.yearOfCompletion,
						u.careerDetails.occupation,
						u.careerDetails.jobTitle,
						u.careerDetails.companyName,
						u.careerDetails.annualIncome,
						u.careerDetails.workLocationCity,
						u.careerDetails.workLocationCountry,
						u.contactDetails.emailAddress,
						u.contactDetails.phoneNumber,
						i.status AS interestStatus,
						(i.status = "sent") AS hasSentInterest
					  FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
					  JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` currentUser 
						ON currentUser.userId = $currentUserId
					  LEFT JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i
						ON i.fromUserId = currentUser.userId
						  AND i.toUserId = u.userId
						  AND i.type = "interest"
					  WHERE u.userId != currentUser.userId
						AND u.personalDetails.gender != currentUser.personalDetails.gender
						AND u.status != "inactive" AND u.status != "deleted"
					   ORDER BY u.createdAt desc
					  LIMIT 10;
					`;

				console.log("Running query:", query);
				const result = await cluster.query(query, {
				  parameters: { currentUserId, SrchUserId, nativePlace, highestQualification, occupation, ageMin, ageMax, heightMin, heightMax, mangal, maritalStatus, pageSize,
			offset }
				});
				
				
				// Manual query preview for logging
				const debugQuery = query
				  .replace(/\$currentUserId/g, JSON.stringify(currentUserId))
				  .replace(/\$SrchUserId/g, JSON.stringify(SrchUserId))
				  .replace(/\$nativePlace/g, JSON.stringify(nativePlace))
				  .replace(/\$highestQualification/g, JSON.stringify(highestQualification))
				  .replace(/\$occupation/g, JSON.stringify(occupation))
				  .replace(/\$ageMin/g, JSON.stringify(ageMin))
				  .replace(/\$ageMax/g, JSON.stringify(ageMax))
				  .replace(/\$heightMin/g, JSON.stringify(heightMin))
				  .replace(/\$heightMax/g, JSON.stringify(heightMax))
				  .replace(/\$mangal/g, JSON.stringify(mangal))
				  .replace(/\$maritalStatus/g, JSON.stringify(maritalStatus))
				  .replace(/\$offset/g, JSON.stringify(offset))
				  .replace(/\$pageSize/g, JSON.stringify(pageSize));
				 
				console.log("Debug query with values:", debugQuery);
				
				res.status(200).json(result.rows);
		  } catch (error) {
			console.error('Query error:', error);
			res.status(500).json({ error: 'Internal Server Error', details: error.message });
		  }

};

// ======================================================
// SAFE HELPERS (MUST KEEP ABOVE FUNCTION)
// ======================================================

function safeSplit(value, separator = ',') {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(v => String(v).trim().toLowerCase());
  }

  if (typeof value === 'string') {
    return value.split(separator).map(v => v.trim().toLowerCase());
  }

  return [];
}

function safeRange(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    return value.split('-').map(v => parseInt(v.trim(), 10));
  }

  if (Array.isArray(value)) return value;

  return null;
}

function normalize(val = '') {
  if (typeof val !== 'string') return '';
  return val.trim().toLowerCase();
}

// ======================================================
// MATCHMAKING SCORE FUNCTION (FINAL SAFE VERSION)
// ======================================================

function calculateMatchScore(user, candidate) {

  const weights = {
    age: 18,
    maritalStatus: 15,
    location: 12,
    religion_caste: 13,
    education_job: 14,
    lifestyle: 8,
    horoscope: 8,
    languages: 5,
    profile: 5,
    interests_hobbies: 2,
  };

  let score = 0;

  // ----- 1) Age match -----
  const agePref = safeRange(user.partnerPreferencesDetails?.ageRange);
  const candidateAge = candidate.personalDetails?.age || 0;

  if (agePref && agePref.length === 2) {
    if (candidateAge >= agePref[0] && candidateAge <= agePref[1]) {
      score += weights.age;
    } else {
      const diff = Math.min(
        Math.abs(candidateAge - agePref[0]),
        Math.abs(candidateAge - agePref[1])
      );
      score += Math.max(0, (1 - diff / 5)) * weights.age;
    }
  } else {
    const diff = Math.abs(candidateAge - (user.personalDetails?.age || 0));
    score += Math.max(0, (1 - diff / 5)) * weights.age;
  }

  // ----- 1.5) Marital Status -----
  const userMarital = normalize(user.personalDetails?.maritalStatus);
  const candidateMarital = normalize(candidate.personalDetails?.maritalStatus);

  if (userMarital && candidateMarital) {

    if (candidateMarital === 'married') {
      return 0; // hard reject
    }

    if (userMarital === candidateMarital) {
      score += weights.maritalStatus;
    } else {
      const compatibilityMap = {
        unmarried: ['unmarried'],
        divorcee: ['divorcee', 'widowed', 'separated'],
        widowed: ['widowed', 'divorcee'],
        separated: ['separated', 'divorcee'],
      };

      if (compatibilityMap[userMarital]?.includes(candidateMarital)) {
        score += weights.maritalStatus * 0.8;
      }
    }
  }

  // ----- 2) Location -----
  const locations = safeSplit(user.partnerPreferencesDetails?.locationPreferences);

  if (
    candidate.contactDetails?.city &&
    locations.includes(candidate.contactDetails.city.toLowerCase())
  ) {
    score += weights.location;
  }

  // ----- 3) Religion & Caste -----
  if (candidate.personalDetails?.religion === user.personalDetails?.religion) {
    if (candidate.personalDetails?.caste === user.personalDetails?.caste) {
      score += weights.religion_caste;
    } else if (user.familyDetails?.intercasteMarriage === 'Yes') {
      score += weights.religion_caste * 0.5;
    }
  }

  // ----- 4) Education / Job -----
  const eduPref = normalize(user.partnerPreferencesDetails?.educationPreferences);
  const occPref = normalize(user.partnerPreferencesDetails?.occupationPreferences);
  const candidateEdu = normalize(candidate.educationDetails?.highestQualification);
  const candidateOcc = normalize(candidate.careerDetails?.occupation);

  if (eduPref === 'any' || (eduPref && candidateEdu.includes(eduPref))) {
    score += weights.education_job;
  }

  if (occPref && candidateOcc.includes(occPref)) {
    score += weights.education_job * 0.5;
  }

  // ----- 5) Lifestyle -----
  const lifestylePrefs = safeSplit(user.partnerPreferencesDetails?.lifestylePreferences);
  const candidateDiet = normalize(candidate.lifestyleDetails?.diet);

  if (lifestylePrefs.includes(candidateDiet)) {
    score += weights.lifestyle;
  }

  // ----- 6) Horoscope -----
  const horo = candidate.horoscopeDetails || {};
  const userHoro = user.horoscopeDetails || {};

  if (horo.rashi && userHoro.rashi && horo.rashi === userHoro.rashi) {
    score += weights.horoscope * 0.5;
  }
  if (horo.nakshatra && userHoro.nakshatra && horo.nakshatra === userHoro.nakshatra) {
    score += weights.horoscope * 0.3;
  }
  if (horo.mangal && userHoro.mangal && horo.mangal === userHoro.mangal) {
    score += weights.horoscope * 0.2;
  }

  // ----- 7) Languages -----
  const langPrefs = safeSplit(user.partnerPreferencesDetails?.languagesPreferences);
  const candidateLangs = safeSplit(candidate.personalDetails?.languagesSpoken);

  const commonLangs = candidateLangs.filter(l => langPrefs.includes(l));

  if (commonLangs.length > 0 && langPrefs.length > 0) {
    score += (commonLangs.length / langPrefs.length) * weights.languages;
  }

  // ----- 8) Profile completeness -----
  const completeness = candidate.profileCompletion || 0;
  if (completeness >= 80) score += weights.profile;
  else if (completeness >= 50) score += weights.profile * 0.5;

  // ----- 9) Interests & Hobbies -----
  const userHobbies = safeSplit(user.lifestyleDetails?.hobbies);
  const candidateHobbies = safeSplit(candidate.lifestyleDetails?.hobbies);

  const commonHobbies = candidateHobbies.filter(h => userHobbies.includes(h));

  if (commonHobbies.length > 0 && userHobbies.length > 0) {
    score += (commonHobbies.length / userHobbies.length) * weights.interests_hobbies;
  }

  // ----- 🔥 BONUS BOOSTS (Optional but powerful) -----

  // Premium boost
  if (candidate.plan === 'premium') {
    score += 5;
  }

  // Recently active boost
  if (candidate.lastActive) {
    const days = (Date.now() - new Date(candidate.lastActive)) / (1000 * 60 * 60 * 24);
    if (days < 3) score += 3;
  }

  return Math.round(Math.min(score, 100));
}


// ======================================================
// MAIN API CONTROLLER (Upgraded)
// ======================================================
exports.getRecommendationsNews = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
    const userId = req.userId;

    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });

    // Fetch logged-in user
    const userQuery = `
      SELECT u.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      WHERE u.userId=$userId LIMIT 1;
    `;
    const userResult = await cluster.query(userQuery, { parameters: { userId } });
    const currentUser = userResult.rows[0];

    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // Candidate fetch query
    const candidatesQuery = `
      SELECT u.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      WHERE u.userId != $userId
      AND u.status IN ["active","verified"]
      AND u.personalDetails.gender != $gender
      LIMIT 300;
    `;
    const candidates = await cluster.query(candidatesQuery, {
      parameters: { userId, gender: currentUser.personalDetails.gender }
    });

    // Calculate match scores
    const scoredCandidates = candidates.rows.map(c => ({
      ...c,
      matchScore: calculateMatchScore(currentUser, c)
    }));

    // Sort by matchScore descending
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    // Take top 40 matches
    const topRecommendations = scoredCandidates.slice(0, 40);

    // Separate highest match
    const topMatch = topRecommendations[0] || null;

    return res.json({
      success: true,
      total: topRecommendations.length,
      topMatch,
      recommendations: topRecommendations
    });

  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ error: "Internal Error", message: error.message });
  }
};

exports.getRecommendationsNew = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing"
      });
    }

    /* ----------------------------------
       1️⃣ Fetch Logged-in User
    ----------------------------------- */
    const userQuery = `
      SELECT u.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      WHERE u.userId = $userId
      LIMIT 1;
    `;

    const userResult = await cluster.query(userQuery, {
      parameters: { userId }
    });

    const currentUser = userResult.rows[0];

    if (!currentUser || !currentUser.personalDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const gender = currentUser.personalDetails.gender;

    /* ----------------------------------
       2️⃣ Fetch Candidates + Interest Info
    ----------------------------------- */
    const candidatesQuery = `
      SELECT 
        c.userId,
        c.personalDetails,
        c.photoDetails,
        c.contactDetails,
        c.educationDetails,
        c.careerDetails,
        c.horoscopeDetails,
        c.familyDetails,
        c.lifestyleDetails,
        c.partnerPreferencesDetails,
        c.additionalInfoDetails,
        c.profileCompletion,

        interestData.interestId,
        interestData.status AS interestStatus,
        interestData.initiatedBy

      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` c

      LET interestData = (
        SELECT RAW {
          "interestId": META(i).id,
          "status": i.status,
          "initiatedBy": i.initiatedBy
        }
        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i
        WHERE i.type = "interest"
          AND (
            (i.user1 = $userId AND i.user2 = c.userId)
            OR
            (i.user2 = $userId AND i.user1 = c.userId)
          )
        LIMIT 1
      )[0]

      WHERE c.userId != $userId
        AND c.personalDetails.gender != $gender
        AND c.status IN ["active","verified"]

      LIMIT 300;
    `;

    const candidatesResult = await cluster.query(candidatesQuery, {
      parameters: { userId, gender }
    });

    let candidates = candidatesResult.rows;

    /* ----------------------------------
       3️⃣ Remove Accepted Matches
    ----------------------------------- */
    candidates = candidates.filter(c => c.interestStatus !== "accepted");

    /* ----------------------------------
       4️⃣ Add Helper Boolean
    ----------------------------------- */
    candidates = candidates.map(c => ({
      ...c,
      hasPendingInterest: c.interestStatus === "pending"
    }));

    /* ----------------------------------
       5️⃣ Calculate Match Score
    ----------------------------------- */
    const scoredCandidates = candidates.map(c => ({
      ...c,
      matchScore: calculateMatchScore(currentUser, c)
    }));

    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    const topRecommendations = scoredCandidates.slice(0, 40);
    const topMatch = topRecommendations[0] || null;

    /* ----------------------------------
       6️⃣ Final Response
    ----------------------------------- */
    return res.json({
      success: true,
      total: topRecommendations.length,
      topMatch,
      recommendations: topRecommendations
    });

  } catch (error) {
    console.error("Recommendation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Error",
      error: error.message
    });
  }
};

