import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Counter } from "./counter.js";

const studentSchema = mongoose.Schema(
  {
    rollNumber: {
      type: String,
      unique: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    bform: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherCnic: {
      type: String,
      required: true,
      trim: true,
    },
    fatherOccupation: {
      type: String,
      required: true,
      trim: true,
    },
    motherName: {
      type: String,
      trim: true,
    },
    motherOccupation: {
      type: String,
      trim: true,
    },
    motherCnic: {
      type: String,
      trim: true,
    },
    fPhoneNumber: {
      type: String,
      minlength: 11,
      maxlength: 11,
      required: true,
      trim: true,
    },
    mPhoneNumber: {
      type: String,
      maxlength: 11,
      trim: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: { type: String, minlength: 8, maxlength: 16 },
  },
  { timestamps: true }
);

// Auto-generate roll number atomically
studentSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.rollNumber) {
      const year = new Date().getFullYear().toString().slice(-2); // e.g. "25"
      const prefix = `${year}-F`;

      // Atomic increment in Counter collection
      const counter = await Counter.findOneAndUpdate(
        { _id: prefix },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const nextNumber = String(counter.seq).padStart(4, "0");
      this.rollNumber = `${prefix}-${nextNumber}`;
    }

    // Hash password if modified or new
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create indexes manually (run this once)
// studentSchema.index({ rollNumber: 1 }, { unique: true, sparse: false });
// studentSchema.index({ bform: 1 }, { unique: true });
// studentSchema.index({ email: 1 }, { unique: true });

export const Student = mongoose.model("Student", studentSchema);
