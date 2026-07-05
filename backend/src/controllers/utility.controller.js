const couchbase = require('couchbase');
const { connectToCouchbase } = require("../config/db.config");


exports.getProfileUtility = async (req, res) => 
{
    try {
        const key = '1'; // Ensure key matches the document key type in Couchbase
        const { profileUtilityCollection } = await connectToCouchbase();
        console.log("Collection" + profileUtilityCollection);
        // Fetch the document by its key
        const result = await profileUtilityCollection.get(key);
      
        // Return the document content
        res.status(200).json(result.value);
      } catch (error) {
        console.error('Error fetching document:', error.message || error);
        res.status(500).json({ error: 'Failed to fetch document' });
      }
};