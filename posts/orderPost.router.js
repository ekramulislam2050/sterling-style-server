const express = require("express")

const addDays = (date, day) => {
    const d = new Date(date);
    d.setDate(d.getDate() + day);
    return d.toISOString().split("T")[0];
};

const autoGenerateTNA = (orderDate, exFactoryDate, orderQty) => {
    return {
        materials: {
            fabric: { plannedDate: addDays(orderDate, 2), actualDate: null, plannedQty: orderQty, actualQty: 0, status: "pending" },
            button: { plannedDate: addDays(orderDate, 3), actualDate: null, plannedQty: orderQty, actualQty: 0, status: "pending" },
            zipper: { plannedDate: addDays(orderDate, 4), actualDate: null, plannedQty: orderQty, actualQty: 0, status: "pending" },
        },
        inventory: {   
            fabric: { receivedQty: 0, issuedQty: 0 },
            button: { receivedQty: 0, issuedQty: 0 },
            zipper: { receivedQty: 0, issuedQty: 0 }
        },
        production: {
            cutting: { plannedDate: addDays(orderDate, 6), actualDate: null, plannedQty: orderQty, actualQty: 0, status: "pending", remarks: "" },
            sewing: { plannedDate: addDays(orderDate, 8), actualDate: null, plannedQty: orderQty, actualQty: 0, status: "pending", remarks: "" },
            finishing: { plannedDate: addDays(orderDate, 10), actualDate: null, plannedQty: orderQty, actualQty: 0, status: "pending", remarks: "" },
        },
        shipment: {
            plannedDate: exFactoryDate,
            actualDate: null,
            shippedQty: 0,
            status: "pending",
            remarks: ""
        },
    };
};

// orders related api----------
module.exports = (db) => {
    const router = express.Router()
    const collectionOfOrders = db.collection("orders")
    router.post("/", async (req, res) => {
        try {
            const order = req.body;

            if (new Date(order.exFactoryDate) < new Date(order.orderDate)) {
                return res.status(400).json({ message: "Ex-factory date cannot be before order date" });
            }

            // TNA generation with orderQty
            order.tna = autoGenerateTNA(order.orderDate, order.exFactoryDate, order.orderQty);

            order.createdAt = new Date().toISOString();

            const result = await collectionOfOrders.insertOne(order);
            res.send(result);
        } catch (err) {
            res.status(500).json({ message: "Failed to create order", error: err.message });
        }
    });
    return router
}