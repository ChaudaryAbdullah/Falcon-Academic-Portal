import mongoose from "mongoose";

const discountSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    discount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const StudentDiscount = mongoose.model(
  "StudentDiscount",
  discountSchema
);
