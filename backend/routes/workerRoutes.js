import express from "express";
import multer from "multer";
import path from "path";
import Booking from "../models/booking.js";
import Post from "../models/Post.js";
import Worker from "../models/worker.js";
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
    cb(null, 'worker-' + uniqueSuffix + path.extname(file.originalname));
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

// 📦 Get bookings for a worker
router.get("/bookings/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const bookings = await Booking.find({ workerId }).populate("userId", "name email").populate("serviceId", "title price");
    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Booking fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
});

// Get notifications for a worker
router.get("/notifications/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const notifications = await Notification.find({ recipientId: workerId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    console.error("Worker notifications fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});



// ❌ Reject booking
router.patch("/bookings/reject/:id", async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    res.json({ success: true, booking: updated });
  } catch (err) {
    console.error("Booking reject error:", err);
    res.status(500).json({ success: false, message: "Failed to reject booking" });
  }
});

// 🛠️ Add a new post
router.post("/post", async (req, res) => {
  try {
    const { workerId, title, description, skill, location } = req.body;
    const post = new Post({ workerId, title, description, skill, location });
    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    console.error("Post creation error:", err);
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
});

// 📄 Get all posts (public view)
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().populate("workerId", "name location");
    res.json(posts);
  } catch (err) {
    console.error("Post fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
});

// 👤 Get posts by worker
router.get("/posts/:workerId", async (req, res) => {
  try {
    const posts = await Post.find({ workerId: req.params.workerId });
    res.json(posts);
  } catch (err) {
    console.error("Worker post fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch worker posts" });
  }
});

// 🗑️ Delete post
router.delete("/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    console.error("Post deletion error:", err);
    res.status(500).json({ success: false, message: "Failed to delete post" });
  }
});

// 🔄 Update worker status
router.patch("/status/:id", async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, worker });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

// 📄 Get worker profile
router.get("/profile/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }
    res.json({ success: true, worker });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch worker profile" });
  }
});

// Update worker profile with file upload
router.put("/profile", upload.single('profilePicture'), async (req, res) => {
  try {
    const { workerId } = req.body; // Assuming workerId is sent in body or from auth middleware
    const updateData = { ...req.body };

    // If a file was uploaded, add the filename to the update data
    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const updatedWorker = await Worker.findByIdAndUpdate(workerId, updateData, { new: true });
    if (!updatedWorker) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }
    res.json({ success: true, worker: updatedWorker });
  } catch (err) {
    console.error("Worker profile update error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

// ✏️ Update profile (user or worker)
router.patch("/:role/update/:id", async (req, res) => {
  const { role, id } = req.params;
  const Model = role === "user" ? User : Worker;

  try {
    const updated = await Model.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, [role]: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

export default router;
