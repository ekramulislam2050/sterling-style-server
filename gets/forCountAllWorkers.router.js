const express=require("express")

module.exports=(db)=>{
    const router=express.Router()
      const allWorkersData = db.collection("musterDataOfAllWorkers");
      router.get("/",async(req,res)=>{
            try{
                const totalNumberOfWorkers=await allWorkersData.countDocuments()
            res.send({totalNumberOfWorkers}) 
            }catch(err){
                res.status(500).json({
                    message:"Failed to count workers",
                    error:err.message
                })
            }
      })
      return router
}