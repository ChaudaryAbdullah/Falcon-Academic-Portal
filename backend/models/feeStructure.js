import mongoose from "mongoose";

const feeStructureSchema = mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
    },
    tutionFee: {
      type: Number,
      required: true,
      default: 0,
    },
    examFee: {
      type: Number,
      required: true,
      default: 0,
    },
    paperFund: {
      type: Number,
      required: true,
      default: 0,
    },
    miscFee: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
