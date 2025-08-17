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
    },
    examFee: {
      type: Number,
      required: true,
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
    timestamps: true,
  }
);

export const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
