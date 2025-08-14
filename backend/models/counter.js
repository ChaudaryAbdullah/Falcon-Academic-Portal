// models/counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  }, // e.g., "25-F"
  seq: {
    type: Number,
    default: 0,
  },
});

export const Counter = mongoose.model("Counter", counterSchema);
