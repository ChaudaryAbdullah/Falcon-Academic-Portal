import mongoose from "mongoose";

const feeSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true, // Index for fast student lookups
    },
    month: {
      type: String,
      required: true,
      index: true, // Index for month filtering
    },
    year: {
      type: String,
      required: true,
      index: true, // Index for year filtering
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
    remainingBalance: {
      type: Number,
      default: 0,
      index: true, // Index for payment queries
    },
    dueDate: {
      type: Date,
      required: true,
      index: true, // Index for overdue queries
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
      index: true, // Index for status filtering
    },
    generatedDate: {
      type: Date,
      default: Date.now,
      index: true, // Index for date-based queries
    },
    sentToWhatsApp: {
      type: Boolean,
      default: false,
      index: true, // Index for WhatsApp filter
    },
    paidDate: {
      type: Date,
      default: null,
      index: true, // Index for payment date queries
    },
  },
  {
    timestamps: true,
  },
);

// ============ COMPOUND INDEXES FOR COMMON QUERIES ============

// Unique constraint: one fee per student per month/year
feeSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

// Common filter combination: status + year + month
feeSchema.index({ status: 1, year: 1, month: 1 });

// Date range queries (for reports)
feeSchema.index({ generatedDate: 1, status: 1 });
feeSchema.index({ paidDate: 1, status: 1 });

// Student pending fees lookup
feeSchema.index({ studentId: 1, status: 1, year: 1, month: 1 });

// Overdue fee detection
feeSchema.index({ status: 1, dueDate: 1 });

// WhatsApp notification queries
feeSchema.index({ sentToWhatsApp: 1, status: 1, generatedDate: 1 });

// ============ PRE-SAVE MIDDLEWARE ============

feeSchema.pre("save", function (next) {
  // Calculate base fees
  const baseFees =
    (this.tutionFee || 0) + (this.examFee || 0) + (this.miscFee || 0);

  // Subtract discount
  this.totalAmount = baseFees - (this.discount || 0);

  // Ensure total amount is never negative
  this.totalAmount = Math.max(0, this.totalAmount);

  // Set remaining balance to total amount if not set and status is not paid
  if (
    (this.remainingBalance === 0 || this.remainingBalance === undefined) &&
    this.status !== "paid"
  ) {
    this.remainingBalance = this.totalAmount;
  }

  // If status is paid, remaining balance should be 0
  if (this.status === "paid") {
    this.remainingBalance = 0;
  }

  next();
});

// ============ INSTANCE METHODS ============

feeSchema.methods.markAsPaid = function () {
  this.status = "paid";
  this.remainingBalance = 0;
  this.paidDate = new Date();
  return this.save();
};

feeSchema.methods.applyPartialPayment = function (amount) {
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  const currentBalance = this.remainingBalance || this.totalAmount;

  if (amount > currentBalance) {
    throw new Error("Payment amount exceeds remaining balance");
  }

  this.remainingBalance = Math.max(0, currentBalance - amount);

  if (this.remainingBalance === 0) {
    this.status = "paid";
    this.paidDate = new Date();
  }

  return this.save();
};

// ============ STATIC METHODS ============

feeSchema.statics.findPendingByStudent = function (studentId) {
  return this.find({
    studentId,
    status: { $in: ["pending", "overdue"] },
  }).sort({ year: 1, month: 1 });
};

feeSchema.statics.findOverdue = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    status: "pending",
    dueDate: { $lt: today },
  });
};

feeSchema.statics.getTotalOutstanding = async function (studentId) {
  const result = await this.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId),
        status: { $in: ["pending", "overdue"] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$remainingBalance" },
      },
    },
  ]);

  return result[0]?.total || 0;
};

feeSchema.statics.getMonthlyStats = async function (year, month) {
  return this.aggregate([
    {
      $match: {
        year: year.toString(),
        month: month,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        collected: {
          $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0] },
        },
      },
    },
  ]);
};

// ============ QUERY HELPERS ============

feeSchema.query.pending = function () {
  return this.where({ status: "pending" });
};

feeSchema.query.paid = function () {
  return this.where({ status: "paid" });
};

feeSchema.query.overdue = function () {
  return this.where({ status: "overdue" });
};

feeSchema.query.byMonth = function (month, year) {
  return this.where({ month, year: year.toString() });
};

feeSchema.query.byDateRange = function (startDate, endDate) {
  return this.where({
    generatedDate: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

export const Fee = mongoose.model("Fee", feeSchema);
