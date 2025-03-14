const {admin} = require('../admin');
const verifyUser = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        console.log(" No authorizaiton header provided");
        
        return res.status(403).json({ error: "Unauthorized" });
    }

    const token = authorization.split("Bearer ")[1];
    if (!token) {
        console.log(" No token provided");
        return res.status(403).json({ error: "Unauthorized" });
    }

    admin.auth().verifyIdToken(token)
        .then((decodedToken) => {
            console.log(" Decoded Token:", decodedToken);
            
            req.user = decodedToken;
            return next();
        })
        .catch((error) => {
            console.error("🔥 Error verifying token:", error);
            return res.status(403).json({ error: "Unauthorized" });
        });
};

module.exports = verifyUser;