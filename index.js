require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000


// router-------------
 const userJwt = require("./auth_routers/jwt.router")
 const postRouter=require("./posts/posts.router")
 const getRouter=require("./gets/gets.router")
// middleware------------
app.use(cors())
app.use(express.json())


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
        const db=client.db("sterling-style-DB")
       
        
        // jwt token---------------
        app.use("/api/auth/",userJwt)
        // post orders   -----------
        app.use("/api/postOrders",postRouter(db))
        // get orders and specific order by id---------
        app.use("/api/getOrders",getRouter(db))
        

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", async (req, res) => {
    res.send("sterling-style is running--------")
})
app.listen(port, () => {
    console.log(`sterling-style is running on ${port}`)
})