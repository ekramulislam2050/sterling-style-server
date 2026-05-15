const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const chokidar = require("chokidar");

module.exports = (db) => {

    const musterCollectionOfAllWorkersData =
        db.collection("musterDataOfAllWorkers");

    // =========================
    // 📌 INDEX
    // =========================
    const ensureIndex = async () => {

        try {

            await musterCollectionOfAllWorkersData.createIndex(
                {
                    nid: 1,
                },
                {
                    unique: true,
                }
            );

            console.log(
                "📌 musterCollectionOfAllWorkersData index ready"
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
        "../All_ExcelSheet_Of_Worker/Muster_ExcelSheet_Of_Worker"
    );

    fs.mkdirSync(watchDir, {
        recursive: true,
    });

    // =========================
    // 🚀 PROCESS CONTROL
    // =========================
    const processingSet = new Set();

    const lastProcessedTime =
        new Map();

    // =========================
    // 🚀 PROCESS FILE
    // =========================
    const processFile = async (
        filePath
    ) => {

        // ✅ reset every file
        let emptyNidCount = 0;

        let duplicateNidCount = 0;

        const nidMap = {};

        const now = Date.now();

        // =========================
        // 🔁 DEBOUNCE
        // =========================
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

        // =========================
        // 🔒 PREVENT MULTIPLE PROCESS
        // =========================
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

            // =========================
            // 📖 READ EXCEL
            // =========================
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

            // =========================
            // 📦 LAST WORKER ID
            // =========================
            const lastWorker =
                await musterCollectionOfAllWorkersData
                    .find()
                    .sort({
                        workerId: -1,
                    })
                    .limit(1)
                    .toArray();

            let startIndex = 1;

            if (
                lastWorker.length > 0
            ) {

                startIndex =
                    parseInt(
                        lastWorker[0].workerId.replace(
                            "W",
                            ""
                        )
                    ) + 1;
            }

            const operations = [];

            // =========================
            // 🔄 BUILD OPERATIONS
            // =========================
            for (
                let index = 0;
                index < rawData.length;
                index++
            ) {

                const worker =
                    rawData[index];

                const nid = String(
                    worker.NID || ""
                ).trim();

                // =========================
                // ❌ EMPTY NID
                // =========================
                if (!nid) {

                    emptyNidCount++;

                    console.log(
                        `❌ Empty NID Row: ${index + 1}`
                    );

                    continue;
                }

                // =========================
                // ❌ DUPLICATE NID
                // =========================
                if (nidMap[nid]) {

                    duplicateNidCount++;

                    console.log(
                        `❌ Duplicate NID: ${nid}`
                    );

                    continue;
                }

                nidMap[nid] = true;

                // =========================
                // 📦 DATA OBJECT
                // =========================
                const item = {

                    name:
                        worker.Name || "",

                    fatherName:
                        worker["Father Name"] ||
                        "",

                    motherName:
                        worker["Mother Name"] ||
                        "",

                    dob:
                        worker["Date of Birth"] ||
                        "",

                    nid,

                    phone:
                        worker.Phone || "",

                    joiningDate:
                        worker["Joining Date"] ||
                        "",

                    department:
                        worker.Department || "",

                    designation:
                        worker.Designation || "",

                    salary:
                        worker.Salary || "",

                    bankAccount:
                        worker["Bank Account"] ||
                        "",

                    status:
                        worker.Status ||
                        "active",

                    updatedAt:
                        new Date(),
                };

                // =========================
                // 📦 UPSERT OPERATION
                // =========================
                operations.push({

                    updateOne: {

                        filter: {
                            nid,
                        },

                        update: {

                            $set: item,

                            $setOnInsert: {

                                workerId:
                                    `W${String(
                                        startIndex +
                                        index
                                    ).padStart(
                                        5,
                                        "0"
                                    )}`,

                                createdAt:
                                    new Date(),
                            },
                        },

                        upsert: true,
                    },
                });
            }

            // =========================
            // 📊 FINAL REPORT
            // =========================
            console.log(
                "❌ Empty NID Count:",
                emptyNidCount
            );

            console.log(
                "❌ Duplicate NID Count:",
                duplicateNidCount
            );

            console.log(
                "✅ Final Operations:",
                operations.length
            );

            // =========================
            // 📦 BULK WRITE
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

                await musterCollectionOfAllWorkersData.bulkWrite(
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
            "👀 Auto Muster Worker System Started..."
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

        // =========================
        // 📥 NEW FILE
        // =========================
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

        // =========================
        // ✏️ FILE CHANGE
        // =========================
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

        // =========================
        // ❌ WATCHER ERROR
        // =========================
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