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
        subjectCode: {
          type: String,
          default: "",
        },
        totalMarks: {
          type: Number,
          required: true,
          min: [0, "Total marks cannot be negative"],
        },
        obtainedMarks: {
          type: Number,
          default: null,
        },
        passingMarks: {
          type: Number,
          required: true,
          min: [0, "Passing marks cannot be negative"],
        },
        grade: {
          type: String,
          default: "",
        },
        remarks: {
          type: String,
          enum: ["Pass", "Fail", "Absent", "Pending", ""],
          default: "Pending",
        },
        isPassed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    subjectGroups: [
      {
        groupCode: {
          type: String,
          required: true,
        },
        groupName: {
          type: String,
          default: "",
        },
        totalMaxMarks: {
          type: Number,
          default: 0,
        },
        totalObtainedMarks: {
          type: Number,
          default: 0,
        },
        totalPassingMarks: {
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
        isPassed: {
          type: Boolean,
          default: false,
        },
        subjectCount: {
          type: Number,
          default: 1,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============ HELPER FUNCTIONS ============

function calculateGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function isMarksEntered(obtainedMarks) {
  return obtainedMarks !== null && obtainedMarks !== undefined;
}

// ============ PRE-SAVE MIDDLEWARE ============

resultSchema.pre("save", async function (next) {
  try {
    // Populate subject codes if needed
    if (this.subjects && this.subjects.length > 0) {
      const needsPopulation = this.subjects.some(
        (s) => !s.subjectCode && s.subjectId
      );

      if (needsPopulation) {
        const Subject = mongoose.model("Subject");
        const subjectIds = this.subjects
          .filter((s) => s.subjectId)
          .map((s) => s.subjectId);

        const subjectDocs = await Subject.find({
          _id: { $in: subjectIds },
        }).lean();

        const subjectMap = new Map(
          subjectDocs.map((s) => [s._id.toString(), s.subjectCode])
        );

        this.subjects.forEach((subject) => {
          if (subject.subjectId && !subject.subjectCode) {
            subject.subjectCode =
              subjectMap.get(subject.subjectId.toString()) || "";
          }
        });
      }
    }

    // ============ STEP 1: BUILD GROUPS FIRST ============
    // We need to know which subjects are grouped BEFORE processing
    const groupMap = new Map();

    this.subjects.forEach((subject) => {
      const code = subject.subjectCode || "UNKNOWN";

      if (!groupMap.has(code)) {
        groupMap.set(code, {
          groupCode: code,
          groupName: code,
          totalMaxMarks: 0,
          totalObtainedMarks: 0,
          totalPassingMarks: 0,
          subjectCount: 0,
          subjectIds: [],
          allMarksEntered: true,
          hasAbsent: false,
        });
      }

      const group = groupMap.get(code);
      group.totalMaxMarks += subject.totalMarks;
      group.totalPassingMarks += subject.passingMarks;
      group.subjectCount += 1;
      group.subjectIds.push(subject.subjectId.toString());

      if (isMarksEntered(subject.obtainedMarks)) {
        group.totalObtainedMarks += subject.obtainedMarks;
      } else {
        group.allMarksEntered = false;
      }

      if (subject.remarks === "Absent") {
        group.hasAbsent = true;
      }
    });

    // Create a set of subject codes that are GROUPED (more than 1 subject)
    const groupedSubjectCodes = new Set();
    groupMap.forEach((group, code) => {
      if (group.subjectCount > 1) {
        groupedSubjectCodes.add(code);
      }
    });

    // ============ STEP 2: PROCESS EACH SUBJECT ============
    this.subjects.forEach((subject) => {
      const isGroupedSubject = groupedSubjectCodes.has(subject.subjectCode);

      // Case 1: Subject marked as Absent
      if (subject.remarks === "Absent") {
        subject.isPassed = false;
        subject.grade = "F";
        return;
      }

      // Case 2: Marks NOT entered (null or undefined)
      if (!isMarksEntered(subject.obtainedMarks)) {
        subject.isPassed = false;
        subject.remarks = "Pending";
        subject.grade = "";
        return;
      }

      // Case 3: Marks ARE entered (including 0)
      let marks = subject.obtainedMarks;

      if (marks < 0) marks = 0;
      if (marks > subject.totalMarks) marks = subject.totalMarks;

      subject.obtainedMarks = roundToTwo(marks);

      // Calculate individual grade
      const subjectPercentage =
        subject.totalMarks > 0
          ? (subject.obtainedMarks / subject.totalMarks) * 100
          : 0;
      subject.grade = calculateGrade(subjectPercentage);

      // Determine individual Pass or Fail
      const individuallyPassed = subject.obtainedMarks >= subject.passingMarks;

      if (isGroupedSubject) {
        // For GROUPED subjects: individual pass/fail doesn't matter for overall result
        // We still show the individual status for display purposes
        subject.isPassed = individuallyPassed;
        subject.remarks = individuallyPassed ? "Pass" : "Fail";
        // But this will NOT affect the overall result - only group total will
      } else {
        // For NON-GROUPED subjects: individual pass/fail DOES matter
        subject.isPassed = individuallyPassed;
        subject.remarks = individuallyPassed ? "Pass" : "Fail";
      }
    });

    // ============ STEP 3: CALCULATE SUBJECT GROUPS ============
    this.subjectGroups = Array.from(groupMap.values()).map((group) => {
      // Recalculate obtained marks after processing
      let totalObtained = 0;
      let allEntered = true;
      let hasAbsent = false;

      this.subjects.forEach((subject) => {
        if (subject.subjectCode === group.groupCode) {
          if (isMarksEntered(subject.obtainedMarks)) {
            totalObtained += subject.obtainedMarks;
          } else {
            allEntered = false;
          }
          if (subject.remarks === "Absent") {
            hasAbsent = true;
          }
        }
      });

      const percentage =
        group.totalMaxMarks > 0
          ? (totalObtained / group.totalMaxMarks) * 100
          : 0;

      // Group is passed only if:
      // 1. All marks in group are entered
      // 2. No absent subjects
      // 3. Total obtained >= total passing
      const isPassed =
        allEntered && !hasAbsent && totalObtained >= group.totalPassingMarks;

      return {
        groupCode: group.groupCode,
        groupName: group.groupName,
        totalMaxMarks: roundToTwo(group.totalMaxMarks),
        totalObtainedMarks: roundToTwo(totalObtained),
        totalPassingMarks: roundToTwo(group.totalPassingMarks),
        percentage: roundToTwo(percentage),
        grade: allEntered ? calculateGrade(percentage) : "",
        isPassed: isPassed,
        subjectCount: group.subjectCount,
      };
    });

    // ============ STEP 4: CALCULATE OVERALL TOTALS ============
    this.totalMarks = roundToTwo(
      this.subjects.reduce((sum, subject) => sum + subject.totalMarks, 0)
    );

    this.totalObtainedMarks = roundToTwo(
      this.subjects.reduce((sum, subject) => {
        if (isMarksEntered(subject.obtainedMarks)) {
          return sum + subject.obtainedMarks;
        }
        return sum;
      }, 0)
    );

    this.percentage = roundToTwo(
      this.totalMarks > 0
        ? (this.totalObtainedMarks / this.totalMarks) * 100
        : 0
    );

    this.grade = calculateGrade(this.percentage);

    // ============ STEP 5: DETERMINE OVERALL RESULT ============
    // Using GROUPED LOGIC:
    // - For grouped subjects: only group total matters
    // - For non-grouped subjects: individual pass/fail matters

    let hasPending = false;
    let hasFailed = false;

    // Check each group
    this.subjectGroups.forEach((group) => {
      const isGrouped = group.subjectCount > 1;

      // Get subjects in this group
      const groupSubjects = this.subjects.filter(
        (s) => s.subjectCode === group.groupCode
      );

      // Check if all marks in group are entered
      const allMarksEntered = groupSubjects.every(
        (s) => isMarksEntered(s.obtainedMarks) || s.remarks === "Absent"
      );

      // Check for absent
      const hasAbsent = groupSubjects.some((s) => s.remarks === "Absent");

      if (!allMarksEntered) {
        hasPending = true;
      } else if (hasAbsent) {
        hasFailed = true;
      } else {
        if (isGrouped) {
          // GROUPED: Check group total only
          if (group.totalObtainedMarks < group.totalPassingMarks) {
            hasFailed = true;
          }
        } else {
          // NON-GROUPED: Check individual subject
          const subject = groupSubjects[0];
          if (subject.obtainedMarks < subject.passingMarks) {
            hasFailed = true;
          }
        }
      }
    });

    // ============ SET FINAL RESULT ============
    if (hasPending) {
      this.result = "Pending";
    } else if (hasFailed) {
      this.result = "Fail";
    } else {
      this.result = "Pass";
    }

    // Clear position if not passed
    if (this.result !== "Pass") {
      this.position = null;
    }

    console.log("Pre-save result calculation:", {
      totalMarks: this.totalMarks,
      totalObtainedMarks: this.totalObtainedMarks,
      percentage: this.percentage,
      hasPending,
      hasFailed,
      finalResult: this.result,
      subjectGroups: this.subjectGroups.map((g) => ({
        code: g.groupCode,
        count: g.subjectCount,
        obtained: g.totalObtainedMarks,
        passing: g.totalPassingMarks,
        isPassed: g.isPassed,
      })),
    });

    next();
  } catch (error) {
    console.error("Error in pre-save middleware:", error);
    next(error);
  }
});

// Virtual for grouped subjects
resultSchema.virtual("groupedSubjects").get(function () {
  const groups = {};

  this.subjects.forEach((subject) => {
    const code = subject.subjectCode || "UNKNOWN";
    if (!groups[code]) {
      groups[code] = {
        code,
        subjects: [],
        totalMaxMarks: 0,
        totalObtainedMarks: 0,
        totalPassingMarks: 0,
      };
    }

    groups[code].subjects.push(subject);
    groups[code].totalMaxMarks += subject.totalMarks;
    groups[code].totalObtainedMarks += isMarksEntered(subject.obtainedMarks)
      ? subject.obtainedMarks
      : 0;
    groups[code].totalPassingMarks += subject.passingMarks;
  });

  return Object.values(groups);
});

// Create indexes
resultSchema.index({ studentId: 1, examId: 1 }, { unique: true });
resultSchema.index({ examId: 1, class: 1, section: 1 });
resultSchema.index({ class: 1, section: 1 });
resultSchema.index({ "subjects.subjectCode": 1 });
resultSchema.index({ "subjectGroups.groupCode": 1 });

export const Result = mongoose.model("Result", resultSchema);
