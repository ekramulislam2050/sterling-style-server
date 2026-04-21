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
    // 📁 FOLDERS
    // =========================
    const watchDir = path.join(__dirname,"../attendanceOfWorker");
    const processedDir = path.join(__dirname,"../processed");

    fs.mkdirSync(watchDir, { recursive: true });
    fs.mkdirSync(processedDir, { recursive: true });

    // =========================
    // 🧠 HELPERS
    // =========================
    const parseTime = (value) => {
        if (!value) return "";

        if (typeof value === "number") {
            const totalMinutes = Math.floor(value * 24 * 60);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

    const processFile = async (filePath) => {
        if (processingSet.has(filePath)) return;
        processingSet.add(filePath);

        try {
            console.log("📥 Processing:", filePath);

            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData = xlsx.utils.sheet_to_json(sheet);

            console.log("📊 Rows:", rawData.length);

            const formattedData = rawData.map((row) => ({
                workerId: String(row.workerId || "").trim(),
                name: row.Name || "",
                date: parseDate(row.Date),
                checkIn: parseTime(row.CheckIn),
                checkOut: parseTime(row.CheckOut),
                status: row.Status || getStatus(parseTime(row.CheckIn)),
                createdAt: new Date(),
            }));

            const validData = formattedData.filter(
                (item) => item.workerId && item.date
            );
     

            // =========================
            // 🔥 DB UPSERT
            // =========================
            const operations = validData.map((item) => ({
                updateOne: {
                    filter: {
                        workerId: item.workerId,
                        date: item.date,
                    },
                    update: { $set: item },
                    upsert: true,
                },
            }));

            const chunkSize = 1000;

            console.log("💾 Inserting to DB...");

            for (let i = 0; i < operations.length; i += chunkSize) {
                const chunk = operations.slice(i, i + chunkSize);

                await attendanceCollection.bulkWrite(chunk, {
                    ordered: false,
                });
            }

            console.log("✅ Saved to DB:", validData.length);

            // =========================
            // 📦 MOVE FILE
            // =========================
            const fileName = path.basename(filePath);
            const newPath = path.join(processedDir, fileName);

            await fs.promises.rename(filePath, newPath);
            console.log("📦 Moved:", fileName);

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
        console.log("👀 Attendance watcher started...");

        const watcher = chokidar.watch(watchDir,{
            persistent: true,
            ignoreInitial: false,
            awaitWriteFinish: {
                stabilityThreshold: 3000,
                pollInterval: 1000,
            },
        });

        watcher.on("add", async (filePath) => {
            console.log("📂 File detected:", filePath);
            if (!filePath.endsWith(".xlsx")) return;
            if (filePath.includes("~$")) return;

            await processFile(filePath);
        });

        watcher.on("error", (err) => {
            console.error("Watcher error:", err.message);
        });
    };

    // ✅ IMPORTANT EXPORT
    return { startWatcher };
};