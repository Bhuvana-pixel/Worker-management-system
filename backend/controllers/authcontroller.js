// backend/controllers/authcontroller.js

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import Worker from "../models/worker.js";

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const registerUser = async (req, res) => {
  try {
    const { email, password, name, mobile, location } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name, mobile, location });
    res.json({ success: true, message: "User registered", user });
  } catch {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user._id, "user");
    res.json({ success: true, message: "Login successful", token, user });
  } catch {
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const registerWorker = async (req, res) => {
  try {
    const { email, password, name, mobile, location, skills } = req.body;
    const existing = await Worker.findOne({ email });
    if (existing) return res.json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const worker = await Worker.create({ email, password: hashed, name, mobile, location, skills });
    res.json({ success: true, message: "Worker registered", worker });
  } catch {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const loginWorker = async (req, res) => {
  try {
    const { email, password } = req.body;
    const worker = await Worker.findOne({ email });
    if (!worker || !(await bcrypt.compare(password, worker.password))) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(worker._id, "worker");
    res.json({ success: true, message: "Login successful", token, worker });
  } catch {
    res.status(500).json({ success: false, message: "Login failed" });
  }
};
