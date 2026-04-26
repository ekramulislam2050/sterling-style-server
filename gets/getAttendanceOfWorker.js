const express = require("express");

module.exports = (db) => {
    const router = express.Router();
    const collectionOfWorkerAttendance = db.collection("attendance");

    router.get("/", async (req, res) => {
        try {
            // ✅ pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;

            // ✅ filters
            const { date, workerId, fromDate, toDate, status } = req.query;
            let query = {};

            // ====================
            // DATE FILTER (RANGE)
            // ====================
            if (fromDate && toDate) {
                query.date = {
                    $gte: fromDate,
                    $lte: toDate
                }
            } else if (date) {
                query.date = date
            }

            // ==========================
            // WORKER SEARCH (PARTIAL)
            // ==========================
            if (workerId) {
                query.workerId = {
                    $regex:`^${workerId}`,
                    $options: "i"
                }
            }

            // =======================
            // STATUS FILTER
            // =======================
            if (status) {
                query.status = status
            }


            // ======================
            // QUERY
            // =====================
            const [result, total] = await Promise.all([
                collectionOfWorkerAttendance
                    .find(query)
                    .sort({ date: -1, _id: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),

                collectionOfWorkerAttendance.countDocuments(query)
            ])

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