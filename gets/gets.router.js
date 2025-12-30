const express=require("express")

module.exports=(db)=>{
    const router=express.Router()
    const collectionOfOrders=db.collection("orders")
    router.get("/",async(req,res)=>{
        try{
            const result= await collectionOfOrders.find({}).toArray()
            res.send(result)
        }catch(err){
            res.status(500).json({
                message:"Failed to fetch order"
            })
        }
    })
    return router
}