const couchbase = require('couchbase');
const { connectToCouchbase } = require("../config/db.config");
const jwt = require('jsonwebtoken');
const axios = require("axios");



exports.updateUserProfile = async (req, res) => 
{
      // Connect to Couchbase
      const { collection } = await connectToCouchbase();
      const userId = req.userId; // Extracted from JWT
      const userProfileData = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in token' });
      }
      // Build mutateIn operations for each field
      const mutations = Object.keys(userProfileData).map(key => 
        couchbase.MutateInSpec.upsert(key, userProfileData[key]) // Generate upsert mutations
      );
    
      try {
        await collection.mutateIn(userId, mutations); // Apply partial updates
        return res.status(200).json({ success: true, message: 'Profile updated successfully!' }); // 👈 FIXED
      } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ success: false, error: error.message }); // 👈 FIXED
      }
};


exports.getUserProfile = async (req, res) => 
  {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
          return res.status(400).json({ message: "Token is required for logout" });
      }
      // Verify and decode the token
      try {
        // Decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "tanishkafunde"); 
        // Access id and email
        const { id, email } = decoded;
        console.log('ID:', id);
        console.log('Email:', email);
        const { collection } = await connectToCouchbase();
        // Fetch the document by its key
        const result = await collection.get(id);
      
        // Return the document content
        res.status(200).json(result.value);

      } catch (err) {
          return res.status(401).json({ message: "Invalid or expired token" });
      }
  };

/*
  exports.searchProfile = async (req, res) => 
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
						AND (
						  ($SrchUserId IS NOT VALUED OR u.userId = $SrchUserId)
						)
						AND (
						  ($nativePlace IS NOT VALUED OR u.familyDetails.nativeDistrict = $nativePlace OR u.familyDetails.nativeTaluka = $nativePlace)
						)
						AND (
						  ($highestQualification IS NOT VALUED OR u.educationDetails.highestQualification = $highestQualification)
						)
						AND (
						  ($occupation IS NOT VALUED OR u.careerDetails.occupation = $occupation)
						)
						AND (
							($ageMin IS NOT VALUED OR u.personalDetails.age >= $ageMin)
						)
						AND (
							($ageMax IS NOT VALUED OR u.personalDetails.age <= $ageMax)
						)
						AND (
							($heightMin IS NOT VALUED OR u.personalDetails.height >= $heightMin)
						)
						AND (
							($heightMax IS NOT VALUED OR u.personalDetails.height <= $heightMax)
						)
						AND (
							($mangal IS NOT VALUED OR u.horoscopeDetails.mangal = $mangal)
						)
						AND (
							($maritalStatus IS NOT VALUED OR u.personalDetails.maritalStatus = $maritalStatus)
						)
						AND u.personalDetails.gender != currentUser.personalDetails.gender
						AND u.status != "inactive" AND u.status != "deleted"
					  LIMIT $pageSize OFFSET $offset;
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
*/



