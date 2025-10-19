import mongoose from "mongoose";

const classSubjectSchema = mongoose.Schema(
  {
    class: {
      type: String,
      required: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    academicYear: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one mapping per class per academic year
classSubjectSchema.index({ class: 1, academicYear: 1 }, { unique: true });

export const ClassSubject = mongoose.model("ClassSubject", classSubjectSchema);
