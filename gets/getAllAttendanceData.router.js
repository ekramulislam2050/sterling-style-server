const express=require('express')

module.exports=(db)=>{
    const router=express.Router()
    const collectionOfAllAttendance=db.collection("attendance")

    // get all attendance------------
    router.get("/",async(req,res)=>{
        try{
           const result=await collectionOfAllAttendance.find({}).toArray()
           res.send(result)
        }catch(err){
           res.status(500).json({message:"Failed to fetch allAttendance data",err:err.message})
        }
    })
    return router

}