import mongoose from "mongoose";

const feeSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
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
    arrears: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
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

// Ensure one fee record per student per month
feeSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

// Pre-save middleware to calculate total amount including arrears and discount
feeSchema.pre("save", function (next) {
  // Calculate base fees
  const baseFees =
    (this.tutionFee || 0) +
    (this.examFee || 0) +
    (this.paperFund || 0) +
    (this.miscFee || 0);

  // Add arrears and subtract discount
  this.totalAmount = baseFees + (this.arrears || 0) - (this.discount || 0);

  // Ensure total amount is never negative
  this.totalAmount = Math.max(0, this.totalAmount);

  next();
});

export const Fee = mongoose.model("Fee", feeSchema);
