
require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
const { MongoClient, ServerApiVersion, Collection } = require('mongodb');
const port = process.env.PORT || 5000


//===============================
//       auth router
//===============================
const userJwt = require("./auth_routers/jwt.router")

//===============================
//         post router
//===============================
const orderPostRouter = require("./posts/orderPost.router")
const allWorkersDataPostRouter = require("./posts/allWorkersDataPost.router")


//===============================
//         get router
//===============================
const getOrdersRouter = require("./gets/getOrders.router");
const getAllWorkersData = require("./gets/getAllWorkersData.router")
const getWorkersSummary = require("./gets/getWorkersSummary.router")
const getAttendanceOfWorker = require("./gets/getAttendanceOfWorker")

//===============================
//         patch router
//===============================
const patchRouter = require("./patch/patch.router");

//===============================
//       even-driven 
//===============================
// even-driven backend system for worker,s attendance---------------
const workerAttendanceWatcher = require("./upsert/workerAttendanceDataUpsert")
const workerLateAttendanceWatcher = require("./upsert/workerLateAttendanceDataUpsert")


//===============================
//         middleware
//===============================
app.use(cors())
app.use(express.json())

// variable---------
let attendanceWatcherStarted = false
let lateWatcherStarted = false

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hhpkb.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {

    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // collections--------------
        const db = client.db("sterling-style-DB")

        //===============================
        //       even-driven 
        //===============================
        // even-driven backend system for worker,s attendance---------------
        if (!attendanceWatcherStarted) {
            const attendanceWatcher = workerAttendanceWatcher(db);
            attendanceWatcher.startWatcher();
            attendanceWatcherStarted = true;
        }
        // even-driven backend system for worker,s late attendance---------------
        if (!lateWatcherStarted) {
            const lateWatcher = workerLateAttendanceWatcher(db);
            lateWatcher.startWatcher();
            lateWatcherStarted = true;
        }

        //===============================
        //       auth api
        //===============================
        app.use("/api/auth/", userJwt)

        //===============================
        //         posts api
        //===============================
        app.use("/api/postOrders", orderPostRouter(db))
        app.use("/api/postAllWorkersData", allWorkersDataPostRouter(db))

        //===============================
        //       gets api
        //===============================
        app.use("/api/getOrders", getOrdersRouter(db))
        app.use("/api/getAllWorkersData", getAllWorkersData(db))
        app.use("/api/getWorkersSummary", getWorkersSummary(db))
        app.use("/api/getAttendanceOfWorker", getAttendanceOfWorker(db))

        //===============================
        //       patch api
        //===============================
        app.use("/api/patchOrders", patchRouter(db))


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run()
    .then(() => {
        app.listen(port, () => {
            console.log(`sterling-style is running on ${port}`);
        });
    })
    .catch(console.dir);;


app.get("/", async (req, res) => {
    res.send("sterling-style is running--------")
})
