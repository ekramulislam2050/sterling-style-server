const express = require("express")

const addDays = (date, day) => {
    const d = new Date(date);
    d.setDate(d.getDate() + day);
    return d.toISOString().split("T")[0];
};

const autoGenerateTNA = (orderDate, exFactoryDate) => {
    return {
        materials: {
            fabric: {
                planned: addDays(orderDate, 2),
                actual: null,
                status: "pending",
            },
            button: {
                planned: addDays(orderDate, 3),
                actual: null,
                status: "pending",
            },
            zipper: {
                planned: addDays(orderDate, 4),
                actual: null,
                status: "pending",
            },
        },

        production: {
            cutting: {
                planned: addDays(orderDate, 6),
                actual: null,
                status: "pending",
            },
            sewing: {
                planned: addDays(orderDate, 8),
                actual: null,
                status: "pending",
            },
            finishing: {
                planned: addDays(orderDate, 10),
                actual: null,
                status: "pending",
            },
        },

        shipment: {
            planned: exFactoryDate,
            actual: null,
            status: "pending",
        },
    };
};


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

            // TNA-------------
            order.tna = autoGenerateTNA(order.orderDate, order.exFactoryDate)
            // create time---------
            order.createdAt = new Date().toISOString()

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