const express=require("express")

module.exports=(db)=>{
    const router=express.Router()
    const collectionOfAllWorkersData=db.collection("allWorkersData")

    // get all workers data------------
    router.get("/",async(req,res)=>{
        try{
            const result = await collectionOfAllWorkersData.find({}).toArray()
              res.send(result)
        }catch(err){
            res.status(500).json({message:"Failed to fetch all workers data",error:err.message})
        }
    })
    return router
}