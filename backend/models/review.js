import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
