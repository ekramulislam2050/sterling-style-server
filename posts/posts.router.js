const express = require("express")



// orders related api----------
module.exports = (db) => {
    const router = express.Router()
    const collectionOfOrders = db.collection("orders")
    router.post("/", async (req, res) => {
        try {
            const order = req.body
            // Validation: Ex-factory date >= order date
            if (new Date(order.exFactoryDate) < new Date(order.orderDate)) {
                return res.status(400).json({
                    message: "Ex-factory date cannot be before order date",
                });
            }
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