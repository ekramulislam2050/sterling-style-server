const express = require("express")
const { ObjectId } = require("mongodb")

module.exports = (db) => {
    const router = express.Router()
    const collectionOfOrders = db.collection("orders")
    // get orders-------------
    router.get("/", async (req, res) => {
        try {
            const result = await collectionOfOrders.find({}).toArray()
            res.send(result)
        } catch (err) {
            res.status(500).json({
                message: "Failed to fetch order"
            })
        }
    })
    // get specific order by id---------
    router.get("/:id", async (req, res) => {
        try {
            const id = req.params.id
            if(!ObjectId.isValid(id)){
                return res.status(400).json({
                    message:"Invalid order id"
                })
            }
            const query = { _id: new ObjectId(id) }
            const result = await collectionOfOrders.findOne(query)
            if (!result) {
                return res.status(404).json({
                    message: "order not found"
                })
            }
            res.send(result)
        } catch (err) {
           res.status(500).json({
            message:"Failed to fetch order by id"
           })
        }
    })
    return router
}