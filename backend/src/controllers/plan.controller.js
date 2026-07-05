const couchbase = require('couchbase');
const { connectToCouchbase } = require("../config/db.config");
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cron = require("node-cron");
const razorpay = require("../services/paymentService");

// Create a new plan
/*
exports.createPlan = async (req, res) => {
  const id = uuidv4();
  const plan = { id, ...req.body };
  const { planCollection } = await connectToCouchbase();

  try {
    await planCollection.upsert(id, plan);
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
*/
/*
exports.createPlan = async (req, res) => {
  const { name, duration, price, features, planstatus, users } = req.body;
  const { planCollection, cluster } = await connectToCouchbase();

  try {
		const query = `
		  SELECT META(p).id 
		  FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.PLAN_COLLECTION}\` AS p 
		  WHERE p.name = $name
		`;

		const result = await cluster.query(query, {
		  parameters: { name }
		});

		console.log('Query:', query);
		console.log('Parameters:', { name });



    if (result.rows.length > 0) {
      return res.status(409).json({ error: 'Plan with this name already exists' });
    }

    // Create new plan
    const id = uuidv4();
    const plan = { id, name, duration, price, features: features || [], planstatus, users };

    await planCollection.upsert(id, plan);
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
*/

/*
exports.createPlan = async (req, res) => {
  const {
    name,
    title,
    duration,
    price,
    contactLimit,
    priority,
    features,
    planstatus,
    users,
    createdBy
  } = req.body;

  const { planCollection, cluster } = await connectToCouchbase();

  try {
    // 🔍 Check if plan name already exists
    const query = `
      SELECT META(p).id 
      FROM \`${process.env.COUCHBASE_BUCKET}\`
           .\`${process.env.COUCHBASE_SCOPE}\`
           .\`${process.env.PLAN_COLLECTION}\` AS p 
      WHERE LOWER(p.name) = LOWER($name)
    `;

    const result = await cluster.query(query, {
      parameters: { name }
    });

    if (result.rows.length > 0) {
      return res.status(409).json({ error: "Plan with this name already exists" });
    }

    // 🆔 Generate ID (clean string without spaces)
    const cleanId =
      name.toLowerCase().replace(/\s+/g, "") ||
      uuidv4().split("-")[0];

    const docKey = `plan::${cleanId}`;

    const now = new Date().toISOString();

    // 🧱 Final plan object
    const plan = {
      id: docKey,
      type: "plan",
      name: name.trim(),
      title: title?.trim() || name.trim(),
      duration: Number(duration),
      price: Number(price),
      contactLimit: Number(contactLimit || 0),
      priority: Number(priority || 1),
      users: Number(users || 0),
      features: features || [],
      planstatus: planstatus || "Active",
      createdAt: now,
      updatedAt: now,
      createdBy: createdBy || "admin"
    };

    // 🛢 Save to Couchbase
    await planCollection.upsert(docKey, plan);

    return res.status(201).json({
      message: "Plan created successfully",
      plan
    });

  } catch (err) {
    console.error("Error creating plan:", err);
    res.status(500).json({ error: err.message });
  }
};
*/

exports.createPlan = async (req, res) => {
  const {
    name,
    title,
    duration,
    price,
    priority,
    users,
    planstatus,
    contactPolicy,
    features,
    createdBy
  } = req.body;

  const { planCollection, cluster } = await connectToCouchbase();

  try {
    // 🔍 Check if plan name already exists
    const query = `
      SELECT META(p).id 
      FROM \`${process.env.COUCHBASE_BUCKET}\`
           .\`${process.env.COUCHBASE_SCOPE}\`
           .\`${process.env.PLAN_COLLECTION}\` AS p 
      WHERE LOWER(p.name) = LOWER($name)
    `;

    const result = await cluster.query(query, { parameters: { name } });

    if (result.rows.length > 0) {
      return res.status(409).json({ error: "Plan with this name already exists" });
    }

    // 🆔 Generate ID (clean string without spaces)
    const cleanId = name.toLowerCase().replace(/\s+/g, '') || uuidv4().split('-')[0];
    const docKey = `plan::${cleanId}`;
    const now = new Date().toISOString();

    // 🧱 Final plan object
    const plan = {
      id: docKey,
      type: 'plan',
      name: name.trim(),
      title: title?.trim() || name.trim(),
      duration: Number(duration),
      price: Number(price),
      priority: Number(priority || 1),
      users: Number(users || 0),
      planstatus: planstatus || 'Active',
      features: features || [],
      contactPolicy: {
        type: contactPolicy?.type || 'TOTAL',
        totalLimit: Number(contactPolicy?.totalLimit || 0),
        weeklyLimit: Number(contactPolicy?.weeklyLimit || 0),
        monthlyLimit: Number(contactPolicy?.monthlyLimit || 0),
        dailyLimit: Number(contactPolicy?.dailyLimit || 0),
        carryForward: contactPolicy?.carryForward || false
      },
      createdAt: now,
      updatedAt: now,
      createdBy: createdBy || 'admin'
    };

    // 🛢 Save to Couchbase
    await planCollection.upsert(docKey, plan);

    return res.status(201).json({
      message: 'Plan created successfully',
      plan
    });

  } catch (err) {
    console.error('Error creating plan:', err);
    res.status(500).json({ error: err.message });
  }
};


// Get all plans
exports.getPlans = async (req, res) => {
  const { cluster } = await connectToCouchbase();

  try {
    const query = `
      SELECT p.* 
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.PLAN_COLLECTION}\` AS p
    `;

    const result = await cluster.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ error: err.message });
  }
};


// Get plan by ID
exports.getPlanById = async (req, res) => {
  const { id } = req.params;
  const { planCollection } = await connectToCouchbase();

  try {
    const result = await planCollection.get(id);
    res.status(200).json(result.content);
  } catch (err) {
    res.status(404).json({ error: 'Plan not found' });
  }
};


