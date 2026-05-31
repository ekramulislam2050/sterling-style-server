const express=require("express")
const { ObjectId } = require("mongodb")

module.exports=(db)=>{
    const router=express.Router()
    const collectionOfAllWorkersData=db.collection("musterDataOfAllWorkers")
    router.get("/:id",async(req,res)=>{
        const {id}=req.params
        const workerDetails=await collectionOfAllWorkersData.findOne({ _id: new ObjectId(id) })

        res.send(workerDetails)
    })
    return router
}