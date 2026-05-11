const express = require("express")
const XLSX = require("xlsx");
const path = require("path")

// all workers data related api----------------
module.exports = (db) => {
    const router = express.Router()
    const musterCollectionOfAllWorkersData = db.collection("musterDataOfAllWorkers")
    router.post("/", async (req, res) => {
        try {
            // existing worker data----------
            const existingWorkerData = await musterCollectionOfAllWorkersData.findOne()

            if (existingWorkerData) {
                return res.status(400).json({
                    success: false,
                    message: "Workers already imported"
                })
            }

            // excel file convert to json---------------

            const workbook = XLSX.readFile(path.join(__dirname, "../All_ExcelSheet_Of_Worker/Muster_ExcelSheet_Of_Worker/Static-worker-data.xlsx"));
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const data = XLSX.utils.sheet_to_json(sheet);

            // last worker -------------------
            const lastWorker = await musterCollectionOfAllWorkersData
                .find()
                .sort({ workerId: -1 })
                .limit(1)
                .toArray()

            let startIndex = 1

            if (lastWorker.length > 0) {
                startIndex =
                    parseInt(lastWorker[0].workerId.replace("W", "")) + 1
            }

            const formattedWorkers = data.map((worker, index) => ({
                workerId: `W${String(startIndex + index).padStart(4, "0")}`,
                name: worker.Name,
                fatherName: worker["Father Name"],
                motherName: worker["Mother Name"],
                dob: worker["Date of Birth"],
                nid: worker.NID,
                phone: worker.Phone,
                joiningDate: worker["Joining Date"],
                department: worker.Department,
                designation: worker.Designation,
                salary: worker.Salary,
                bankAccount: worker["Bank Account"],
                status: worker.Status || "active",
                createdAt: new Date(),
            }));

            //   save to db-----------------
            const result = await musterCollectionOfAllWorkersData.insertMany(formattedWorkers)

            res.send(result)

        } catch (err) {
            res.status(500).json({ message: "Failed to load excel file", error: err.message })
        }
    })
    return router
}
