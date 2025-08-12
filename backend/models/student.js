import mongoose from "mongoose";

const studentSchema = mongoose.Schema(
  {
    rollNumber: {
      type: String,
      unique: true,
      sparse: false,
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
    class: {
      type: Number,
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
      required: true,
      trim: true,
    },
    motherOccupation: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      minlength: 11,
      maxlength: 11,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Convert to lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      minlength: 8,
      maxlength: 16,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate roll number before saving
studentSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.rollNumber) {
      const year = new Date().getFullYear().toString().slice(-2); // e.g. "25"

      // Use this.constructor instead of mongoose.model("Student")
      const Student = this.constructor;
      const count = await Student.countDocuments({
        rollNumber: { $regex: `^${year}-F-` },
      });

      console.log(`Current count for year ${year}:`, count);

      // Increment count to get new number
      const nextNumber = String(count + 1).padStart(4, "0"); // e.g. "0001"

      this.rollNumber = `${year}-F-${nextNumber}`;
      console.log("Generated roll number:", this.rollNumber);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Create indexes manually (run this once)
// studentSchema.index({ rollNumber: 1 }, { unique: true, sparse: false });
// studentSchema.index({ bform: 1 }, { unique: true });
// studentSchema.index({ email: 1 }, { unique: true });

export const Student = mongoose.model("Student", studentSchema);