// Update plan
/*exports.updatePlan = async (req, res) => {
  try {
    await collection.replace(req.params.id, req.body);
    res.json({ message: 'Plan updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
*/
/*
exports.updatePlan = async (req, res) => {
  const { id } = req.params;
  const { name, duration, price, features, planstatus, users } = req.body;
  const { planCollection, cluster } = await connectToCouchbase();

  try {
    // Step 1: Find the document ID 
    const query = `
      SELECT META(p).id 
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.PLAN_COLLECTION}\` AS p 
      WHERE META(p).id  = $id
    `;
    const result = await cluster.query(query, {
      parameters: { id }
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const docId = result.rows[0].id;
	console.log('DocId = ' + docId)
    // Step 2: Get the existing document
    const existingDoc = await planCollection.get(docId);
    const existingPlan = existingDoc.value;

    // Step 3: Merge updates without changing the original id
    const updatedPlan = {
      ...existingPlan,
      name,
      duration,
      price,
      features: features ?? existingPlan.features,
	  planstatus, 
	  users,
    };

    await planCollection.replace(docId, updatedPlan);
    res.status(200).json({ message: 'Plan updated successfully', plan: updatedPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
*/

exports.updatePlan = async (req, res) => {
  const { id } = req.params;

  // Extract all updated fields
  const {
    name,
    title,
    duration,
    price,
    priority,
    users,
    planstatus,
    features,
    contactPolicy,
    updatedBy
  } = req.body;

  const { planCollection, cluster } = await connectToCouchbase();

  try {
    // Step 1: Verify document exists
    const query = `
      SELECT META(p).id 
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.PLAN_COLLECTION}\` AS p 
      WHERE META(p).id = $id
    `;

    const result = await cluster.query(query, { parameters: { id } });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const docId = result.rows[0].id;

    // Step 2: Get existing plan
    const existingDoc = await planCollection.get(docId);
    const existingPlan = existingDoc.value;

    // --- RULE: Cannot deactivate plan when users > 0 ---
    if (existingPlan.users > 0 && planstatus === "Inactive") {
      return res.status(400).json({
        error: "Plan cannot be set to Inactive because users are already using it."
      });
    }

    // Step 3: Merge updates — preserve immutable fields
    const updatedPlan = {
      ...existingPlan, // keep all old values
      name: name ?? existingPlan.name,
      title: title ?? existingPlan.title,
      duration: Number(duration ?? existingPlan.duration),
      price: Number(price ?? existingPlan.price),
      priority: Number(priority ?? existingPlan.priority),
      users: Number(users ?? existingPlan.users),
      planstatus: planstatus ?? existingPlan.planstatus,
      features: features ?? existingPlan.features,
      contactPolicy: {
        type: contactPolicy?.type ?? existingPlan.contactPolicy?.type ?? 'TOTAL',
        totalLimit: Number(contactPolicy?.totalLimit ?? existingPlan.contactPolicy?.totalLimit ?? 0),
        weeklyLimit: Number(contactPolicy?.weeklyLimit ?? existingPlan.contactPolicy?.weeklyLimit ?? 0),
        monthlyLimit: Number(contactPolicy?.monthlyLimit ?? existingPlan.contactPolicy?.monthlyLimit ?? 0),
        dailyLimit: Number(contactPolicy?.dailyLimit ?? existingPlan.contactPolicy?.dailyLimit ?? 0),
        carryForward: contactPolicy?.carryForward ?? existingPlan.contactPolicy?.carryForward ?? false
      },
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'admin'
    };

    // Step 4: Save updated document
    await planCollection.replace(docId, updatedPlan);

    res.status(200).json({
      message: "Plan updated successfully",
      plan: updatedPlan
    });

  } catch (err) {
    console.error("Update Plan Error:", err);
    res.status(500).json({ error: err.message });
  }
};


