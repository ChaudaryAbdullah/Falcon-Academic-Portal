import mongoose from "mongoose";

const examSchema = mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      trim: true,
    },
    examType: {
      type: String,
      enum: ["1st Term", "Mid Term", "Final Term"],
      required: true,
    },
    academicYear: {
      type: String,
      required: true, // e.g., "2024-2025"
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    classes: [
      {
        type: String,
        required: true,
      },
    ], // Classes for which this exam is conducted
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Exam = mongoose.model("Exam", examSchema);
