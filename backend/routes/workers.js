import express from "express";
const router = express.Router();

// Sample route: Get all workers (expand later)
router.get("/", (req, res) => {
  res.json({ message: "Worker route is working!" });
});

// You can add more routes here:
// router.post("/create", async (req, res) => { ... });
// router.put("/update/:id", async (req, res) => { ... });
// router.delete("/delete/:id", async (req, res) => { ... });

export default router; // ✅ default export
