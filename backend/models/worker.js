import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String },
  location: { type: String },
  gender: { type: String, enum: ["male", "female", "other"] },
  area: { type: String },
  district: { type: String },
  skills: { type: [String], default: [] },
  profilePicture: { type: String, default: "" },
  status: { type: String, enum: ["in", "out"], default: "in" },
  role: { type: String, default: "worker" }
}, { timestamps: true });

export default mongoose.model("Worker", workerSchema);
