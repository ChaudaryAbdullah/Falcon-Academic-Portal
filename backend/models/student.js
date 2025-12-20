import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Counter } from "./counter.js";

const studentSchema = mongoose.Schema(
  {
    img: {
      data: Buffer,
      contentType: String,
    },
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
    gender: {
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

// ============ COMPOUND UNIQUE INDEX ============
// Prevents duplicate entries with same DOB + Father CNIC combination
// This means: Same father cannot have two children with the same date of birth
studentSchema.index(
  { dob: 1, fatherCnic: 1 },
  {
    unique: true,
    name: "unique_dob_fatherCnic",
    background: true, // Create index in background (won't block other operations)
  }
);

// ============ PRE-SAVE MIDDLEWARE ============
studentSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.rollNumber) {
      const year = new Date().getFullYear().toString().slice(-2);
      const prefix = `${year}-F`;

      const counter = await Counter.findOneAndUpdate(
        { _id: prefix },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const nextNumber = String(counter.seq).padStart(4, "0");
      this.rollNumber = `${prefix}-${nextNumber}`;
    }

    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ============ PRE-VALIDATE MIDDLEWARE (Optional - Better Error Messages) ============
studentSchema.pre("validate", async function (next) {
  // Only check on new documents or when dob/fatherCnic is modified
  if (this.isNew || this.isModified("dob") || this.isModified("fatherCnic")) {
    try {
      const existingStudent = await mongoose.model("Student").findOne({
        dob: this.dob,
        fatherCnic: this.fatherCnic,
        _id: { $ne: this._id }, // Exclude current document (for updates)
      });

      if (existingStudent) {
        const error = new Error(
          `A student with the same Date of Birth and Father's CNIC already exists. ` +
            `Existing student: ${existingStudent.studentName} (Roll: ${existingStudent.rollNumber})`
        );
        error.name = "DuplicateStudentError";
        error.code = 11000; // MongoDB duplicate key error code
        return next(error);
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ============ ERROR HANDLING FOR DUPLICATE KEY ============
studentSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    // Check which field caused the duplicate error
    const keyPattern = error.keyPattern || {};

    if (keyPattern.dob && keyPattern.fatherCnic) {
      next(
        new Error(
          "A student with the same Date of Birth and Father's CNIC already exists. " +
            "This could be a duplicate entry."
        )
      );
    } else if (keyPattern.rollNumber) {
      next(new Error("Roll number already exists."));
    } else if (keyPattern.bform) {
      next(new Error("B-Form number already exists."));
    } else if (keyPattern.email) {
      next(new Error("Email already exists."));
    } else {
      next(new Error("Duplicate entry detected."));
    }
  } else {
    next(error);
  }
});

export const Student = mongoose.model("Student", studentSchema);
