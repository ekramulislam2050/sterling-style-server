const express = require("express")
const XLSX = require("xlsx");
const path = require("path")

// all workers data related api----------------
module.exports = (db) => {
    const router = express.Router()
    const collectionOfAllWorkersData = db.collection("allWorkersData")
    router.post("/", async (req, res) => {
        try {
            const workbook = XLSX.readFile(path.join(__dirname,"../ExcelSheetOfWorker/Static-worker-data.xlsx"));
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const data = XLSX.utils.sheet_to_json(sheet);

            const formattedWorkers = data.map((worker, index) => ({
                workerId: `W${String(index + 1).padStart(4, "0")}`,
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

            const result = await collectionOfAllWorkersData.insertMany(formattedWorkers)
             
            res.send(result)

        } catch (err) {
            res.status(500).json({ message: "Failed to load excel file", error: err.message })
        }
    })
    return router
}
