import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
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
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        totalMarks: {
          type: Number,
          required: true,
        },
        obtainedMarks: {
          type: Number,
          default: 0,
        },
        passingMarks: {
          type: Number,
          required: true,
        },
        grade: {
          type: String,
          default: "",
        },
        remarks: {
          type: String,
          enum: ["Pass", "Fail", "Absent", "Pending", ""], // ADD "Pending" and "" here
          default: "", // Change default to empty string
        },
      },
    ],
    totalMarks: {
      type: Number,
      default: 0,
    },
    totalObtainedMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: "",
    },
    result: {
      type: String,
      enum: ["Pass", "Fail", "Pending"],
      default: "Pending",
    },
    position: {
      type: Number,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate total marks, percentage, grade, and result
resultSchema.pre("save", function (next) {
  // Calculate total marks
  this.totalMarks = this.subjects.reduce(
    (sum, subject) => sum + subject.totalMarks,
    0
  );

  // Calculate total obtained marks
  this.totalObtainedMarks = this.subjects.reduce(
    (sum, subject) => sum + subject.obtainedMarks,
    0
  );

  // Calculate percentage
  this.percentage =
    this.totalMarks > 0 ? (this.totalObtainedMarks / this.totalMarks) * 100 : 0;

  // Calculate overall grade
  this.grade = calculateGrade(this.percentage);

  // Determine pass/fail
  const hasFailedSubject = this.subjects.some(
    (subject) =>
      subject.obtainedMarks < subject.passingMarks &&
      subject.remarks !== "Absent"
  );

  const hasPendingSubject = this.subjects.some(
    (subject) => subject.remarks === "Pending" || subject.remarks === ""
  );

  if (hasPendingSubject) {
    this.result = "Pending";
  } else if (hasFailedSubject) {
    this.result = "Fail";
  } else {
    this.result = "Pass";
  }

  // Calculate individual subject grades
  this.subjects.forEach((subject) => {
    if (subject.obtainedMarks > 0) {
      const subjectPercentage =
        (subject.obtainedMarks / subject.totalMarks) * 100;
      subject.grade = calculateGrade(subjectPercentage);
    }
  });

  next();
});

// Helper function to calculate grade
function calculateGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

// Create indexes
resultSchema.index({ studentId: 1, examId: 1 }, { unique: true });
resultSchema.index({ examId: 1, class: 1, section: 1 });
resultSchema.index({ class: 1, section: 1 });

export const Result = mongoose.model("Result", resultSchema);
