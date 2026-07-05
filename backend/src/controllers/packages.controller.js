const couchbase = require('couchbase');
const { connectToCouchbase } = require("../config/db.config");
const { v4: uuidv4 } = require("uuid");
// const logger = require('../utils/logger'); // Optional: only if you're using a logger like winston

exports.createPackage = async (req, res) => {
    try {
        const id = `${uuidv4()}`;
        const newPackage = {
        ...req.body,
        type: 'package',
        createdAt: new Date().toISOString()
        };

        // Establish Couchbase connection and retrieve collection
        const { cluster, collection, packageCollection } = await connectToCouchbase();
        console.log("Collection object:", collection);

        if (!collection) {
            return res.status(500).json({ message: "Database collection not initialized" });
        }

        if (!cluster) {
            return res.status(500).json({ message: "Database cluster not initialized" });
        }

        // Insert package data
        const insertResult = await packageCollection.insert(id, newPackage);
        console.log("Insert Result:", insertResult);

        // Respond with success
        return res.status(201).json({
        message: "Package created successfully!",
        package: {
            id,
            name: req.body.name,
            price: req.body.price,
            duration: req.body.duration,
            features: req.body.features,
            badgeColor: req.body.badgeColor,
            createdAt: newPackage.createdAt
        }
        });

    } catch (error) {
        console.error("Package Creation Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