// Delete plan
exports.deletePlan = async (req, res) => {
  const { id } = req.params;
  const { planCollection, cluster } = await connectToCouchbase();

  try {
    // Step 1: Find the document ID by name
    const query = `
      SELECT META(p).id 
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.PLAN_COLLECTION}\` AS p 
      WHERE META(p).id = $id
    `;
    const result = await cluster.query(query, {
      parameters: { id }
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const docId = result.rows[0].id;
    console.log('Deleting DocId = ' + docId);

    // Step 2: Remove the document
    await planCollection.remove(docId);
    res.status(200).json({ message: 'Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.purchasePlan = async (req, res) => {
  const { planId, paymentId, paymentAmount, paymentMode } = req.body;
  userId = req.userId;
  if (!userId || !planId) {
    return res.status(400).json({ error: "userId and planId are required" });
  }

  const {
    collection,
    planCollection,
    userPlanCollection,
    planLogCollection,
    cluster
  } = await connectToCouchbase();

  try {
    /** --------------------------------------------------------------
     * 1️⃣ Fetch User
     * -------------------------------------------------------------- */
    let userDoc;
    try {
      userDoc = await collection.get(userId);
    } catch (err) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userDoc.value;

    /** --------------------------------------------------------------
     * 2️⃣ Fetch Plan
     * -------------------------------------------------------------- */
    let planDoc;
    try {
      planDoc = await planCollection.get(planId);
    } catch (err) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const plan = planDoc.value;

    /** --------------------------------------------------------------
     * 3️⃣ Check if user already has an ACTIVE plan
     * -------------------------------------------------------------- */
    let activePlan = null;

    try {
      const resQuery = await cluster.query(
        `
        SELECT p.* 
        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.USER_PLAN_COLLECTION}\` AS p
        WHERE p.userId = $userId AND p.status = "active"
        LIMIT 1;
        `,
        { parameters: { userId } }
      );

      if (resQuery.rows.length > 0) {
        activePlan = resQuery.rows[0];
      }
    } catch (err) {
      console.error("Failed checking active plan", err);
    }

    // ❌ User already has active plan
    if (activePlan && new Date(activePlan.endDate) > new Date()) {
      return res.status(409).json({
        error: "User already has an active plan",
        activePlan
      });
    }

    /** --------------------------------------------------------------
     * 4️⃣ Calculate Start / End dates
     * -------------------------------------------------------------- */
	const startDate = new Date();
	const durationMonths = parseInt(plan.duration, 10);

	// 30 days per month rule
	const daysToAdd = durationMonths * 30;

	const endDate = new Date(startDate);
	endDate.setDate(startDate.getDate() + daysToAdd);

    const docKey = `userplan::${userId}`;

    /** --------------------------------------------------------------
     * 5️⃣ Create USER PLAN Document
     * -------------------------------------------------------------- */
    const userPlanDoc = {
      userId: userId,
      planId: planId,
      planName: plan.name,
      duration: plan.duration,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      contactLimit: plan.contactLimit || 0,
      contactUsed: 0,
      features: plan.features || [],
      price: plan.price,
      status: "active",
      createdAt: startDate.toISOString(),
      updatedAt: startDate.toISOString(),
      paymentId: paymentId || null,
      paymentAmount: paymentAmount || plan.price,
      paymentMode: paymentMode || "online"
    };

    await userPlanCollection.upsert(docKey, userPlanDoc);

    /** --------------------------------------------------------------
     * 6️⃣ Add Plan Log
     * -------------------------------------------------------------- */
    const logKey = `planlog::${crypto.randomUUID()}`;
    const logDoc = {
      type: "plan_purchase",
      userId,
      userMobile: user.mobilenumber,
      userEmail: user.email,
      planId,
      planName: plan.name,
      paymentId: paymentId || null,
      amount: paymentAmount || plan.price,
      mode: paymentMode || "online",
      startDate: userPlanDoc.startDate,
      endDate: userPlanDoc.endDate,
      createdAt: new Date().toISOString()
    };

    await planLogCollection.insert(logKey, logDoc);

    /** --------------------------------------------------------------
     * 7️⃣ RESPONSE
     * -------------------------------------------------------------- */
    return res.status(201).json({
      success: true,
      message: "Plan purchased successfully",
      plan: userPlanDoc
    });

  } catch (err) {
    console.error("Error purchasing plan:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.upgradePlan = async (req, res) => {
  const { userId, newPlanId, paymentId, paymentAmount, paymentMode } = req.body;

  if (!userId || !newPlanId) {
    return res.status(400).json({ error: "userId and newPlanId are required" });
  }

  const {
    cluster,
    collection,
    planCollection,
    userPlanCollection,
    planLogCollection
  } = await connectToCouchbase();

  try {
    /** 1️⃣ Fetch User **/
    let userDoc = await collection.get(userId);
    const user = userDoc.value;

    /** 2️⃣ Fetch New Plan **/
    let newPlanDoc = await planCollection.get(newPlanId);
    const newPlan = newPlanDoc.value;

    /** 3️⃣ Fetch Active Plan **/
    const query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.userId = $userId AND p.status = "active"
      LIMIT 1;
    `;

    const activePlanQ = await cluster.query(query, { parameters: { userId } });

    if (activePlanQ.rows.length === 0) {
      return res.status(400).json({
        error: "User has no active plan to upgrade"
      });
    }

    const activePlan = activePlanQ.rows[0];

    /** 4️⃣ Check Priority (must be strictly higher) **/
    if (newPlan.priority <= activePlan.priority) {
      return res.status(400).json({
        error: "Cannot downgrade or upgrade to same-level plan"
      });
    }

    /** 5️⃣ Expire old plan **/
    await userPlanCollection.mutateIn(activePlan.docId, [
      couchbase.MutateInSpec.upsert("status", "expired"),
      couchbase.MutateInSpec.upsert("updatedAt", new Date().toISOString())
    ]);

    /** 6️⃣ Start new upgraded plan **/
   
const startDate = new Date();
const durationMonths = parseInt(newPlan.duration, 10);

// 30 days per month rule
const daysToAdd = durationMonths * 30;

const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + daysToAdd);


    const newDocKey = `userplan::${userId}::${crypto.randomUUID()}`;

    const newUserPlanDoc = {
      userId,
      planId: newPlanId,
      planName: newPlan.name,
      duration: newPlan.duration,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      price: newPlan.price,
      features: newPlan.features,
      contactLimit: newPlan.contactLimit,
      contactUsed: 0,
      status: "active",
      paymentId: paymentId || null,
      paymentAmount: paymentAmount || newPlan.price,
      paymentMode: paymentMode || "online",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    await userPlanCollection.upsert(newDocKey, newUserPlanDoc);

    /** 7️⃣ Log upgrade **/
    await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
      type: "upgrade",
      userId,
      userMobile: user.mobilenumber,
      userEmail: user.email,
      oldPlanId: activePlan.planId,
      newPlanId,
      amount: paymentAmount || newPlan.price,
      createdAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: "Plan upgraded successfully",
      plan: newUserPlanDoc
    });

  } catch (err) {
    console.error("Upgrade error:", err);
    return res.status(500).json({ error: err.message });
  }
};


exports.getPlanStatus = async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { cluster } = await connectToCouchbase();
    const now = new Date();

    let planDoc = null;
    let isActive = false;
    let isExpired = false;

    // ======================================================
    // 1️⃣ Fetch ACTIVE plan
    // ======================================================
    const activeQuery = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.userId = $userId AND p.status = "active"
      LIMIT 1
    `;

    const activeRes = await cluster.query(activeQuery, { parameters: { userId } });

    if (activeRes.rows.length) {
      planDoc = activeRes.rows[0];
      isActive = true;
    } else {
      // ======================================================
      // 2️⃣ No active plan → get latest plan
      // ======================================================
      const latestQuery = `
        SELECT META(p).id AS docId, p.*
        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
        WHERE p.userId = $userId
        ORDER BY p.endDate DESC
        LIMIT 1
      `;

      const latestRes = await cluster.query(latestQuery, { parameters: { userId } });
      if (latestRes.rows.length) {
        planDoc = latestRes.rows[0];
      }
    }

    // ======================================================
    // 3️⃣ If no plan → check pending / rejected payment
    // ======================================================
    if (!planDoc) {
      const paymentQuery = `
        SELECT META(pay).id AS docId, pay.*
        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`payments\` AS pay
        WHERE pay.userId = $userId
          AND pay.status IN ["pending", "rejected"]
        ORDER BY pay.createdAt DESC
        LIMIT 1
      `;

      const paymentRes = await cluster.query(paymentQuery, { parameters: { userId } });

      if (paymentRes.rows.length) {
        const payment = paymentRes.rows[0];

        return res.json({
          userId,
          hasPlan: false,
          isActive: false,
          paymentPending: payment.status === "pending",
          paymentRejected: payment.status === "rejected",
          payment: {
            paymentId: payment.docId,
            planId: payment.planId,
            amount: payment.amount,
            paymentMode: payment.paymentMode,
            createdAt: payment.createdAt,
            rejectReason: payment.rejectReason || ""
          },
          message:
            payment.status === "pending"
              ? "Thank you for your payment! Our team is reviewing it. Plan will activate within 6–12 hours."
              : "Your payment was rejected. Please try again or contact support."
        });
      }

      return res.json({
        userId,
        hasPlan: false,
        isActive: false,
		isNoPlan:true,
        message: "No plan found"
      });
    }

    // ======================================================
    // 4️⃣ EXPIRY CHECK (CRITICAL FIX)
    // ======================================================
    const endDate = planDoc.endDate ? new Date(planDoc.endDate) : null;

    if (endDate && !isNaN(endDate) && endDate < now) {
      isExpired = true;
      isActive = false;

      // 🔥 Auto update DB → status = inactive
      await cluster.query(
        `
        UPDATE \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\`
        SET status = "inactive"
        WHERE META().id = $docId
        `,
        { parameters: { docId: planDoc.docId } }
      );

      planDoc.status = "inactive";
    }

    // ======================================================
    // 5️⃣ Calculations
    // ======================================================
    let daysLeft = 0;
    if (endDate && !isNaN(endDate)) {
      const msLeft = endDate.getTime() - now.getTime();
      daysLeft = msLeft > 0 ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : 0;
    }

    const contactLimit = Number(planDoc.contactLimit || 0);
    const contactUsed = Number(planDoc.contactUsed || 0);
    const contactRemaining = Math.max(0, contactLimit - contactUsed);

    // Features
    const features = {};
    if (Array.isArray(planDoc.features)) {
      planDoc.features.forEach(f => (features[f] = true));
    }
    if (typeof planDoc.chatAccess === "boolean") features.chatAccess = planDoc.chatAccess;
    if (typeof planDoc.videoCallAccess === "boolean") features.videoCallAccess = planDoc.videoCallAccess;

    // ======================================================
    // 6️⃣ Final Response
    // ======================================================
    return res.json({
      userId,
      hasPlan: true,
	  isNoPlan:false,
      isActive,
      isExpired,
      plan: {
        docId: planDoc.docId,
        planId: planDoc.planId || null,
        planName: planDoc.planName || planDoc.name || null,
        price: planDoc.price || null,
        duration: planDoc.duration || null,
        startDate: planDoc.startDate || null,
        endDate: planDoc.endDate || null,
        status: planDoc.status || (isActive ? "active" : "inactive")
      },
      daysLeft,
      contactLimit,
      contactUsed,
      contactRemaining,
      features,
      message: isExpired
        ? "Your plan has expired. Please renew to continue premium features."
        : "Your plan is active"
    });

  } catch (err) {
    console.error("getPlanStatus error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/*
exports.getPlanStatus = async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { cluster } = await connectToCouchbase();

    // 1) Try to fetch ACTIVE user plan
    const queryActive = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.userId = $userId AND p.status = "active"
      LIMIT 1;
    `;

    const activeRes = await cluster.query(queryActive, { parameters: { userId } });

    let planDoc = null;
    let isActive = false;

    if (activeRes.rows.length > 0) {
      planDoc = activeRes.rows[0];
      isActive = true;
    } else {
      // 2) No active plan — fetch latest plan (history) if exists
      const queryLatest = `
        SELECT META(p).id AS docId, p.*
        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
        WHERE p.userId = $userId
        ORDER BY p.endDate DESC
        LIMIT 1;
      `;
      const latestRes = await cluster.query(queryLatest, { parameters: { userId } });
      if (latestRes.rows.length > 0) {
        planDoc = latestRes.rows[0];
        isActive = false;
      }
    }
	
	// 3) If no ACTIVE plan → check pending payment
    //====================================================== 
    if (!isActive) {
      const paymentQuery = `
        SELECT META(pay).id AS docId, pay.*
        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`payments\` AS pay
        WHERE pay.userId = $userId
		AND pay.status IN ["pending", "rejected"]
        ORDER BY pay.createdAt DESC
        LIMIT 1;
      `;

      const paymentRes = await cluster.query(paymentQuery, {
        parameters: { userId }
      });

      if (paymentRes.rows.length > 0) {
        const payment = paymentRes.rows[0];
		let message = '';
		if (payment.status === 'pending') {
		  message = "Thank you for your payment! Our team is reviewing it, and your plan will be activated within 6–12 hours.";
		} else if (payment.status === 'rejected') {
		  message = "Unfortunately, your payment was not successful. Please try again or contact support.";
		}
        return res.json({
          userId,
          hasPlan: false,
          isActive: false,
		  paymentPending: payment.status === 'pending',
		  paymentRejected: payment.status === 'rejected',
          payment: {
            paymentId: payment.docId,
            planId: payment.planId,
            amount: payment.amount,
            paymentMode: payment.paymentMode,
            createdAt: payment.createdAt,
			rejectReason: payment.rejectReason || "",
          },
          message        
		});
      }
    }
	

    // 3) Build response
    if (!planDoc) {
      // no plan at all
      return res.json({
        userId,
        hasPlan: false,
        plan: null,
        daysLeft: 0,
        contactRemaining: 0,
        isActive: false,
        features: {},
        message: "No plan found"
      });
    }

    // normalize fields (plan stored under planDoc.*)
    const plan = { ...planDoc };
    // remove docId from nested plan fields if present
    const docId = plan.docId;
    delete plan.docId;

    // calculate daysLeft and contactRemaining
    const now = new Date();
    const endDate = plan.endDate ? new Date(plan.endDate) : null;
    let daysLeft = 0;
    if (endDate && !isNaN(endDate)) {
      const msLeft = endDate.getTime() - now.getTime();
      daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    }

    const contactLimit = Number(plan.contactLimit || plan.contactLimit === 0 ? plan.contactLimit : 0);
    const contactUsed = Number(plan.contactUsed || 0);
    const contactRemaining = Math.max(0, contactLimit - contactUsed);

    // features map - useful for frontend gating
    const features = {};
    if (Array.isArray(plan.features)) {
      for (const f of plan.features) features[f] = true;
    }
    // some plans store booleans directly
    if (typeof plan.chatAccess === 'boolean') features.chatAccess = plan.chatAccess;
    if (typeof plan.videoCallAccess === 'boolean') features.videoCallAccess = plan.videoCallAccess;

    return res.json({
      userId,
      hasPlan: true,
      isActive,
      plan: {
        docId,
        planId: plan.planId || plan.planId || plan.id || null,
        planName: plan.planName || plan.name || plan.title || null,
        price: plan.price || null,
        duration: plan.duration || null,
        startDate: plan.startDate || plan.purchaseDate || null,
        endDate: plan.endDate || plan.expiryDate || null,
        status: plan.status || (isActive ? 'active' : 'expired')
      },
      daysLeft,
      contactLimit,
      contactUsed,
      contactRemaining,
      features,
      raw: plan // full plan doc for admin/debug (optional)
    });

  } catch (err) {
    console.error("getPlanStatus error:", err);
    return res.status(500).json({ error: err.message });
  }
};

*/


exports.renewPlan = async (req, res) => {
  const { userId, paymentId, paymentAmount, paymentMode } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const {
    cluster,
    collection,
    planCollection,
    userPlanCollection,
    planLogCollection
  } = await connectToCouchbase();

  try {
    /** 1️⃣ Fetch user */
    const userDoc = await collection.get(userId);
    const user = userDoc.value;

    /** 2️⃣ Find EXPIRED plan */
    const expiredQuery = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.userId = $userId AND p.status = "expired"
      ORDER BY p.endDate DESC
      LIMIT 1;
    `;

    const expiredRes = await cluster.query(expiredQuery, { parameters: { userId } });

    if (expiredRes.rows.length === 0) {
      return res.status(400).json({ error: "No expired plan found to renew" });
    }

    const oldPlan = expiredRes.rows[0];

    /** 3️⃣ Fetch plan details from plan collection */
    const planDoc = await planCollection.get(oldPlan.planId);
    const plan = planDoc.value;

	const startDate = new Date();
	const durationMonths = parseInt(plan.duration, 10);

	// 30 days per month rule
	const daysToAdd = durationMonths * 30;

	const endDate = new Date(startDate);
	endDate.setDate(startDate.getDate() + daysToAdd);


    /** 5️⃣ Create new plan document */
    const newDocKey = `userplan::${userId}::renew::${crypto.randomUUID()}`;

    const renewedDoc = {
      userId,
      planId: oldPlan.planId,
      planName: plan.name,
      duration: plan.duration,
      price: plan.price,
      features: plan.features,
      contactLimit: plan.contactLimit,
      contactUsed: 0, // fresh
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "active",
      paymentId: paymentId || null,
      paymentAmount: paymentAmount || plan.price,
      paymentMode: paymentMode || "online",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      renewedFrom: oldPlan.docId
    };

    //await userPlanCollection.upsert(newDocKey, renewedDoc);
	await userPlanCollection.mutateIn(oldPlan.docId, [
	  couchbase.MutateInSpec.upsert("startDate", startDate.toISOString()),
	  couchbase.MutateInSpec.upsert("endDate", endDate.toISOString()),
	  couchbase.MutateInSpec.upsert("status", "active"),
	  couchbase.MutateInSpec.upsert("contactUsed", 0),
	  couchbase.MutateInSpec.upsert("updatedAt", new Date().toISOString()),
	  couchbase.MutateInSpec.upsert("paymentId", paymentId || null),
	  couchbase.MutateInSpec.upsert("paymentAmount", paymentAmount || plan.price),
	  couchbase.MutateInSpec.upsert("paymentMode", paymentMode || "online")
	]);

    /** 6️⃣ Log renewal */
    await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
      type: "renew",
      userId,
      userMobile: user.mobilenumber,
      userEmail: user.email,
      oldPlanId: oldPlan.planId,
      newPlanId: oldPlan.planId,
      amount: paymentAmount || plan.price,
      createdAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: "Plan renewed successfully",
      plan: renewedDoc
    });

  } catch (err) {
    console.error("Renew error:", err);
    return res.status(500).json({ error: err.message });
  }
};


exports.deductContacts = async (req, res) => {
   const userId = req.userId; // Extracted from JWT
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const { cluster, userPlanCollection, planLogCollection } = await connectToCouchbase();

  try {
    /** 1️⃣ Fetch ACTIVE user plan */
    const query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.userId = $userId AND p.status = "active"
      LIMIT 1;
    `;

    const result = await cluster.query(query, { parameters: { userId } });

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "No active plan found. Please purchase or renew your plan." });
    }

    const activePlan = result.rows[0];

    /** 2️⃣ Check if plan expired */
    if (new Date(activePlan.endDate) < new Date()) {
      // Expire the plan
      await userPlanCollection.mutateIn(activePlan.docId, [
        couchbase.MutateInSpec.upsert("status", "expired"),
        couchbase.MutateInSpec.upsert("updatedAt", new Date().toISOString())
      ]);
      return res.status(403).json({ error: "Your plan has expired. Please renew to view contacts." });
    }

    /** 3️⃣ Check contact limit */
    if (activePlan.contactUsed >= activePlan.contactLimit) {
      return res.status(403).json({ error: "Contact limit reached. Please upgrade or renew your plan." });
    }

    /** 4️⃣ Increment contactUsed */
    const newContactUsed = activePlan.contactUsed + 1;

    await userPlanCollection.mutateIn(activePlan.docId, [
      couchbase.MutateInSpec.upsert("contactUsed", newContactUsed),
      couchbase.MutateInSpec.upsert("updatedAt", new Date().toISOString())
    ]);

    /** 5️⃣ Log the contact usage */
    await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
      type: "contact_view",
      userId,
      amountUsed: 1,
      totalUsed: newContactUsed,
      remainingContacts: activePlan.contactLimit - newContactUsed,
      createdAt: new Date().toISOString()
    });

    /** 6️⃣ Response */
    return res.json({
      success: true,
      message: "Contact viewed successfully",
      contactUsed: newContactUsed,
      contactLimit: activePlan.contactLimit,
      remainingContacts: activePlan.contactLimit - newContactUsed
    });

  } catch (err) {
    console.error("Deduct contact error:", err);
    return res.status(500).json({ error: err.message });
  }
};



const WARNING_THRESHOLDS = [80, 90, 100];

exports.deductContact = async (req, res) => {
  const userId = req.userId;
  const viewedUserId = req.body.viewedUserId;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const {
    cluster,
    userPlanCollection,
    planLogCollection,
    contactViewCollection
  } = await connectToCouchbase();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekStart = getWeekStartDate(now);
  const month = now.toISOString().slice(0, 7);

  try {
    /* ------------------------------------------------------------------
       1️⃣ Prevent duplicate contact view
    ------------------------------------------------------------------ */
    if (viewedUserId) {
      const viewDocId = `contact_view::${userId}::${viewedUserId}`;
      try {
        await contactViewCollection.get(viewDocId);
        return res.json({
          success: true,
          message: "Contact already viewed",
          alreadyViewed: true
        });
      } catch (e) {
        if (!(e instanceof couchbase.DocumentNotFoundError)) throw e;
      }
    }

    /* ------------------------------------------------------------------
       2️⃣ Fetch active plan
    ------------------------------------------------------------------ */
    const query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` p
      WHERE p.userId = $userId AND p.status = "active"
      LIMIT 1;
    `;

    const { rows } = await cluster.query(query, { parameters: { userId } });
    if (!rows.length) {
      return res.status(403).json({ error: "No active plan found" });
    }

    const activePlanMeta = rows[0];
    const policy = activePlanMeta.contactPolicy || {};

    /* ------------------------------------------------------------------
       3️⃣ CAS-SAFE update (retry aware)
    ------------------------------------------------------------------ */
    const updatedDoc = await casReplace(
      userPlanCollection,
      activePlanMeta.docId,
      (doc) => {
        let usage = doc.contactUsed || {
          dailyUsed: 0,
          weeklyUsed: 0,
          monthlyUsed: 0,
          totalUsed: 0
        };

        // Reset counters
        resetUsageCounters(usage, today, weekStart, month);

        // Validate NEXT usage
        if (policy.type !== "UNLIMITED") {
          const limitError = checkContactLimits(usage, policy);
          if (limitError) {
            throw new Error(limitError);
          }
        }

        // Increment
        if (policy.type !== "UNLIMITED") {
          usage.dailyUsed++;
          usage.weeklyUsed++;
          usage.monthlyUsed++;
        }
        usage.totalUsed++;

        return {
          ...doc,
          contactUsed: usage,
          updatedAt: now.toISOString()
        };
      }
    );

    const usage = updatedDoc.contactUsed;

    /* ------------------------------------------------------------------
       4️⃣ Remaining calculation
    ------------------------------------------------------------------ */
    const remaining = {
      daily: policy.dailyLimit != null
        ? Math.max(0, policy.dailyLimit - usage.dailyUsed)
        : null,
      weekly: policy.weeklyLimit != null
        ? Math.max(0, policy.weeklyLimit - usage.weeklyUsed)
        : null,
      monthly: policy.monthlyLimit != null
        ? Math.max(0, policy.monthlyLimit - usage.monthlyUsed)
        : null,
      total: policy.totalLimit != null
        ? Math.max(0, policy.totalLimit - usage.totalUsed)
        : null
    };

    const canViewMore =
      policy.type === "UNLIMITED"
        ? true
        : remaining.total == null || remaining.total > 0;

    /* ------------------------------------------------------------------
       5️⃣ Usage warning notifications
    ------------------------------------------------------------------ */
    await maybeSendUsageWarning(userId, policy, usage, remaining);

    /* ------------------------------------------------------------------
       6️⃣ Logs
    ------------------------------------------------------------------ */
    await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
      type: "contact_view",
      userId,
      planId: activePlanMeta.docId,
      usage,
      remaining,
      createdAt: now.toISOString()
    });

    if (viewedUserId) {
      await contactViewCollection.insert(
        `contact_view::${userId}::${viewedUserId}`,
        {
          viewerId: userId,
          viewedUserId,
          planId: activePlanMeta.docId,
          createdAt: now.toISOString()
        }
      );
    }

    /* ------------------------------------------------------------------
       7️⃣ Response
    ------------------------------------------------------------------ */
    return res.json({
      success: true,
      message: "Contact viewed successfully",
      policyType: policy.type,
      usage,
      remaining,
      canViewMore
    });

  } catch (err) {
    if (
      err.message &&
      err.message.toLowerCase().includes("limit")
    ) {
      return res.status(403).json({ error: err.message });
    }

    console.error("Deduct contact error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


async function casReplace(collection, docId, updater, retries = 3) {
  while (retries--) {
    const { content, cas } = await collection.get(docId);
    const updated = updater(content);

    try {
      await collection.replace(docId, updated, { cas });
      return updated;
    } catch (e) {
      if (e instanceof couchbase.CasMismatchError && retries > 0) continue;
      throw e;
    }
  }
}

function resetUsageCounters(usage, today, weekStart, month) {
  if (usage.dailyDate !== today) {
    usage.dailyUsed = 0;
    usage.dailyDate = today;
  }

  if (usage.weekStartDate !== weekStart) {
    usage.weeklyUsed = 0;
    usage.weekStartDate = weekStart;
  }

  if (usage.month !== month) {
    usage.monthlyUsed = 0;
    usage.month = month;
  }
}

function checkContactLimits(usage, policy) {
 // if (policy.dailyLimit != null && usage.dailyUsed + 1 > policy.dailyLimit) {
 //   return "Daily limit reached";
 // }
  if (policy.weeklyLimit != null && usage.weeklyUsed + 1 > policy.weeklyLimit) {
    return "Weekly limit reached";
  }
  if (policy.monthlyLimit != null && usage.monthlyUsed + 1 > policy.monthlyLimit) {
    return "Monthly limit reached";
  }
  if (policy.totalLimit != null && usage.totalUsed + 1 > policy.totalLimit) {
    return "Total limit reached";
  }
  return null;
}


async function maybeSendUsageWarning(userId, policy, usage, remaining) {
  if (!policy.totalLimit) return;

  const percent = Math.floor(
    (usage.totalUsed / policy.totalLimit) * 100
  );

  if (WARNING_THRESHOLDS.includes(percent)) {
    await sendNotification({
      userId,
      type: "CONTACT_LIMIT_WARNING",
      percent,
      remaining: remaining.total
    });
  }
}

function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}



exports.resetContacts = async (req, res) => {
  const { userIds } = req.body; // Optional array; if empty, reset all active plans

  const { cluster, userPlanCollection, planLogCollection } = await connectToCouchbase();

  try {
    /** 1️⃣ Fetch active plans */
    let query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.status = "active"
    `;

    if (userIds && userIds.length > 0) {
      query += ` AND p.userId IN $userIds`;
    }

    const result = await cluster.query(query, { parameters: { userIds } });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No active plans found to reset." });
    }

    /** 2️⃣ Reset contactUsed for each plan */
    for (let plan of result.rows) {
      await userPlanCollection.mutateIn(plan.docId, [
        couchbase.MutateInSpec.upsert("contactUsed", 0),
        couchbase.MutateInSpec.upsert("updatedAt", new Date().toISOString())
      ]);

      // Log the reset
      await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
        type: "contact_reset",
        userId: plan.userId,
        createdAt: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: `Contacts reset successfully for ${result.rows.length} plan(s).`
    });

  } catch (err) {
    console.error("Reset contacts error:", err);
    return res.status(500).json({ error: err.message });
  }
};
/*
exports.incrementContactLimit = async () => {
  const { cluster, userPlanCollection, planLogCollection } = await connectToCouchbase();

  try {
    // 1️⃣ Fetch all active plans eligible for promotion
    const query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.status = "active"
    `;

    const result = await cluster.query(query);

    if (result.rows.length === 0) {
      console.log("No active plans found for contact limit increment.");
      return;
    }

    // 2️⃣ Increment contactLimit for each plan
    for (let plan of result.rows) {
      // Define how many bonus contacts to add
      const bonusContacts = 5; // Example: add 5 contacts

      const newLimit = plan.contactLimit + bonusContacts;

      await userPlanCollection.mutateIn(plan.docId, [
        couchbase.MutateInSpec.upsert("contactLimit", newLimit),
        couchbase.MutateInSpec.upsert("updatedAt", new Date().toISOString())
      ]);

      // 3️⃣ Log the increment
      await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
        type: "contact_limit_increment",
        userId: plan.userId,
        oldLimit: plan.contactLimit,
        newLimit: newLimit,
        incrementedBy: bonusContacts,
        createdAt: new Date().toISOString()
      });

      console.log(`User ${plan.userId}: contactLimit incremented by ${bonusContacts}`);
    }

    console.log("✅ Contact limits incremented successfully.");

  } catch (err) {
    console.error("Error incrementing contact limits:", err);
  }
};

