// backend/routes/serviceRoutes.js
import express from "express";
import Service from "../models/service.js";
import Worker from "../models/worker.js";

const router = express.Router();

// POST /api/services - Create new service
router.post("/", async (req, res) => {
  try {
    // Validate location coordinates
    if (!req.body.location || !req.body.location.coordinates || req.body.location.coordinates.length !== 2 ||
        typeof req.body.location.coordinates[0] !== 'number' || typeof req.body.location.coordinates[1] !== 'number' ||
        isNaN(req.body.location.coordinates[0]) || isNaN(req.body.location.coordinates[1])) {
      return res.status(400).json({ success: false, message: "Invalid location coordinates. Must be an array of two valid numbers [longitude, latitude]." });
    }

    const service = new Service(req.body);
    await service.save();
    res.json({ success: true, message: "Service added successfully", service });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/services/:id - Update service
router.put("/:id", async (req, res) => {
  try {
    // Validate location coordinates if provided
    if (req.body.location && req.body.location.coordinates) {
      if (req.body.location.coordinates.length !== 2 ||
          typeof req.body.location.coordinates[0] !== 'number' || typeof req.body.location.coordinates[1] !== 'number' ||
          isNaN(req.body.location.coordinates[0]) || isNaN(req.body.location.coordinates[1])) {
        return res.status(400).json({ success: false, message: "Invalid location coordinates. Must be an array of two valid numbers [longitude, latitude]." });
      }
    }

    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, message: "Service updated successfully", service });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/services/:id - Delete service
router.delete("/:id", async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/services/worker/:workerId - Fetch services for a specific worker
router.get("/worker/:workerId", async (req, res) => {
  try {
    const services = await Service.find({ workerId: req.params.workerId });
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/services - Fetch all available services
router.get("/", async (req, res) => {
  try {
    const { category, location, search } = req.query;
    let query = { availability: "available" };

    if (category) query.category = category;
    if (location) query.workerLocation = { $regex: location, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { workerName: { $regex: search, $options: "i" } }
      ];
    }

    const services = await Service.find(query)
      .populate("workerId", "name location email mobile")
      .sort({ createdAt: -1 });

    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ ES Module export
export default router;
