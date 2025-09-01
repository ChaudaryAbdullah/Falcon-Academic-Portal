import mongoose from "mongoose";

const paperFundSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    year: {
      type: String,
      required: true,
    },
    paperFund: {
      type: Number,
      required: true,
      default: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    generatedDate: {
      type: Date,
      default: Date.now,
    },
    sentToWhatsApp: {
      type: Boolean,
      default: false,
    },
    paidDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const paperFund = mongoose.model("paperFund", paperFundSchema);
