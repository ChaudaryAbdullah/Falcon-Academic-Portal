import mongoose from "mongoose";

const feeSchema = mongoose.Schema(
  {
    // Link to the student who is paying this fee
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true, // One fee record per student per month
    },

    // Fee Period
    month: {
      type: String,
      required: true,
      unique: true, // One record per month
    },
    year: {
      type: String,
      required: true,
    },

    // Fee Components
    tutionFee: {
      type: Number,
      required: true,
    },
    examFee: {
      type: Number,
      required: true,
      unique: true, // If each exam fee record is unique
    },
    paperFund: {
      type: Number,
      required: true,
    },
    miscFee: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export const Fee = mongoose.model("Fee", feeSchema);
