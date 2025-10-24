import express from "express";
import multer from "multer";
import path from "path";
import Booking from "../models/booking.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
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

// Get bookings for a user
router.get("/bookings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ userId })
      .populate("workerId", "name location")
      .populate("serviceId");
    res.json({ success: true, bookings });
  } catch (err) {
    console.error("User booking fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
});

// Get notifications for a user
router.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    console.error("User notifications fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// Update user profile with file upload
router.put("/profile", upload.single('profilePicture'), async (req, res) => {
  try {
    const { userId } = req.body; // Assuming userId is sent in body or from auth middleware
    const updateData = { ...req.body };

    // If a file was uploaded, add the filename to the update data
    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("User profile update error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

// Other routes here (payments, profile, update, delete)...

export default router;
