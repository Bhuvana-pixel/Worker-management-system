import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    bookingDate: { type: String, required: true },
    bookingTime: { type: String, required: true },
    userAddress: { type: String, required: true },
    notes: { type: String },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    workerCompleted: { type: Boolean, default: false },
    userCompleted: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);