exports.searchProfile1 = async (req, res) => {
  const { cluster } = await connectToCouchbase();
  const currentUserId = req.userId;

  if (!currentUserId) {
    return res.status(400).json({ success: false, message: 'User ID not found in token' });
  }

  // Normalize empty strings to null
  const fields = ["gender","religion","caste","mangal","city","state","country",
    "highestQualification","occupation","diet","smoking","drinking"];
  fields.forEach(f => { if(req.body[f]==="") req.body[f]=null; });

  // Destructure filters with defaults
  const {
    gender=null, religion=null, caste=null, mangal=null,
    city=null, state=null, country=null, highestQualification=null,
    occupation=null, diet=null, smoking=null, drinking=null,
    ageMin=null, ageMax=null, heightMin=null, heightMax=null,
    page=1, pageSize=6
  } = req.body;

  const offset = (page-1)*pageSize;

  try {
    // Check if any filter is provided
    const anyFilterProvided = gender || religion || caste || mangal || city || state || country ||
                              highestQualification || occupation || diet || smoking || drinking ||
                              ageMin || ageMax || heightMin || heightMax;

    // Base query: exclude current user, inactive/deleted, and same gender
    let query = `
      SELECT 
        u.userId,
						  -- Personal Details
    u.personalDetails.firstName,
    u.personalDetails.middleName,
    u.personalDetails.lastName,
    u.personalDetails.dateOfBirth,
    u.personalDetails.age,
    u.personalDetails.gender,
    u.personalDetails.religion,
    u.personalDetails.caste,
    u.personalDetails.subCaste,
    u.personalDetails.maritalStatus,
    u.personalDetails.height,
    u.personalDetails.heightUnit,
    u.personalDetails.weight,
    u.personalDetails.bloodGroup,
    u.personalDetails.complexion,
    u.personalDetails.physicalDisability,
    u.personalDetails.disabilityDetails,
    u.personalDetails.languagesSpoken,
	u.personalDetails.diet AS personalDiet,
    u.personalDetails.spectacles,
    u.personalDetails.lens,

    -- Contact Details
    u.contactDetails.emailAddress,
    u.contactDetails.phoneNumber,
    u.contactDetails.city,
    u.contactDetails.state,
    u.contactDetails.country,

    -- Photo Details
    u.photoDetails.profilePicture AS photoUrl,
    u.photoDetails.familyPicture AS familyPhotoUrl,

    -- Horoscope Details
    u.horoscopeDetails.rashi,
    u.horoscopeDetails.nakshatra,
    u.horoscopeDetails.charan,
    u.horoscopeDetails.nadi,
    u.horoscopeDetails.gan,
    u.horoscopeDetails.mangal,
    u.horoscopeDetails.birthTime,
    u.horoscopeDetails.birthPlace,
    u.horoscopeDetails.deva,

    -- Family Details
    u.familyDetails.father,
    u.familyDetails.fatherName,
    u.familyDetails.fatherOccupation,
    u.familyDetails.mother,
    u.familyDetails.motherName,
    u.familyDetails.motherOccupation,
    u.familyDetails.hasBrothers,
    u.familyDetails.brothersCount,
    u.familyDetails.brothersMarriedCount,
    u.familyDetails.hasSisters,
    u.familyDetails.sistersCount,
    u.familyDetails.sistersMarriedCount,
    u.familyDetails.parentsResidentCity,
    u.familyDetails.relativesSurnames,
    u.familyDetails.familyWealth,
    u.familyDetails.mamaNameAndPlace,
    u.familyDetails.nativeDistrict,
    u.familyDetails.otherDistrict,
    u.familyDetails.nativeTaluka,
    u.familyDetails.intercasteMarriage,
    u.familyDetails.intercasteDetails,
    u.familyDetails.siblingsDetails,
    u.familyDetails.familyType,

    -- Education Details
    u.educationDetails.highestQualification,
    u.educationDetails.collegeName,
    u.educationDetails.yearOfCompletion,
    u.educationDetails.additionalQualifications,
    u.educationDetails.educationType,

    -- Career Details
    u.careerDetails.occupation,
    u.careerDetails.jobTitle,
    u.careerDetails.companyName,
    u.careerDetails.annualIncome,
    u.careerDetails.workLocationCity,
    u.careerDetails.workLocationCountry,
    u.careerDetails.employmentType,
    u.careerDetails.previousWorkExperience,

    -- Lifestyle Details
	u.lifestyleDetails.diet AS lifestyleDiet,
    u.lifestyleDetails.smoking,
    u.lifestyleDetails.drinking,
    u.lifestyleDetails.hobbies,
    u.lifestyleDetails.sportsActivities,
    u.lifestyleDetails.favoriteBooks,
    u.lifestyleDetails.favoriteMovies,
    u.lifestyleDetails.favoritetvShows,

    -- Partner Preferences
    u.partnerPreferencesDetails.ageRange,
    u.partnerPreferencesDetails.heightPreference,
    u.partnerPreferencesDetails.religionCastePreferences,
    u.partnerPreferencesDetails.educationPreferences,
    u.partnerPreferencesDetails.occupationPreferences,
    u.partnerPreferencesDetails.locationPreferences,
    u.partnerPreferencesDetails.languagesPreferences,
    u.partnerPreferencesDetails.lifestylePreferences,

    -- Additional Info
    u.additionalInfoDetails.personalDescription,
    u.additionalInfoDetails.reasonForPartner,
    u.additionalInfoDetails.partnerExpectations,

    -- Other Info
    u.start_date,
    u.end_date,
    u.lastLogin,
    u.profileCompletion,

    -- Interest status if joined with interests
    i.status AS interestStatus
		FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
        JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` currentUser
        ON currentUser.userId = $currentUserId
	    LEFT JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i
		ON i.fromUserId = currentUser.userId
		AND i.toUserId = u.userId
		AND i.type = "interest"
      WHERE u.userId != $currentUserId
        AND u.status != "inactive" AND u.status != "deleted"
        AND u.personalDetails.gender != currentUser.personalDetails.gender
    `;

    // Apply filters only if any filter is provided
    if (anyFilterProvided) {
      query += `
        AND (
          ($gender IS VALUED AND u.personalDetails.gender = $gender) AND
          ($religion IS VALUED AND u.personalDetails.religion = $religion) AND
          ($caste IS VALUED AND u.personalDetails.caste = $caste) AND
          ($mangal IS VALUED AND u.horoscopeDetails.mangal = $mangal) AND
          ($city IS VALUED AND u.contactDetails.city = $city) AND
          ($state IS VALUED AND u.contactDetails.state = $state) AND
          ($country IS VALUED AND u.contactDetails.country = $country) AND
          ($highestQualification IS VALUED AND u.educationDetails.highestQualification = $highestQualification) AND
          ($occupation IS VALUED AND u.careerDetails.occupation = $occupation) AND
          ($diet IS VALUED AND u.lifestyleDetails.diet = $diet) AND
          ($smoking IS VALUED AND u.lifestyleDetails.smoking = $smoking) AND
          ($drinking IS VALUED AND u.lifestyleDetails.drinking = $drinking) AND
          ($ageMin IS VALUED AND u.personalDetails.age >= $ageMin) AND
          ($ageMax IS VALUED AND u.personalDetails.age <= $ageMax) AND
          ($heightMin IS VALUED AND u.personalDetails.height >= $heightMin) AND
          ($heightMax IS VALUED AND u.personalDetails.height <= $heightMax)
        )
      `;
    }

    query += ` LIMIT $pageSize OFFSET $offset;`;

    const result = await cluster.query(query, {
      parameters: {
        currentUserId, gender, religion, caste, mangal,
        city, state, country, highestQualification, occupation,
        diet, smoking, drinking, ageMin, ageMax, heightMin, heightMax,
        pageSize, offset
      }
    });

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};



// ======================================================
// MATCHMAKING SCORE FUNCTION (Reusable)
// ======================================================
function calculateMatchScore(user, candidate) {
  const weights = {
    age: 20,
    location: 15,
    religion_caste: 15,
    education_job: 15,
    lifestyle: 10,
    horoscope: 8,
    languages: 5,
    profile: 7,
    interests_hobbies: 5,
  };

  let score = 0;

  // ----- 1) Age match -----
  const agePref = user.partnerPreferencesDetails?.ageRange?.split('-').map(a => parseInt(a.trim()));
  const candidateAge = candidate.personalDetails?.age || 0;
  if (agePref && agePref.length === 2) {
    if (candidateAge >= agePref[0] && candidateAge <= agePref[1]) score += weights.age;
    else {
      const diff = Math.min(Math.abs(candidateAge - agePref[0]), Math.abs(candidateAge - agePref[1]));
      score += Math.max(0, (1 - diff / 5)) * weights.age;
    }
  } else {
    const diff = Math.abs(candidateAge - (user.personalDetails?.age || 0));
    score += Math.max(0, (1 - diff / 5)) * weights.age;
  }

  // ----- 2) Location -----
  if (user.partnerPreferencesDetails?.locationPreferences) {
    const locations = user.partnerPreferencesDetails.locationPreferences.split(',').map(l => l.trim().toLowerCase());
    if (candidate.contactDetails?.city && locations.includes(candidate.contactDetails.city.toLowerCase())) {
      score += weights.location;
    }
  }

  // ----- 3) Religion & Caste -----
  if (candidate.personalDetails?.religion === user.personalDetails?.religion) {
    if (candidate.personalDetails?.caste === user.personalDetails?.caste) score += weights.religion_caste;
    else if (user.familyDetails?.intercasteMarriage === "Yes") score += weights.religion_caste * 0.5;
  }

  // ----- 4) Education / Job -----
  const eduPref = (user.partnerPreferencesDetails?.educationPreferences || "").toLowerCase();
  const occPref = (user.partnerPreferencesDetails?.occupationPreferences || "").toLowerCase();
  const candidateEdu = (candidate.educationDetails?.highestQualification || "").toLowerCase();
  const candidateOcc = (candidate.careerDetails?.occupation || "").toLowerCase();

  if (eduPref === "any" || candidateEdu.includes(eduPref)) score += weights.education_job;
  if (occPref && candidateOcc.includes(occPref)) score += weights.education_job * 0.5;

  // ----- 5) Lifestyle -----
  if (user.partnerPreferencesDetails?.lifestylePreferences) {
    const lifestylePrefs = user.partnerPreferencesDetails.lifestylePreferences.split(',').map(l => l.trim().toLowerCase());
    const candidateDiet = (candidate.lifestyleDetails?.diet || "").toLowerCase();
    if (lifestylePrefs.includes(candidateDiet)) score += weights.lifestyle;
  }

  // ----- 6) Horoscope -----
  const horo = candidate.horoscopeDetails || {};
  const userHoro = user.horoscopeDetails || {};
  if (horo.rashi && userHoro.rashi && horo.rashi === userHoro.rashi) score += weights.horoscope * 0.5;
  if (horo.nakshatra && userHoro.nakshatra && horo.nakshatra === userHoro.nakshatra) score += weights.horoscope * 0.3;
  if (horo.mangal && userHoro.mangal && horo.mangal === userHoro.mangal) score += weights.horoscope * 0.2;

  // ----- 7) Languages -----
  if (user.partnerPreferencesDetails?.languagesPreferences) {
    const langPrefs = user.partnerPreferencesDetails.languagesPreferences.split(',').map(l => l.trim().toLowerCase());
    const candidateLangs = (candidate.personalDetails?.languagesSpoken || "").split(',').map(l => l.trim().toLowerCase());
    const commonLangs = candidateLangs.filter(l => langPrefs.includes(l));
    if (commonLangs.length > 0) score += (commonLangs.length / langPrefs.length) * weights.languages;
  }

  // ----- 8) Profile completeness -----
  const completeness = candidate.profileCompletion || 0;
  if (completeness >= 80) score += weights.profile;
  else if (completeness >= 50) score += weights.profile * 0.5;

  // ----- 9) Interests & Hobbies -----
  if (candidate.lifestyleDetails?.hobbies && user.lifestyleDetails?.hobbies) {
    const userHobbies = (user.lifestyleDetails.hobbies || "").split(',').map(h => h.trim().toLowerCase());
    const candidateHobbies = candidate.lifestyleDetails.hobbies.split(',').map(h => h.trim().toLowerCase());
    const commonHobbies = candidateHobbies.filter(h => userHobbies.includes(h));
    if (commonHobbies.length > 0) score += (commonHobbies.length / userHobbies.length) * weights.interests_hobbies;
  }

  return Math.round(Math.min(score, 100));
}

exports.searchProfile = async (req, res) => {
  const { cluster } = await connectToCouchbase();
  const currentUserId = req.userId;

  if (!currentUserId) {
    return res.status(400).json({ success: false, message: "User ID not found in token" });
  }

  // Normalize empty strings to null
  const fields = ["gender","religion","caste","mangal","city","state","country",
    "highestQualification","occupation","diet","smoking","drinking"];
  fields.forEach(f => { if(req.body[f]==="") req.body[f]=null; });

  // Destructure filters
  const {
    gender=null, religion=null, caste=null, mangal=null,
    city=null, state=null, country=null, highestQualification=null,
    occupation=null, diet=null, smoking=null, drinking=null,
    ageMin=null, ageMax=null, heightMin=null, heightMax=null,
    page=1, pageSize=6
  } = req.body;

  const offset = (page - 1) * pageSize;

  try {
    // Fetch logged-in user for scoring
    const userQuery = `
      SELECT u.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      WHERE u.userId = $currentUserId LIMIT 1;
    `;

    const userResult = await cluster.query(userQuery, { parameters: { currentUserId } });
    const currentUser = userResult.rows[0];

    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // 🔍 SEARCH QUERY
    let query = `
    SELECT
	u.userId,
	u.personalDetails,
	-- Personal Details
    -- u.personalDetails.firstName,
    -- u.personalDetails.middleName,
    -- u.personalDetails.lastName,
    -- u.personalDetails.dateOfBirth,
    -- u.personalDetails.age,
    -- u.personalDetails.gender,
    -- u.personalDetails.religion,
    -- u.personalDetails.caste,
    -- u.personalDetails.subCaste,
    -- u.personalDetails.maritalStatus,
    -- u.personalDetails.height,
    -- u.personalDetails.heightUnit,
    -- u.personalDetails.weight,
    -- u.personalDetails.bloodGroup,
    -- u.personalDetails.complexion,
    -- u.personalDetails.physicalDisability,
    -- u.personalDetails.disabilityDetails,
    -- u.personalDetails.languagesSpoken,
	-- u.personalDetails.diet AS personalDiet,
    -- u.personalDetails.spectacles,
    -- u.personalDetails.lens,
	   u.contactDetails,
    -- Contact Details
    -- u.contactDetails.emailAddress,
    -- u.contactDetails.phoneNumber,
    -- u.contactDetails.city,
    -- u.contactDetails.state,
    -- u.contactDetails.country,

    -- Photo Details
    u.photoDetails.profilePicture AS photoUrl,
    u.photoDetails.familyPicture AS familyPhotoUrl,
	u. horoscopeDetails,
    -- Horoscope Details
    -- u.horoscopeDetails.rashi,
    -- u.horoscopeDetails.nakshatra,
    -- u.horoscopeDetails.charan,
    -- u.horoscopeDetails.nadi,
    -- u.horoscopeDetails.gan,
    -- u.horoscopeDetails.mangal,
    -- u.horoscopeDetails.birthTime,
    -- u.horoscopeDetails.birthPlace,
    -- u.horoscopeDetails.deva,
	   u.familyDetails,
    -- Family Details
     -- u.familyDetails.father,
     -- u.familyDetails.fatherName,
     -- u.familyDetails.fatherOccupation,
     -- u.familyDetails.mother,
     -- u.familyDetails.motherName,
     -- u.familyDetails.motherOccupation,
     -- u.familyDetails.hasBrothers,
     -- u.familyDetails.brothersCount,
     -- u.familyDetails.brothersMarriedCount,
     -- u.familyDetails.hasSisters,
     -- u.familyDetails.sistersCount,
     -- u.familyDetails.sistersMarriedCount,
     -- u.familyDetails.parentsResidentCity,
     -- u.familyDetails.relativesSurnames,
     -- u.familyDetails.familyWealth,
     -- u.familyDetails.mamaNameAndPlace,
     -- u.familyDetails.nativeDistrict,
     -- u.familyDetails.otherDistrict,
     -- u.familyDetails.nativeTaluka,
     -- u.familyDetails.intercasteMarriage,
     -- u.familyDetails.intercasteDetails,
     -- u.familyDetails.siblingsDetails,
     -- u.familyDetails.familyType,
		u.educationDetails,
    -- Education Details
    -- u.educationDetails.highestQualification,
    -- u.educationDetails.collegeName,
    -- u.educationDetails.yearOfCompletion,
    -- u.educationDetails.additionalQualifications,
    -- u.educationDetails.educationType,
	   u.careerDetails,
    -- Career Details
    -- u.careerDetails.occupation,
    -- u.careerDetails.jobTitle,
    -- u.careerDetails.companyName,
    -- u.careerDetails.annualIncome,
    -- u.careerDetails.workLocationCity,
    -- u.careerDetails.workLocationCountry,
    -- u.careerDetails.employmentType,
    -- u.careerDetails.previousWorkExperience,
	   u.lifestyleDetails,
    -- Lifestyle Details
	-- u.lifestyleDetails.diet AS lifestyleDiet,
    -- u.lifestyleDetails.smoking,
    -- u.lifestyleDetails.drinking,
    -- u.lifestyleDetails.hobbies,
    -- u.lifestyleDetails.sportsActivities,
    -- u.lifestyleDetails.favoriteBooks,
    -- u.lifestyleDetails.favoriteMovies,
    -- u.lifestyleDetails.favoritetvShows,

    -- Partner Preferences
	   u.partnerPreferencesDetails,
    -- u.partnerPreferencesDetails.ageRange,
    -- u.partnerPreferencesDetails.heightPreference,
    -- u.partnerPreferencesDetails.religionCastePreferences,
    -- u.partnerPreferencesDetails.educationPreferences,
    -- u.partnerPreferencesDetails.occupationPreferences,
    -- u.partnerPreferencesDetails.locationPreferences,
    -- u.partnerPreferencesDetails.languagesPreferences,
    -- u.partnerPreferencesDetails.lifestylePreferences,
	   u.additionalInfoDetails,
    -- Additional Info
    -- u.additionalInfoDetails.personalDescription,
    -- u.additionalInfoDetails.reasonForPartner,
    -- u.additionalInfoDetails.partnerExpectations,

    -- Other Info
    -- u.start_date,
    -- u.end_date,
    u.lastLogin,
    u.profileCompletion,

    -- Interest status if joined with interests
    i.status AS interestStatus
	
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` currentUser
        ON currentUser.userId = $currentUserId
      LEFT JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i
        ON i.fromUserId = currentUser.userId
        AND i.toUserId = u.userId
      WHERE u.userId != $currentUserId
        AND u.status="active"
        AND u.personalDetails.gender != currentUser.personalDetails.gender
    `;

    // filters
    if (gender) query += ` AND u.personalDetails.gender = $gender`;
    if (religion) query += ` AND u.personalDetails.religion = $religion`;
    if (caste) query += ` AND u.personalDetails.caste = $caste`;
    if (mangal) query += ` AND u.horoscopeDetails.mangal = $mangal`;
    if (city) query += ` AND u.contactDetails.city = $city`;
    if (state) query += ` AND u.contactDetails.state = $state`;
    if (country) query += ` AND u.contactDetails.country = $country`;
    if (highestQualification) query += ` AND u.educationDetails.highestQualification = $highestQualification`;
    if (occupation) query += ` AND u.careerDetails.occupation = $occupation`;
    if (diet) query += ` AND u.lifestyleDetails.diet = $diet`;
    if (smoking) query += ` AND u.lifestyleDetails.smoking = $smoking`;
    if (drinking) query += ` AND u.lifestyleDetails.drinking = $drinking`;
    if (ageMin) query += ` AND u.personalDetails.age >= $ageMin`;
    if (ageMax) query += ` AND u.personalDetails.age <= $ageMax`;
    if (heightMin) query += ` AND u.personalDetails.height >= $heightMin`;
    if (heightMax) query += ` AND u.personalDetails.height <= $heightMax`;

    query += ` LIMIT $pageSize OFFSET $offset`;

    const result = await cluster.query(query, {
      parameters: {
        currentUserId, gender, religion, caste, mangal,
        city, state, country, highestQualification, occupation,
        diet, smoking, drinking, ageMin, ageMax, heightMin, heightMax,
        pageSize, offset
      }
    });

    const candidates = result.rows;

    // ⭐ APPLY MATCH SCORE ⭐
    const scored = candidates.map(c => ({
      ...c,
      matchScore: calculateMatchScore(currentUser, c)
    }));

    // Sort by score
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      total: scored.length,
      results: scored
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};



exports.searchProfilesAdvOld = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
    const currentUserId = req.userId; // Extracted from JWT

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
             u.profileCompletion,
			 i.status AS interestStatus,
		    (i.status = "sent") AS hasSentInterest
			FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
			JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` currentUser 
			ON currentUser.userId = $currentUserId
			LEFT JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i
			ON i.fromUserId = currentUser.userId
			AND i.toUserId = u.userId
			AND i.type = "interest"
			WHERE u.status IN ["active","verified"]
			AND u.personalDetails.gender != currentUser.personalDetails.gender

        AND ($profileId IS NOT VALUED OR u.userId = $profileId)
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
      LIMIT $pageSize OFFSET $offset;
    `;

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
	  currentUserId,
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

exports.searchProfilesAdv1 = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
    const currentUserId = req.userId; // from JWT

    const normalize = (value) => {
      if (value === undefined || value === null) return null;
      if (typeof value === "string" && value.trim() === "") return null;
      if (Array.isArray(value) && value.length === 0) return null;
      return value;
    };
    const normalizeNumber = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const n = Number(value);
      return isNaN(n) ? null : n;
    };

    Object.keys(req.body).forEach((key) => {
      req.body[key] = normalize(req.body[key]);
    });

    const page = Number(req.body.page || 1);
    const pageSize = Number(req.body.pageSize || 6);
    const offset = (page - 1) * pageSize;

    const ageMin = normalizeNumber(req.body.ageMin ?? req.body.age?.min);
    const ageMax = normalizeNumber(req.body.ageMax ?? req.body.age?.max);
    const heightMin = normalizeNumber(req.body.heightMin ?? req.body.height?.min);
    const heightMax = normalizeNumber(req.body.heightMax ?? req.body.height?.max);
    const incomeMin = normalizeNumber(req.body.incomeMin ?? req.body.income?.min);
    const incomeMax = normalizeNumber(req.body.incomeMax ?? req.body.income?.max);

    const nativeCity = req.body.nativePlace || null;
    const workCity = req.body.workPlace || null;

    const {
      profileId = null,
      maritalStatus = null,
      occupationType = null,
      education = null,
      subCaste = null,
      manglik = null,
      diet = null
    } = req.body;

    const params = {
      profileId,
      maritalStatus: Array.isArray(maritalStatus) ? maritalStatus : maritalStatus ? [maritalStatus] : null,
      occupationType: Array.isArray(occupationType) ? occupationType : occupationType ? [occupationType] : null,
      education: Array.isArray(education) ? education : education ? [education] : null,
      subCaste: Array.isArray(subCaste) ? subCaste : subCaste ? [subCaste] : null,
      nativeCity,
      workCity,
      manglik,
      diet,
      ageMin,
      ageMax,
      heightMin,
      heightMax,
      incomeMin,
      incomeMax,
      currentUserId,
      pageSize,
      offset
    };

    // -------------------------------
    // FETCH CURRENT USER
    // -------------------------------
    const currentUserQuery = `
      SELECT *
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\`
      WHERE userId = $currentUserId
      LIMIT 1
    `;
    const currentUserResult = await cluster.query(currentUserQuery, { parameters: { currentUserId } });
    const currentUser = currentUserResult.rows[0];
    if (!currentUser) throw new Error("Current user not found");

    // -------------------------------
    // FETCH PAGINATED FILTERED PROFILES
    // -------------------------------
    const query = `
      SELECT 
        u.userId,
        u.personalDetails,
        u.photoDetails,
        u.contactDetails,
        u.educationDetails,
        u.careerDetails,
		u.horoscopeDetails,
		u.familyDetails,
		u.lifestyleDetails,
		u.partnerPreferencesDetails,
		u.additionalInfoDetails,
		u.profileCompletion,
        (i.status = "sent") AS hasInterest
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` currentUser
	  ON currentUser.userId = $currentUserId
      LEFT JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i
	  ON i.fromUserId = $currentUserId
      AND i.toUserId = u.userId
      AND i.type = "interest"
      WHERE u.status IN ["active","verified"]
        AND u.userId != $currentUserId
        AND u.personalDetails.gender != currentUser.personalDetails.gender

        AND ($profileId IS NOT VALUED OR u.userId = $profileId)
        AND ($maritalStatus IS NOT VALUED OR u.personalDetails.maritalStatus IN $maritalStatus)
        AND ($education IS NOT VALUED OR u.educationDetails.highestQualification IN $education)
        AND ($occupationType IS NOT VALUED OR u.careerDetails.occupation IN $occupationType)

        AND ($nativeCity IS NOT VALUED OR u.familyDetails.nativeCity = $nativeCity)
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
      LIMIT $pageSize OFFSET $offset;
    `;

    const result = await cluster.query(query, { parameters: params });
    let profiles = result.rows;

    // -------------------------------
    // CALCULATE MATCH SCORE ONLY FOR FETCHED PAGE
    // -------------------------------
    profiles = profiles.map((candidate) => {
      const score = calculateMatchScore(currentUser, candidate);
      return { ...candidate, matchScore: score };
    });

    // -------------------------------
    // SEND RESPONSE
    // -------------------------------
    res.status(200).json({
      page,
      pageSize,
      totalResults: profiles.length, // can be replaced with separate COUNT query if needed
      profiles
    });

  } catch (error) {
    console.error("Search Query Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message
    });
  }
};

exports.searchProfilesAdv = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing"
      });
    }

    /* ----------------------------------
       NORMALIZE INPUT
    ----------------------------------- */
    const normalize = (value) => {
      if (value === undefined || value === null) return null;
      if (typeof value === "string" && value.trim() === "") return null;
      if (Array.isArray(value) && value.length === 0) return null;
      return value;
    };

    const normalizeNumber = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const n = Number(value);
      return isNaN(n) ? null : n;
    };

    Object.keys(req.body).forEach((key) => {
      req.body[key] = normalize(req.body[key]);
    });

    const page = Number(req.body.page || 1);
    const pageSize = Number(req.body.pageSize || 6);
    const offset = (page - 1) * pageSize;

    const ageMin = normalizeNumber(req.body.ageMin);
    const ageMax = normalizeNumber(req.body.ageMax);
    const heightMin = normalizeNumber(req.body.heightMin);
    const heightMax = normalizeNumber(req.body.heightMax);
    const incomeMin = normalizeNumber(req.body.incomeMin);
    const incomeMax = normalizeNumber(req.body.incomeMax);

    const nativeCity = req.body.nativePlace || null;
    const workCity = req.body.workPlace || null;

    const {
      profileId = null,
      maritalStatus = null,
      occupationType = null,
      education = null,
      subCaste = null,
      manglik = null,
      diet = null
    } = req.body;

    /* ----------------------------------
       FETCH CURRENT USER
    ----------------------------------- */
    const currentUserQuery = `
      SELECT *
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\`
      WHERE userId = $currentUserId
      LIMIT 1
    `;

    const currentUserResult = await cluster.query(currentUserQuery, {
      parameters: { currentUserId }
    });

    const currentUser = currentUserResult.rows[0];

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found"
      });
    }

    /* ----------------------------------
       IF PROFILE ID SEARCH → FAST QUERY
    ----------------------------------- */
    if (profileId) {

      const query = `
        SELECT 
          u.userId,
          u.personalDetails,
          u.photoDetails,
          u.contactDetails,
          u.educationDetails,
          u.careerDetails,
          u.horoscopeDetails,
          u.familyDetails,
          u.lifestyleDetails,
          u.partnerPreferencesDetails,
          u.additionalInfoDetails,
          u.profileCompletion,
          (i.status = "sent") AS hasInterest

        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u

        LEFT JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i
        ON i.fromUserId = $currentUserId
        AND i.toUserId = u.userId
        AND i.type = "interest"

        WHERE u.userId = $profileId
        LIMIT 1
      `;

      const result = await cluster.query(query, {
        parameters: { profileId, currentUserId }
      });

      let profiles = result.rows;

      profiles = profiles.map((candidate) => {
        const score = calculateMatchScore(currentUser, candidate);
        return { ...candidate, matchScore: score };
      });

      return res.status(200).json({
        page: 1,
        pageSize: 1,
        totalResults: profiles.length,
        profiles
      });
    }

    /* ----------------------------------
       ADVANCED SEARCH QUERY
    ----------------------------------- */

    const params = {
      maritalStatus: Array.isArray(maritalStatus) ? maritalStatus : maritalStatus ? [maritalStatus] : null,
      occupationType: Array.isArray(occupationType) ? occupationType : occupationType ? [occupationType] : null,
      education: Array.isArray(education) ? education : education ? [education] : null,
      subCaste: Array.isArray(subCaste) ? subCaste : subCaste ? [subCaste] : null,
      nativeCity,
      workCity,
      manglik,
      diet,
      ageMin,
      ageMax,
      heightMin,
      heightMax,
      incomeMin,
      incomeMax,
      currentUserId,
      pageSize,
      offset
    };

    const query = `
      SELECT 
        u.userId,
        u.personalDetails,
        u.photoDetails,
        u.contactDetails,
        u.educationDetails,
        u.careerDetails,
        u.horoscopeDetails,
        u.familyDetails,
        u.lifestyleDetails,
        u.partnerPreferencesDetails,
        u.additionalInfoDetails,
        u.profileCompletion,
        (i.status = "sent") AS hasInterest

      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u

      JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` currentUser
      ON currentUser.userId = $currentUserId

      LEFT JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.interests i
      ON i.fromUserId = $currentUserId
      AND i.toUserId = u.userId
      AND i.type = "interest"

      WHERE u.status IN ["active","verified"]
        AND u.userId != $currentUserId
        AND u.personalDetails.gender != currentUser.personalDetails.gender

        AND ($maritalStatus IS NULL OR u.personalDetails.maritalStatus IN $maritalStatus)
        AND ($education IS NULL OR u.educationDetails.highestQualification IN $education)
        AND ($occupationType IS NULL OR u.careerDetails.occupation IN $occupationType)

        AND ($nativeCity IS NULL OR u.familyDetails.nativeCity = $nativeCity)
        AND ($workCity IS NULL OR u.careerDetails.workLocationCity = $workCity)

        AND ($subCaste IS NULL OR u.personalDetails.subCaste IN $subCaste)
        AND ($manglik IS NULL OR u.horoscopeDetails.mangal = $manglik)
        AND ($diet IS NULL OR u.personalDetails.diet = $diet)

        AND ($ageMin IS NULL OR u.personalDetails.age >= $ageMin)
        AND ($ageMax IS NULL OR u.personalDetails.age <= $ageMax)
        AND ($heightMin IS NULL OR TO_NUMBER(u.personalDetails.height) >= $heightMin)
        AND ($heightMax IS NULL OR TO_NUMBER(u.personalDetails.height) <= $heightMax)
        AND ($incomeMin IS NULL OR TO_NUMBER(u.careerDetails.annualIncome) >= $incomeMin)
        AND ($incomeMax IS NULL OR TO_NUMBER(u.careerDetails.annualIncome) <= $incomeMax)

      ORDER BY u.createdAt DESC
      LIMIT $pageSize OFFSET $offset;
    `;

    const result = await cluster.query(query, { parameters: params });

    let profiles = result.rows;

    profiles = profiles.map((candidate) => {
      const score = calculateMatchScore(currentUser, candidate);
      return { ...candidate, matchScore: score };
    });

    res.status(200).json({
      page,
      pageSize,
      totalResults: profiles.length,
      profiles
    });

  } catch (error) {

    console.error("Search Query Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


// ======================================================
// MATCHMAKING SCORE FUNCTION (Upgraded)
// ======================================================
function calculateMatchScore(user, candidate) {
  const weights = {
    age: 20,
    location: 15,
    religion_caste: 15,
    education_job: 15,
    lifestyle: 10,
    horoscope: 8,
    languages: 5,
    profile: 7,
    interests_hobbies: 5,
  };

  let score = 0;

  // ----- 1) Age match -----
  const agePref = user.partnerPreferencesDetails?.ageRange?.split('-').map(a => parseInt(a.trim()));
  const candidateAge = candidate.personalDetails?.age || 0;
  if (agePref && agePref.length === 2) {
    if (candidateAge >= agePref[0] && candidateAge <= agePref[1]) score += weights.age;
    else {
      const diff = Math.min(Math.abs(candidateAge - agePref[0]), Math.abs(candidateAge - agePref[1]));
      score += Math.max(0, (1 - diff / 5)) * weights.age;
    }
  } else {
    const diff = Math.abs(candidateAge - (user.personalDetails?.age || 0));
    score += Math.max(0, (1 - diff / 5)) * weights.age;
  }

  // ----- 2) Location -----
  if (user.partnerPreferencesDetails?.locationPreferences) {
    const locations = user.partnerPreferencesDetails.locationPreferences.split(',').map(l => l.trim().toLowerCase());
    if (candidate.contactDetails?.city && locations.includes(candidate.contactDetails.city.toLowerCase())) {
      score += weights.location;
    }
  }

  // ----- 3) Religion & Caste -----
  if (candidate.personalDetails?.religion === user.personalDetails?.religion) {
    if (candidate.personalDetails?.caste === user.personalDetails?.caste) score += weights.religion_caste;
    else if (user.familyDetails?.intercasteMarriage === "Yes") score += weights.religion_caste * 0.5;
  }

  // ----- 4) Education / Job -----
  const eduPref = (user.partnerPreferencesDetails?.educationPreferences || "").toLowerCase();
  const occPref = (user.partnerPreferencesDetails?.occupationPreferences || "").toLowerCase();
  const candidateEdu = (candidate.educationDetails?.highestQualification || "").toLowerCase();
  const candidateOcc = (candidate.careerDetails?.occupation || "").toLowerCase();

  if (eduPref === "any" || candidateEdu.includes(eduPref)) score += weights.education_job;
  if (occPref && candidateOcc.includes(occPref)) score += weights.education_job * 0.5;

  // ----- 5) Lifestyle -----
  if (user.partnerPreferencesDetails?.lifestylePreferences) {
    const lifestylePrefs = user.partnerPreferencesDetails.lifestylePreferences.split(',').map(l => l.trim().toLowerCase());
    const candidateDiet = (candidate.lifestyleDetails?.diet || "").toLowerCase();
    if (lifestylePrefs.includes(candidateDiet)) score += weights.lifestyle;
  }

  // ----- 6) Horoscope -----
  const horo = candidate.horoscopeDetails || {};
  const userHoro = user.horoscopeDetails || {};
  if (horo.rashi && userHoro.rashi && horo.rashi === userHoro.rashi) score += weights.horoscope * 0.5;
  if (horo.nakshatra && userHoro.nakshatra && horo.nakshatra === userHoro.nakshatra) score += weights.horoscope * 0.3;
  if (horo.mangal && userHoro.mangal && horo.mangal === userHoro.mangal) score += weights.horoscope * 0.2;

  // ----- 7) Languages -----
  if (user.partnerPreferencesDetails?.languagesPreferences) {
    const langPrefs = user.partnerPreferencesDetails.languagesPreferences.split(',').map(l => l.trim().toLowerCase());
    const candidateLangs = (candidate.personalDetails?.languagesSpoken || "").split(',').map(l => l.trim().toLowerCase());
    const commonLangs = candidateLangs.filter(l => langPrefs.includes(l));
    if (commonLangs.length > 0) score += (commonLangs.length / langPrefs.length) * weights.languages;
  }

  // ----- 8) Profile completeness -----
  const completeness = candidate.profileCompletion || 0;
  if (completeness >= 80) score += weights.profile;
  else if (completeness >= 50) score += weights.profile * 0.5;

  // ----- 9) Interests & Hobbies -----
  if (candidate.lifestyleDetails?.hobbies && user.lifestyleDetails?.hobbies) {
    const userHobbies = (user.lifestyleDetails.hobbies || "").split(',').map(h => h.trim().toLowerCase());
    const candidateHobbies = candidate.lifestyleDetails.hobbies.split(',').map(h => h.trim().toLowerCase());
    const commonHobbies = candidateHobbies.filter(h => userHobbies.includes(h));
    if (commonHobbies.length > 0) score += (commonHobbies.length / userHobbies.length) * weights.interests_hobbies;
  }

  return Math.round(Math.min(score, 100));
}


exports.fetchLocationByPincode = async (req, res) => {

  try {

    const pincode = req.params.pincode;

    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    const result = response.data;

    if (result[0].Status !== "Success") {
      return res.status(404).json({ message: "Pincode not found" });
    }

    const data = result[0].PostOffice[0];

    const locationQuery = `${data.Block},${data.District}, ${data.State}, ${data.Country}`;

    const geo = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "sushilmaratha-matrimony-app/1.0"
        }
      }
    );

    const lat = geo.data[0]?.lat;
    const lng = geo.data[0]?.lon;

    res.json({
	  taluka: data.Block,
      city: data.District,
      state: data.State,
      country: data.Country,
      latitude: lat,
      longitude: lng
    });

  } catch (error) {

    console.error("Error fetching location:", error.message);

    res.status(500).json({
      message: "Failed to fetch location"
    });

  }

};

exports.saveDraft = async (req, res) => {
  const { collection } = await connectToCouchbase();
  const userId = req.userId;
  const draftData = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID not found in token'
    });
  }

  try {

    // 🔥 Add system fields (important for drafts)
    draftData.isDraft = true;
    draftData.lastSavedAt = new Date().toISOString();

    // 🔥 Build mutations (same as your update API)
    const mutations = Object.keys(draftData).map(key =>
      couchbase.MutateInSpec.upsert(key, draftData[key])
    );

    // 🔥 Apply partial update
    await collection.mutateIn(userId, mutations, {
      upsertDocument: true // 👈 important if profile not created yet
    });

    return res.status(200).json({
      success: true,
      message: 'Draft saved successfully'
    });

  } catch (error) {
    console.error('Error saving draft:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to save draft',
      error: error.message
    });
  }
};