import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true }, // generic recipient (user or worker)
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
