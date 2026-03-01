import jwt from "jsonwebtoken";
import dotenv from "dotenv";
 const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. No token provided" });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid Token format use: Bearer <token>",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token expires. Please login again" });
    }

    return res.status(403).json({ success: false, message: "Invalid Token" });
  }
};

export default authMiddleware