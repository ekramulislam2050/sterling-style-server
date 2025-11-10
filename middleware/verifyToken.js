const jwt = require('jsonwebtoken');

// verify token-----------
const verifyToken = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).send("unAuthorized")
        }
        const token = req.headers.authorization.split(" ")[1]
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).send("forbidden")
            }
            req.email = decoded.email
            req.decoded = decoded
            next()
        })
    } catch (err) {
        console.log(err)
        res.status(500).send("server error while verifying token")
    }

}

module.exports=verifyToken