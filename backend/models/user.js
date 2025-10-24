// backend/models/user.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String },
  location: { type: String },
  gender: { type: String, enum: ["male", "female", "other"] },
  area: { type: String },
  district: { type: String },
  profilePicture: { type: String, default: "" },
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
