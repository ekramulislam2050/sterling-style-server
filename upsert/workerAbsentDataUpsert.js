const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const chokidar = require("chokidar");

module.exports = (db) => {

    const absentCollection =
        db.collection("absent");

    // =========================
    // 📌 INDEX
    // =========================
    const ensureIndex = async () => {

        try {

            await absentCollection.createIndex(
                {
                    workerId: 1,
                    date: 1,
                },
                {
                    unique: true,
                }
            );

            console.log(
                "📌 absentCollection index ready"
            );

        } catch (err) {

            console.error(
                "❌ Index error:",
                err.message
            );
        }
    };

    ensureIndex();

    // =========================
    // 📁 WATCH FOLDER
    // =========================
    const watchDir = path.join(
        __dirname,
        "../All_ExcelSheet_Of_Worker/Absent_Excelsheet_Of_Worker"
    );

    fs.mkdirSync(watchDir, {
        recursive: true,
    });

    // =========================
    // ⏰ TIME PARSER
    // =========================
    const parseTime = (value) => {

        if (!value) return "";

        // Excel numeric time
        if (typeof value === "number") {

            const totalMinutes =
                Math.floor(value * 24 * 60);

            const h =
                Math.floor(totalMinutes / 60);

            const m =
                totalMinutes % 60;

            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }

        // String time
        const date =
            new Date(`1970-01-01 ${value}`);

        if (!isNaN(date.getTime())) {

            return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        }

        return "";
    };

    // =========================
    // 📅 DATE FROM FILE NAME
    // =========================
    const getDateFromFileName = (
        filePath
    ) => {

        const fileName =
            path.basename(filePath);

        const match =
            fileName.match(
                /\d{4}-\d{2}-\d{2}/
            );

        return match
            ? match[0]
            : null;
    };

    // =========================
    // 🚀 PROCESS FILE
    // =========================
    const processingSet = new Set();

    const lastProcessedTime =
        new Map();

    const processFile = async (
        filePath
    ) => {

        const now = Date.now();

        // 🔁 Debounce
        if (
            lastProcessedTime.has(filePath)
        ) {

            const lastTime =
                lastProcessedTime.get(
                    filePath
                );

            if (
                now - lastTime < 5000
            ) {
                return;
            }
        }

        lastProcessedTime.set(
            filePath,
            now
        );

        if (
            processingSet.has(filePath)
        ) {
            return;
        }

        processingSet.add(filePath);

        try {

            console.log(
                "📥 Processing:",
                filePath
            );

            // 📖 Read Excel
            const workbook =
                xlsx.readFile(filePath);

            const sheet =
                workbook.Sheets[
                workbook.SheetNames[0]
                ];

            const rawData =
                xlsx.utils.sheet_to_json(
                    sheet,
                    {
                        defval: "",
                    }
                );

            console.log(
                "📊 Rows:",
                rawData.length
            );

            console.log(
                "📄 Sample Row:",
                rawData[0]
            );

            // 📅 File Date
            const fileDate =
                getDateFromFileName(
                    filePath
                );

            if (!fileDate) {

                console.log(
                    "❌ Invalid file date"
                );

                return;
            }

            const operations = [];

            // =========================
            // 🔄 BUILD OPERATIONS
            // =========================
            for (const row of rawData) {

                const workerId = String(
                    row.workerId ||
                    row.WorkerId ||
                    row.WorkerID ||
                    ""
                ).trim();

                if (!workerId) continue;

                const checkIn =
                    parseTime(
                        row.CheckIn ||
                        row.checkIn
                    );

                const checkOut =
                    parseTime(
                        row.CheckOut ||
                        row.checkOut
                    );

                const item = {

                    workerId,

                    name:
                        row.Name ||
                        row.name ||
                        "",

                    department:
                        row.Department ||
                        row.department ||
                        "",

                    line:
                        row.Line ||
                        row.line ||
                        "",

                    date: fileDate,

                    checkIn,

                    checkOut,

                    // ✅ Late folder = always late
                    status: "absent",

                    updatedAt:
                        new Date(),
                };

                operations.push({

                    updateOne: {

                        filter: {
                            workerId,
                            date: fileDate,
                        },

                        update: {
                            $set: item,
                        },

                        upsert: true,
                    },
                });
            }

            console.log(
                "💾 Writing to DB..."
            );

            // =========================
            // 📦 CHUNK INSERT
            // =========================
            const chunkSize = 1000;

            for (
                let i = 0;
                i < operations.length;
                i += chunkSize
            ) {

                const chunk =
                    operations.slice(
                        i,
                        i + chunkSize
                    );

                await absentCollection.bulkWrite(
                    chunk,
                    {
                        ordered: false,
                    }
                );
            }

            console.log(
                "✅ DB Synced:",
                operations.length
            );

        } catch (err) {

            console.error(
                "❌ Error:",
                err.message
            );

        } finally {

            processingSet.delete(
                filePath
            );
        }
    };

    // =========================
    // 👀 WATCHER
    // =========================
    const startWatcher = () => {

        console.log(
            "👀 Auto absentCollection System Started..."
        );

        const watcher =
            chokidar.watch(
                watchDir,
                {
                    persistent: true,

                    ignoreInitial: false,

                    awaitWriteFinish: {
                        stabilityThreshold: 3000,
                        pollInterval: 1000,
                    },
                }
            );

        // 📥 NEW FILE
        watcher.on(
            "add",
            async (filePath) => {

                if (
                    !filePath.endsWith(
                        ".xlsx"
                    )
                ) {
                    return;
                }

                if (
                    filePath.includes(
                        "~$"
                    )
                ) {
                    return;
                }

                console.log(
                    "📂 New file:",
                    filePath
                );

                await processFile(
                    filePath
                );
            }
        );

        // ✏️ UPDATED FILE
        watcher.on(
            "change",
            async (filePath) => {

                if (
                    !filePath.endsWith(
                        ".xlsx"
                    )
                ) {
                    return;
                }

                if (
                    filePath.includes(
                        "~$"
                    )
                ) {
                    return;
                }

                console.log(
                    "✏️ File changed:",
                    filePath
                );

                await processFile(
                    filePath
                );
            }
        );

        // ❌ WATCHER ERROR
        watcher.on(
            "error",
            (err) => {

                console.error(
                    "❌ Watcher error:",
                    err.message
                );
            }
        );
    };

    return {
        startWatcher,
    };
};