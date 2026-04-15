const express = require("express");

module.exports = (db) => {
    const router = express.Router();
    const allWorkersData = db.collection("allWorkersData");

    // get workers summary ----------
    router.get("/", async (req, res) => {
        try {
            const result = await allWorkersData
                .aggregate([
                    {
                        $facet: {
                            total: [{ $count: "count" }],

                            active: [
                                {
                                    $match: {
                                        status: { $regex: /^active$/i },
                                    },
                                },
                                { $count: "count" },
                            ],

                            onLeave: [
                                {
                                    $match: {
                                        status: { $regex: /^on leave$/i },
                                    },
                                },
                                { $count: "count" },
                            ],

                            inactive: [
                                {
                                    $match: {
                                        status: { $regex: /^inactive$/i },
                                    },
                                },
                                { $count: "count" },
                            ],

                            resigned: [
                                {
                                    $match: {
                                        status: { $regex: /^resigned$/i },
                                    },
                                },
                                { $count: "count" },
                            ],

                            departments: [
                                {
                                    $match: {
                                        department: {
                                            $exists: true,
                                            $ne: null,
                                        },
                                    },
                                },
                                {
                                    $group: {
                                        _id: "$department",
                                    },
                                },
                                {
                                    $count: "count",
                                },
                            ],
                        },
                    },
                ])
                .toArray();

            const data = result[0];

            res.status(200).send({
                total: data.total[0]?.count || 0,
                active: data.active[0]?.count || 0,
                onLeave: data.onLeave[0]?.count || 0,
                inactive: data.inactive[0]?.count || 0,
                resigned: data.resigned[0]?.count || 0,
                departments: data.departments[0]?.count || 0,
            });
        } catch (err) {
            console.error("Workers summary error:", err);

            res.status(500).send({
                success: false,
                message: "Failed to fetch workers summary",
                error: err.message,
            });
        }
    });

    return router;
};