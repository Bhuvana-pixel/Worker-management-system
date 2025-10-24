import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  skill: {
    type: String,
    required: true,
  },
  location: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("Post", postSchema);
export default Post;
