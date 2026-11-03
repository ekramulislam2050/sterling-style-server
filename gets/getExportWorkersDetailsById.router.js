const express=require("express")
const { ObjectId } = require("mongodb")
 

module.exports=(db)=>{
  const router=express.Router()
  const  collectionOfAllWorkersData=db.collection("musterDataOfAllWorkers")

  router.get("/",async(req,res)=>{
       try{
              const {ids}=req.query;
                 if(!ids){
                  return res.status(400).send({
                    message:"Worker IDs are require"
                  })
                 }
                 const selectedWorkersId=ids.split(",")
                 const objectIds=selectedWorkersId.filter((id)=>ObjectId.isValid(id)).map((id)=>new ObjectId(id))

                 const query={
                    $or:[
                      {_id:{$in:objectIds}},
                      {workerId:{$in:selectedWorkersId}},
                    ]
                 };
                 const workers=await collectionOfAllWorkersData.find(query).toArray()
                 res.send(workers)

       }catch(err){
            if(err){
              res.status(500).send({ message : "Failed to fetch selected workers"})
            }
       } 
  })
  return router
}