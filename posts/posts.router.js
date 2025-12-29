const express = require("express")



// orders related api----------
module.exports = (db) => {
    const router = express.Router()
    const collectionOfOrders = db.collection("orders")
    router.post("/", async (req, res) => {
        try {
            const order = req.body
            const result = await collectionOfOrders.insertOne(order)
            res.send(result)
        } catch (err) {
            res.status(500).json({
                message: "Failed to create order",
            });
        }
    })
    return router
}