// Run daily at midnight
/*
cron.schedule("0 0 * * *", () => {
  console.log("🔄 Running contact limit increment job...");
  incrementContactLimit();
});
*/
// plan.controller.js
exports.incrementContactLimit = async ({ userIds = [], planIds = [], incrementBy = 5 } = {}) => {
  const { cluster, userPlanCollection, planLogCollection } = await connectToCouchbase();
  const updatedPlans = [];

  try {
    // Build query dynamically based on filters
    let query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.status = "active"
    `;
    const params = {};

    if (userIds.length > 0) {
      query += ` AND p.userId IN $userIds`;
      params.userIds = userIds;
    }

    if (planIds.length > 0) {
      query += ` AND p.planId IN $planIds`;
      params.planIds = planIds;
    }

    const result = await cluster.query(query, { parameters: params });

    if (result.rows.length === 0) {
      console.log("No active plans found for contact limit increment.");
      return updatedPlans; // empty array
    }

    // Increment contactLimit for each plan
    for (let plan of result.rows) {
      const newLimit = plan.contactLimit + incrementBy;

      await userPlanCollection.mutateIn(plan.docId, [
        couchbase.MutateInSpec.upsert("contactLimit", newLimit),
        couchbase.MutateInSpec.upsert("updatedAt", new Date().toISOString())
      ]);

      // Log the increment
      await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
        type: "contact_limit_increment",
        userId: plan.userId,
        planId: plan.planId,
        oldLimit: plan.contactLimit,
        newLimit,
        incrementedBy: incrementBy,
        createdAt: new Date().toISOString()
      });

      updatedPlans.push({
        userId: plan.userId,
        planId: plan.planId,
        oldLimit: plan.contactLimit,
        newLimit,
        incrementedBy: incrementBy
      });

      console.log(`User ${plan.userId}: contactLimit incremented by ${incrementBy}`);
    }

    console.log("✅ Contact limits incremented successfully.");
    return updatedPlans;

  } catch (err) {
    console.error("Error incrementing contact limits:", err);
    throw err;
  }
};


exports.expirePlansAPI = async (req, res) => {
  const { cluster, userPlanCollection, planLogCollection } = await connectToCouchbase();
  const nowISO = new Date().toISOString();

  try {
    const query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.status = "active" AND p.endDate < $now
    `;

    const result = await cluster.query(query, { parameters: { now: nowISO } });

    if (result.rows.length === 0) {
      return res.json({ success: true, message: "No plans to expire." });
    }

    for (const plan of result.rows) {
      await userPlanCollection.mutateIn(plan.docId, [
        couchbase.MutateInSpec.upsert("status", "expired"),
        couchbase.MutateInSpec.upsert("updatedAt", nowISO)
      ]);

      await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
        type: "plan_expired",
        userId: plan.userId,
        planId: plan.planId,
        planName: plan.planName,
        expiredAt: nowISO,
        createdAt: nowISO
      });
    }

    res.json({ success: true, message: "Expired plans updated successfully.", expiredCount: result.rows.length });

  } catch (err) {
    console.error("Error expiring plans:", err);
    res.status(500).json({ error: err.message });
  }
};




