const express=require("express")

module.exports=(db)=>{
    const router=express.Router()
    const collectionOfAllWorkersData=db.collection("musterDataOfAllWorkers")

    // get all workers data------------
    router.get("/",async(req,res)=>{
        try{
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 50;
            const skip=(page - 1)*limit
            const [workers]=await Promise.all([
                collectionOfAllWorkersData.find({}).skip(skip).limit(limit).toArray()
            ])
            res.send({
                 workers
            })
        }catch(err){
            res.status(500).json({message:"Failed to fetch all workers data",error:err.message})
        }
    })
    return router
}