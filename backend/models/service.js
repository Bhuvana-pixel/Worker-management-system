import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: { type: String, required: true },
  userImage: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now},
});

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, lowercase: true },
    price: { type: Number, required: true, min: 0 },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    workerName: { type: String, required: true },
    workerLocation: { type: String },
    workerPhone: { type: String },
    workerRating: { type: Number, default: 0 },
    district: { type: String, required: true },
    state: { type: String },
    city: { type: String },
    tags: [{ type: String }],
    images: [{ type: String }],
    duration: { type: Number, default: 60 }, // in minutes
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
      address: { type: String },
    },
    availability: { type: String, enum: ["available", "busy"], default: "available" },
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviews: [reviewSchema],
    viewCount: { type: Number, default: 0 },
    bookedCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes
serviceSchema.index({ location: "2dsphere" }); // For geospatial queries
serviceSchema.index({ title: "text", description: "text", workerName: "text" }); // For text search
serviceSchema.index({ category: 1, district: 1, isActive: 1 }); // For filtering
serviceSchema.index({ createdAt: -1 }); // For sorting by creation date

// Instance methods
serviceSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

// Static methods
serviceSchema.statics.getFeatured = async function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ averageRating: -1, viewCount: -1 })
    .limit(limit)
    .populate("workerId", "name rating");
};

serviceSchema.statics.getTrending = async function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ bookedCount: -1, viewCount: -1 })
    .limit(limit)
    .populate("workerId", "name rating");
};

// Pre-save middleware to update averageRating
serviceSchema.pre("save", function (next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;
