const couchbase = require('couchbase');
const { connectToCouchbase } = require("../config/db.config");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.DashboardSummary = async (req, res) => 
{
    // Connect to Couchbase
    try {
        const { cluster } = await connectToCouchbase();
        const query = `
        SELECT 
          COUNT(*) AS totalUsers,
          COUNT(CASE WHEN u.status = "active" THEN 1 END) AS activeUsers,
          COUNT(CASE WHEN u.plan = "premium" THEN 1 END) AS premiumMembers,
          COUNT(CASE WHEN u.plan = "gold" THEN 1 END) AS goldMembers,
          COUNT(CASE WHEN u.plan = "platinum" THEN 1 END) AS platinumMembers
        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      `;
    
        const result = await cluster.query(query);
        res.status(200).json(result.rows[0]);
    
      } catch (error) {
        console.error("Dashboard Summary Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
}    



exports.DashboardUserDetails = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();
	const currentUserId = req.userId; // Extracted from JWT
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
           users.createdAt,
		   users.start_date,
		   users.end_date,
			up.planId,
			up.planName,
			up.duration AS planDuration,
			up.startDate AS planStartDate,
			up.endDate AS planEndDate,
			up.status AS planStatus,
			up.price,
			up.contactPolicy,
			up.contactUsed
    FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` users 
    LEFT JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`user_plans\` up
	ON up.userId = users.userId
    WHERE  users.status != 'deleted' ORDER BY users.createdAt DESC`;
    console.log("Query = " + query);
      //const result = await cluster.query(query);
	  const result = await cluster.query(query, { parameters: { currentUserId } });
				
    res.status(200).json(result);

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

	exports.updateUserPlan = async (req, res) => {
	  const { collection, planCollection, userPlanCollection } = await connectToCouchbase();
	  const { plan, doc_id, duration, planId, prePlanId } = req.body;
	  const docId = doc_id;

	  if (!docId) {
		return res.status(400).json({ message: 'docId not found in request' });
	  }

	  if (!plan || !duration) {
		return res.status(400).json({ message: 'Plan or duration is missing' });
	  }

	  try {
		const startDate = new Date();
		const durationMonths = parseInt(duration, 10);

		// 30 days per month rule
		const daysToAdd = durationMonths * 30;

		const endDate = new Date(startDate);
		endDate.setDate(startDate.getDate() + daysToAdd);

		await collection.mutateIn(docId, [
		  couchbase.MutateInSpec.upsert('plan', plan),
		  couchbase.MutateInSpec.upsert('start_date', startDate.toISOString()),
		  couchbase.MutateInSpec.upsert('end_date', endDate.toISOString())
		]);

	// 2️⃣ Fetch plan
		let planDocs;
		try {
		  planDocs = await planCollection.get(planId);
		} catch {
		  return res.status(404).json({ success: false, message: "Plan not found" });
		}
		const plans = planDocs.value;

    // 6️⃣ Prepare new user plan
    const newPlan = {
      userId: docId,
      planId: plans.id,
      planName: plans.name,
      duration: plans.duration,
      startDate,
      endDate,
      contactPolicy: plans.contactPolicy,
      features: plans.features || [],
      price: plans.price,
      status: "active",
      paymentMode: "offline-qr",
      createdAt: startDate,
      updatedAt: startDate
    };

    const userPlanKey = `userplan::${docId}`;

    // 7️⃣ Upsert user plan
    await userPlanCollection.upsert(userPlanKey, newPlan);


		// Fetch current users count from plan document
		const planDoc = await planCollection.get(planId);
		const currentUsers = planDoc.content.users || 0;

		// Increment users count by 1
		await planCollection.mutateIn(planId, [
		  couchbase.MutateInSpec.upsert('users', currentUsers + 1)
		]);
		
		// Fetch current users count from plan document
		const prevplanDoc = await planCollection.get(prePlanId);
		const lastUsers = prevplanDoc.content.users || 0;

		// Decrease users count by 1
		//await planCollection.mutateIn(prePlanId, [
		  //couchbase.MutateInSpec.upsert('users', lastUsers - 1)
		//]);

		return res.status(200).json({
		  success: true,
		  message: 'Plan updated successfully!',
		  start_date: startDate.toISOString(),
		  end_date: endDate.toISOString()
		});
	  } catch (error) {
		console.error('Error updating plan:', error);
		return res.status(500).json({ success: false, error: error.message });
	  }
	};


	exports.updateUserStatus = async (req, res) => {
	  const { collection } = await connectToCouchbase();
	  const { status, doc_id } = req.body;

	  if (!doc_id) {
		return res.status(400).json({ message: 'docId not found in request' });
	  }

	  if (typeof status === 'undefined') {
		return res.status(400).json({ message: 'Status value is missing' });
	  }

	  try {
		await collection.mutateIn(doc_id, [
		  couchbase.MutateInSpec.upsert('status', status)
		]);

		return res.status(200).json({ success: true, message: 'Status updated successfully!' });
	  } catch (error) {
		console.error('Error updating status:', error);
		return res.status(500).json({ success: false, error: error.message });
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
        const { id } = req.params;
        const { collection } = await connectToCouchbase();
        // Fetch the document by its key
        const result = await collection.get(id);
      
        // Return the document content
        res.status(200).json(result.value);

      } catch (err) {
          return res.status(401).json({ message: "Invalid or expired token" });
      }
	};
	
	exports.DeleteUserByUserId = async (req, res) => {
	  const { collection, cluster, planCollection } = await connectToCouchbase();
	  const { userId } = req.params;
	  const { planId } = req.body; // may be null / undefined

	  if (!userId) {
		return res.status(400).json({
		  success: false,
		  message: 'Missing userId in request parameters.'
		});
	  }

	  try {
		/* ------------------------------------------------
		   FIND USER DOCUMENT
		------------------------------------------------ */
		const bucket = process.env.COUCHBASE_BUCKET;
		const scope = process.env.COUCHBASE_SCOPE;
		const coll = process.env.COUCHBASE_COLLECTION;
		const fqcn = `\`${bucket}\`.\`${scope}\`.\`${coll}\``;

		const query = `
		  SELECT META().id
		  FROM ${fqcn}
		  WHERE META().id = $userId
		  LIMIT 1
		`;

		const result = await cluster.query(query, {
		  parameters: { userId }
		});

		if (!result.rows?.length) {
		  return res.status(404).json({
			success: false,
			message: 'User not found.'
		  });
		}

		const docKey = result.rows[0].id;

		/* ------------------------------------------------
		   DELETE USER DOCUMENT
		------------------------------------------------ */
		await collection.remove(docKey);

		/* ------------------------------------------------
		   UPDATE PLAN ONLY IF planId EXISTS
		------------------------------------------------ */
		if (planId) {
		  try {
			const planDoc = await planCollection.get(planId);
			const currentUsers = planDoc.content?.users ?? 0;

			await planCollection.mutateIn(planId, [
			  couchbase.MutateInSpec.upsert(
				'users',
				Math.max(currentUsers - 1, 0) // prevent negative count
			  )
			]);
		  } catch (planErr) {
			console.warn(
			  `⚠️ Plan update skipped. Plan not found or invalid: ${planId}`,
			  planErr.message
			);
			// user deletion is already done → do NOT fail request
		  }
		}

		return res.status(200).json({
		  success: true,
		  message: 'User deleted successfully.'
		});

	  } catch (error) {
		console.error('❌ Error deleting user:', error);
		return res.status(500).json({
		  success: false,
		  error: error.message
		});
	  }
	};

	function genVerificationId(userId) {
	  return `verification::${userId}::${Date.now()}::${Math.floor(Math.random()*9000 + 1000)}`;
	}

	exports.updateUserProfile = async (req, res) => {
	  const { collection,userVerifications } = await connectToCouchbase();

	  const userId = req.params.id; // ✅ Extract from route parameter
	  const userProfileData = req.body;

	  if (!userId) {
		return res.status(400).json({ message: 'User ID not found in request' });
	  }

	  const mutations = Object.keys(userProfileData).map(key =>
		couchbase.MutateInSpec.upsert(key, userProfileData[key])
	  );

	  try {
		await collection.mutateIn(userId, mutations);
		return res.status(200).json({ success: true, message: 'Profile updated successfully!' });
	  } catch (error) {
		console.error('Error updating profile:', error);
		return res.status(500).json({ success: false, error: error.message });
	  }
	};
	
	
exports.updatePasswordByAdmin = async (req, res) => {
  try {
    /* ---------- ROLE CHECK ---------- */
   // if (req.user.role !== 'admin') {
     // return res.status(403).json({ message: 'Admin access only' });
   // }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    const { collection } = await connectToCouchbase();

    const userDoc = await collection.get(id);

    /* ---------- HASH PASSWORD ---------- */
    userDoc.value.password = await bcrypt.hash(newPassword, 10);
    userDoc.value.passwordUpdatedBy = 'admin';
    userDoc.value.passwordUpdatedAt = new Date().toISOString();
    userDoc.value.forceLogout = true;

    await collection.replace(id, userDoc.value);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error(error);

    if (error.code === 13) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(500).json({ message: 'Server error' });
  }
};
exports.searchProfiles = async (req, res) => {
  try {
    const { cluster } = await connectToCouchbase();

    // ------------------ SANITIZE INPUTS ------------------
    let {
      searchText = '',
      maritalGender = '',
      planId = '',
      page = 0,
      pageSize = 10,
      sortBy = 'createdAt',
      sortDir = 'DESC'
    } = req.body;

    // Ensure numeric values
    page = Number(page) >= 0 ? Number(page) : 0;
    pageSize = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const offset = page * pageSize;

    searchText = searchText?.trim() || '';
    planId = planId?.trim() || '';

    // ------------------ SORT WHITELIST ------------------
    const sortableFields = {
      createdAt: 'users.createdAt',
      age: 'users.personalDetails.age',
      income: 'users.careerDetails.annualIncome'
    };

    const orderByField = sortableFields[sortBy] || 'users.createdAt';
    const orderDirection = sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // ------------------ WHERE CONDITIONS ------------------
    const where = [`users.status != 'deleted'`];

    // Name search
    if (searchText) {
      where.push(
        `LOWER(users.personalDetails.firstName || ' ' || users.personalDetails.lastName) LIKE '%' || LOWER($searchText) || '%'`
      );
    }

    // Marital + Gender filter
    switch (maritalGender) {
      case 'UNMARRIED_BOYS':
        where.push(`users.personalDetails.gender = 'Male' AND users.personalDetails.maritalStatus = 'Unmarried'`);
        break;
      case 'UNMARRIED_GIRLS':
        where.push(`users.personalDetails.gender = 'Female' AND users.personalDetails.maritalStatus = 'Unmarried'`);
        break;
      case 'DIVORCED_MEN':
        where.push(`users.personalDetails.gender = 'Male' AND users.personalDetails.maritalStatus = 'Divorcee'`);
        break;
      case 'DIVORCED_WOMEN':
        where.push(`users.personalDetails.gender = 'Female' AND users.personalDetails.maritalStatus = 'Divorcee'`);
        break;
      case 'WIDOWER_MEN':
        where.push(`users.personalDetails.gender = 'Male' AND users.personalDetails.maritalStatus = 'Widowed'`);
        break;
      case 'WIDOWER_WOMEN':
        where.push(`users.personalDetails.gender = 'Female' AND users.personalDetails.maritalStatus = 'Widowed'`);
        break;
    }

    // Plan filter
    if (planId) {
      where.push(`LOWER(users.plan) = LOWER($planId)`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // ------------------ DATA QUERY ------------------
    const dataQuery = `
      SELECT META(users).id AS doc_id,
             users.userId,
             users.email,
             users.mobilenumber,
             users.careerDetails,
             users.personalDetails,
             users.educationDetails,
             users.familyDetails,
             users.plan,
             users.status,
             users.createdAt,
             users.start_date,
             users.end_date
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` users
      ${whereClause}
      ORDER BY ${orderByField} ${orderDirection}
    `;
//      LIMIT $pageSize OFFSET $offset

    // ------------------ COUNT QUERY ------------------
    const countQuery = `
      SELECT COUNT(1) AS total
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` users
      ${whereClause}
    `;

    const params = { searchText, planId, pageSize, offset };

    const [dataResult, countResult] = await Promise.all([
      cluster.query(dataQuery, { parameters: params }),
      cluster.query(countQuery, { parameters: params })
    ]);
	
	page = page + 1;

    res.status(200).json({
      data: dataResult.rows,
      total: countResult.rows[0]?.total || 0,
      page,
      pageSize
    });

  } catch (error) {
    console.error('searchProfiles Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.extendFemalePlans = async (req, res) => {

  const {
    cluster,
    collection,           // users collection
    userPlanCollection
  } = await connectToCouchbase();

  try {

    const query = `
      SELECT META(u).id AS userId, u.end_date
      FROM \`${process.env.COUCHBASE_BUCKET}\`.users.users u
      WHERE u.personalDetails.gender = "Female"
      AND u.end_date IS NOT MISSING
      AND STR_TO_MILLIS(u.end_date) < STR_TO_MILLIS(NOW_STR())
    `;

    const result = await cluster.query(query);

    if (!result.rows.length) {
      return res.json({
        success: true,
        message: "No expired female users found"
      });
    }

    const now = new Date();
    let updatedCount = 0;

    for (const user of result.rows) {

      const oldEndDate = new Date(user.end_date);
      const newEndDate = new Date(oldEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      /** 1️⃣ Update USERS collection **/
      await collection.mutateIn(user.userId, [
        couchbase.MutateInSpec.upsert("end_date", newEndDate.toISOString()),
        couchbase.MutateInSpec.upsert("updatedAt", now.toISOString())
      ]);

      /** 2️⃣ Find active user plan **/
      const planQuery = `
        SELECT META(p).id AS docId
        FROM \`${process.env.COUCHBASE_BUCKET}\`.users.user_plans p
        WHERE p.userId = $userId
        AND p.status = "active"
        LIMIT 1
      `;

      const planResult = await cluster.query(planQuery, {
        parameters: { userId: user.userId }
      });

      if (planResult.rows.length > 0) {

        const planDocId = planResult.rows[0].docId;

        /** 3️⃣ Update USER_PLANS collection **/
        await userPlanCollection.mutateIn(planDocId, [
          couchbase.MutateInSpec.upsert("end_date", newEndDate.toISOString()),
          couchbase.MutateInSpec.upsert("updatedAt", now.toISOString())
        ]);
      }

      updatedCount++;
    }

    return res.json({
      success: true,
      message: `${updatedCount} female plans extended`
    });

  } catch (err) {

    console.error("Plan extension error:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });

  }
};