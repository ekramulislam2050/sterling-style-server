const express = require("express")
const { ObjectId } = require("mongodb")

module.exports = (db) => {
    const router = express.Router()
    const collectionOfOrders = db.collection("orders")
    router.patch("/:id", async (req, res) => {
        try {
            const id = req.params.id
            // id validation-------
            if(!ObjectId.isValid(id)){
               return res.status(400).json({
                    success:false,
                    message:'Invalid order id',


                })
            }
            const query = { _id: new ObjectId(id) }
            const body = req.body
            // body validation----------
            if(!body || Object.keys(body).length===0){
                return res.status(400).json({
                    success:false,
                    message:"No update data provided"
                })
            }
            const updatedDoc = {
                $set: {
                    ...body,
                    updateAt: new Date()
                }
            }
            const result = await collectionOfOrders.updateOne(query, updatedDoc)
            res.send(result)
        }catch(err){
            res.status(500).json({
                success:false,
                message:err.message
            })
        }
     })

     return router
}