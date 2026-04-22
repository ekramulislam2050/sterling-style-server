const express = require("express");

module.exports = (db) => {
    const router = express.Router();
    const collectionOfWorkerAttendance = db.collection("attendance");

    // ✅ INDEX (run once, safe)
    const ensureIndexes = async () => {
        await collectionOfWorkerAttendance.createIndex({ date: -1 });
        await collectionOfWorkerAttendance.createIndex({ workerId: 1 });
    };
    ensureIndexes();

    router.get("/", async (req, res) => {
        try {
            // ✅ pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;

            // ✅ filters
            const { date, workerId } = req.query;
            let query = {};

            if (date) {
                query.date = date;
            }

            if (workerId) {
                query.workerId = workerId;
            }

            // ✅ data query with sorting
            const result = await collectionOfWorkerAttendance
                .find(query)
                .sort({ date: -1, _id: -1 }) // 🔥 important
                .skip(skip)
                .limit(limit)
                .toArray();

            // ✅ total count (with filter)
            const total = await collectionOfWorkerAttendance.countDocuments(query);

            // ✅ response
            res.send({
                data: result,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            });

        } catch (err) {
            res.status(500).json({
                message: "Failed to fetch attendanceOfWorker",
                error: err.message,
            });
        }
    });

    return router;
};