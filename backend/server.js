import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js"; // Your existing user routes
import serviceRoutes from "./routes/serviceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS Configuration - Allow requests from your frontend
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // Vite default port and React fallback
  credentials: true, // Allow cookies if needed
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // Exit if database connection fails
  });

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use("/api", authRoutes); // Auth routes (register, login, google auth)
app.use("/api/user", userRoutes); // User-specific routes
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/workers", workerRoutes);

// Health Check Endpoint
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "Worker Management System API is running",
    timestamp: new Date().toISOString()
  });
});

// 404 Handler - Route not found
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found" 
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Create HTTP server and integrate Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Emit notification to worker when booking is created
const emitNewBookingNotification = (workerId, bookingData) => {
  io.to(workerId).emit('newBooking', {
    serviceTitle: bookingData.serviceTitle,
    userName: bookingData.userName,
    message: `New booking request for your service "${bookingData.serviceTitle}" from ${bookingData.userName}.`
  });
};

// Make io accessible in routes
app.set('io', io);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM received, shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  });
});
