const express = require("express");

module.exports = (db) => {
    const router = express.Router();
    const attendanceCollection = db.collection("attendance");

    router.get("/", async (req, res) => {
             try{
                const result=await attendanceCollection.find({}).toArray()
                res.send(result)

             }catch(err){

             }
    });

    return router;
};