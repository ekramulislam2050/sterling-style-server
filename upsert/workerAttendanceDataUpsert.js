const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const chokidar = require("chokidar");

module.exports = (db) => {
    const attendanceCollection = db.collection("attendance");

    // =========================
    // 📌 INDEX (SAFE INIT)
    // =========================
    const ensureIndex = async () => {
        try {
            await attendanceCollection.createIndex(
                { workerId: 1, date: 1 },
                { unique: true }
            );
            console.log("📌 Attendance index ready");
        } catch (err) {
            console.error("Index error:", err.message);
        }
    };

    ensureIndex();

    // =========================
    // 📁 WATCH FOLDER
    // =========================
    const watchDir = path.join(__dirname, "../All_ExcelSheet_Of_Worker/Attendance_ExcelSheet_Of_Worker");
    fs.mkdirSync(watchDir, { recursive: true });

    // =========================
    // 🧠 HELPERS
    // =========================
    const parseTime = (value) => {
        if (!value) return "";

        // Excel numeric time
        if (typeof value === "number") {
            const totalMinutes = Math.floor(value * 24 * 60);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;

            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }

        // String time
        const date = new Date(`1970-01-01 ${value}`);

        if (!isNaN(date)) {
            return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        }

        return value.toString().trim();
    };

    const parseDate = (value) => {
        if (!value) return new Date().toISOString().split("T")[0];

        if (typeof value === "number") {
            const excelDate = new Date((value - 25569) * 86400 * 1000);
            return excelDate.toISOString().split("T")[0];
        }

        return new Date(value).toISOString().split("T")[0];
    };

    const getStatus = (checkIn) => {
        if (!checkIn) return "absent";

        const [h, m] = checkIn.split(":").map(Number);

        if (h >= 12) return "half-day";
        if (h > 8 || (h === 8 && m > 15)) return "late";

        return "present";
    };

    // =========================
    // 🚀 PROCESS FILE
    // =========================
    const processingSet = new Set();
    const lastProcessedTime = new Map(); // debounce

    const processFile = async (filePath) => {
        const now = Date.now();

        // 🔁 debounce (avoid multiple triggers)
        if (lastProcessedTime.has(filePath)) {
            const lastTime = lastProcessedTime.get(filePath);
            if (now - lastTime < 5000) {
                return;
            }
        }

        lastProcessedTime.set(filePath, now);

        if (processingSet.has(filePath)) return;
        processingSet.add(filePath);

        try {
            console.log("📥 Processing:", filePath);

            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData = xlsx.utils.sheet_to_json(sheet, {
                defval: "",
            });;

            console.log("📊 Rows:", rawData.length);

            const operations = [];

            for (const row of rawData) {
                const workerId = String(row.workerId || "").trim();
                const date = parseDate(row.Date);

                if (!workerId || !date) continue;

                const checkIn = parseTime(row.CheckIn);

                const item = {
                    workerId,
                    name: row.Name || "",
                    date,
                    checkIn,
                    checkOut: parseTime(row.CheckOut),
                    status: row.Status?.toLowerCase() || getStatus(checkIn),
                    updatedAt: new Date(),
                };

                operations.push({
                    updateOne: {
                        filter: { workerId, date },
                        update: { $set: item },
                        upsert: true,
                    },
                });
            }

            console.log("💾 Writing to DB...");

            const chunkSize = 1000;

            for (let i = 0; i < operations.length; i += chunkSize) {
                const chunk = operations.slice(i, i + chunkSize);

                await attendanceCollection.bulkWrite(chunk, {
                    ordered: false,
                });
            }

            console.log("✅ DB Synced:", operations.length);

        } catch (err) {
            console.error("❌ Error:", err.message);
        } finally {
            processingSet.delete(filePath);
        }
    };

    // =========================
    // 👀 WATCHER
    // =========================
    const startWatcher = () => {
        console.log("👀 Auto Attendance System Started...");

        const watcher = chokidar.watch(watchDir, {
            persistent: true,
            ignoreInitial: false,
            awaitWriteFinish: {
                stabilityThreshold: 3000,
                pollInterval: 1000,
            },
        });

        // 📥 new file
        watcher.on("add", async (filePath) => {
            if (!filePath.endsWith(".xlsx")) return;
            if (filePath.includes("~$")) return;

            console.log("📂 New file:", filePath);
            await processFile(filePath);
        });

        // ✏️ file updated
        watcher.on("change", async (filePath) => {
            if (!filePath.endsWith(".xlsx")) return;
            if (filePath.includes("~$")) return;

            console.log("✏️ File changed:", filePath);
            await processFile(filePath);
        });

        watcher.on("error", (err) => {
            console.error("Watcher error:", err.message);
        });
    };

    return { startWatcher };
};