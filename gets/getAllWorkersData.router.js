const express=require("express")

module.exports=(db)=>{
    const router=express.Router()
    const collectionOfAllWorkersData=db.collection("musterDataOfAllWorkers")

    // get all workers data------------
    router.get("/",async(req,res)=>{
        try{
            const page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) ||50
            const skip = (page-1)*limit

            const total=await collectionOfAllWorkersData.countDocuments()
            const workers = await collectionOfAllWorkersData.find({})
            .skip(skip)
            .limit(limit)
            .toArray()

              res.json({total,page,limit,workers})
        }catch(err){
            res.status(500).json({message:"Failed to fetch all workers data",error:err.message})
        }
    })
    return router
}