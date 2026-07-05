const couchbase = require('couchbase');
const { connectToCouchbase } = require("../config/db.config");
const jwt = require('jsonwebtoken');

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
           users.createdAt
    FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` users 
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
  const { collection } = await connectToCouchbase();
  console.log('REquest = ' + req.body)
  const { plan, doc_id } = req.body;
  const docId = doc_id;

  if (!docId) {
    return res.status(400).json({ message: 'docId not found in request' });
  }

  if (!plan) {
    return res.status(400).json({ message: 'Plan value is missing' });
  }

  try {
    await collection.mutateIn(docId, [
      couchbase.MutateInSpec.upsert('plan', plan)
    ]);

    return res.status(200).json({ success: true, message: 'Plan updated successfully!' });
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