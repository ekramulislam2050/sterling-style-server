const jwt = require("jsonwebtoken")
const express=require("express")
const router=express.Router()



// api-----------
router.post("/jwt", async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).send({ error: "email require" })
        }
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" })
        res.send({ token })
    } catch (err) {
        res.status(500).send({ error: "Internal server error" })
    }
})

module.exports=router