import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Worker from "../models/worker.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded;

    const Model = role === "user" ? User : Worker;
    const user = await Model.findById(id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    req.user.role = role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default auth;