const NOTIFICATION_DAYS = Number(process.env.NOTIFICATION_DAYS || 3);

// Separate function for both cron & API call
exports.expirePlansCron = async () => {
  console.log("🔄 Running Plan Expiry Job...");

  const {
    cluster,
    userPlanCollection,
    collection,
    planLogCollection,
    notificationCollection
  } = await connectToCouchbase();

  const now = new Date();

  try {
    const query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.status = "active"
    `;

    const result = await cluster.query(query);

    if (!result.rows.length) return console.log("No active plans found.");

    for (let plan of result.rows) {
      const userDoc = await collection.get(plan.userId).catch(() => null);
      if (!userDoc) continue;
      const user = userDoc.value;

      const endDate = new Date(plan.endDate);
      const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // 🔔 Send notification before expiry
      if (diffDays === NOTIFICATION_DAYS) {
        const notifKey = `notif::${plan.userId}::${plan.planId}::${now.toISOString().slice(0, 10)}`;
        const notifDoc = await notificationCollection.get(notifKey).catch(() => null);

        if (!notifDoc) {
          const message = `Hello ${user.personalDetails.firstName}, your plan "${plan.planName}" expires in ${NOTIFICATION_DAYS} days. Renew now!`;

          await sendEmail(user.email, "Plan Expiry Notification", message);
          await sendSMS(user.mobilenumber, message);

          await notificationCollection.upsert(notifKey, {
            userId: plan.userId,
            planId: plan.planId,
            date: now.toISOString(),
            messageSent: true
          });

          console.log(`Notification sent to user ${plan.userId}`);
        }
      }

      // ⏳ Expire plan if past endDate
      if (endDate < now) {
        await userPlanCollection.mutateIn(plan.docId, [
          couchbase.MutateInSpec.upsert("status", "expired"),
          couchbase.MutateInSpec.upsert("updatedAt", now.toISOString())
        ]);

        console.log(`Plan expired for user ${plan.userId}: ${plan.planName}`);

        // 🔁 Auto-renew if enabled
        if (plan.autoRenew) {
          const newEndDate = new Date();
          newEndDate.setMonth(newEndDate.getMonth() + Number(plan.duration));

          const newPlanDoc = {
            ...plan,
            startDate: now.toISOString(),
            endDate: newEndDate.toISOString(),
            status: "active",
            updatedAt: now.toISOString()
          };

          await userPlanCollection.upsert(plan.docId, newPlanDoc);

          await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
            type: "auto_renew",
            userId: plan.userId,
            planId: plan.planId,
            amount: plan.price,
            createdAt: now.toISOString()
          });

          console.log(`Auto-renewed plan for user ${plan.userId}: ${plan.planName}`);
        }
      }
    }

    console.log("✅ Plan Expiry Job completed.");
  } catch (err) {
    console.error("Error in Plan Expiry Job:", err);
    throw err;
  }
};

exports.autoRenewPlanPayment = async (userPlan, user) => {
  try {
    const payment = await razorpay.orders.create({
      amount: userPlan.price * 100, // in paise
      currency: "INR",
      receipt: `receipt_${userPlan.userId}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        userId: userPlan.userId,
        planId: userPlan.planId
      }
    });

    return payment; // contains order_id for frontend / webhook verification
  } catch (err) {
    console.error("Auto-renew payment failed:", err);
    throw err;
  }
};