const express = require("express")

module.exports = (db) => {
    const router = express.Router()
    const attendanceOfAllWorker = db.collection("attendance")
    const allWorkersData = db.collection("musterDataOfAllWorkers");
    router.get("/", async (req, res) => {
        try {
            const [
                totalNumberOfActiveWorker,
                present,
                late,
                absent,
                insideFactory
            ] = await Promise.all([
                allWorkersData.countDocuments({ status: "Active" }),
                attendanceOfAllWorker.countDocuments({ status: "present" }),
                attendanceOfAllWorker.countDocuments({ status: "late" }),
                attendanceOfAllWorker.countDocuments({ status: "absent" }),
                attendanceOfAllWorker.countDocuments({
                    checkIn:{$exists:true,$ne:""},
                    checkOut:{$in:[null,""]}
                })
            ])
            const attendanceRate = totalNumberOfActiveWorker ? (((present + late) / totalNumberOfActiveWorker) * 100).toFixed(1) : "0.0"

            res.send({
                totalNumberOfActiveWorker,
                present,
                late,
                absent,
                attendanceRate,
                insideFactory
            })
        } catch (err) {
            res.status(500).json({
                message: "Failed to count workers",
                error: err.message
            })
        }
    })
    return router
}