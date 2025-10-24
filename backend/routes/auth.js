// backend/routes/auth.js

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import { sendOtpEmail } from "../utils/sentOtp.js";
import User from "../models/user.js";
import Worker from "../models/worker.js";

const router = express.Router();

// Initialize Google OAuth client with your Client ID
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to get the correct model based on role
const getModelByRole = (role) => {
  if (role === "worker") return Worker;
  if (role === "user") return User;
  return null;
};

// Generate JWT token for authenticated users
const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Configure multer for profile picture uploads
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.params.role}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Traditional email/password registration
router.post("/register/:role", upload.single('profilePicture'), async (req, res) => {
  try {
    const { role } = req.params;
    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ success: false, message: "Invalid role" });

    const existing = await Model.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const userData = { ...req.body, password: hashedPassword };

    // If a file was uploaded, add the filename to the user data
    if (req.file) {
      userData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const newUser = new Model(userData);
    await newUser.save();

    res.status(201).json({ success: true, message: "Registered successfully", [role]: newUser });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Traditional email/password login
router.post("/login/:role", upload.none(), async (req, res) => {
  try {
    const { role } = req.params;
    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ success: false, message: "Invalid role" });

    const user = await Model.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ success: false, message: "Account not found" });

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect password" });

    const token = generateToken(user._id, role);

    res.json({ success: true, message: "Login successful", token, [role]: user });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// Google OAuth authentication endpoint
router.post("/auth/google/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const { credential } = req.body; // The JWT token from Google

    // Validate role
    const Model = getModelByRole(role);
    if (!Model) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    // Verify the Google token with Google's servers
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Extract user information from the verified token
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    console.log("Google user verified:", { email, name, googleId });

    // Check if user already exists in database
    let user = await Model.findOne({ email });

    if (user) {
      // User exists - update Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      console.log("Existing user found:", user);
    } else {
      // New user - create account with Google information
      // Generate a random password (won't be used, but required by schema)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      user = new Model({
        email,
        name,
        password: randomPassword, // Random password for Google users
        googleId, // Store Google ID for future reference
        profilePicture: picture || "", // Store Google profile picture
        // Default values for optional fields
        mobile: "",
        location: "",
      });

      await user.save();
      console.log("New Google user created:", user);
    }

    // Generate JWT token for the application
    const token = generateToken(user._id, role);

    // Return success response with user data and token
    res.json({
      success: true,
      message: "Google authentication successful",
      token,
      [role]: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        location: user.location,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    
    // Handle specific error cases
    if (err.message.includes("Token used too late")) {
      return res.status(401).json({ 
        success: false, 
        message: "Google token expired. Please try again." 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Google authentication failed. Please try again." 
    });
  }
});

// Email transporter for sending OTP (keeping for backward compatibility if needed elsewhere)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// In-memory store for OTPs (use Redis or DB in production)
const otpStore = new Map();

// Forgot password endpoint - sends OTP
router.post("/forgot-password/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const { email } = req.body;

    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ success: false, message: "Invalid role" });

    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Email not found" });

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in .env");
      return res.status(500).json({ success: false, message: "Email service not configured" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with email (expires in 10 minutes)
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000, role });

    // Send OTP via email using the utility function
    await sendOtpEmail(email, otp, role);

    res.json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ success: false, message: "Failed to process request" });
  }
});

// Reset password with OTP
router.post("/reset-password/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const { email, otp, newPassword } = req.body;

    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ success: false, message: "Invalid role" });

    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp || stored.expires < Date.now() || stored.role !== role) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await Model.findOneAndUpdate({ email }, { password: hashedPassword });

    // Remove OTP
    otpStore.delete(email);

    res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
});

export default router;
