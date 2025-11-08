require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
port = process.env.PROT || 5000

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

        // verify token-----------
          const verifyToken=async(req,res,next)=>{
              try{
                if(!req.headers.authorization){
                return res.status(401).send("unAuthorized")
              }
             const token=req.headers.authorization.split(" ")[1]
             jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
                 if(err){
                    return res.status(402).send("forbidden")
                 }
                 req.email=decoded.email
                 req.decoded=decoded
                 next()
             })
              }catch(err){
                console.log(err)
                res.status(500).send("server error while verifying token")
              }
          
          }

          

        // api-----------
        app.post("/jwt",async (req,res) => {
              try{
                 const {email} =req.body
              if(!email){
               return res.status(400).send({error:"email require"})
              }
              const token=jwt.sign({email},process.env.JWT_SECRET,{expiresIn:"1h"})
              res.send({token})
              }catch(err){
                res.status(500).send({error:"Internal server error"})
              }
        })

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