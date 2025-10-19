import { Result } from "../models/result.js";
import { Exam } from "../models/exam.js";
import { Subject } from "../models/subject.js";
import { Student } from "../models/student.js";
import mongoose from "mongoose";

// Create Single Result
export const createResult = async (req, res) => {
  try {
    const result = await Result.create(req.body);
    const populatedResult = await Result.findById(result._id)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode");

    res.status(201).json({ success: true, data: populatedResult });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Results
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find({})
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Create Results for a Class
export const bulkCreateResults = async (req, res) => {
  try {
    const { examId, class: className, section, subjects } = req.body;

    console.log("Bulk create request:", {
      examId,
      className,
      section,
      subjectCount: subjects?.length,
    });

    // Validate required fields
    if (
      !examId ||
      !className ||
      !section ||
      !subjects ||
      subjects.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Exam ID, class, section, and subjects are required",
      });
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    // Validate exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Get all students in the class
    const students = await Student.find({
      class: className,
      section: section,
    });

    console.log(`Query: class=${className}, section=${section}`);
    console.log(`Found ${students.length} students in database`);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No students found in database with class="${className}" and section="${section}". Please check if the class/section values match exactly.`,
      });
    }

    const results = [];
    const errors = [];

    for (const student of students) {
      try {
        console.log(
          `Processing student: ${student.studentName} (${student.class}-${student.section})`
        );

        // Check if result already exists
        const existingResult = await Result.findOne({
          studentId: student._id,
          examId: new mongoose.Types.ObjectId(examId),
        });

        if (existingResult) {
          console.log(
            `Result already exists for student ${student.studentName}`
          );
          errors.push({
            studentId: student._id.toString(),
            studentName: student.studentName,
            message: "Result already exists for this exam",
          });
          continue;
        }

        // Create result with empty marks (to be filled later)
        const resultData = {
          studentId: student._id,
          examId: new mongoose.Types.ObjectId(examId),
          class: className,
          section: section,
          subjects: subjects.map((subject) => ({
            subjectId: new mongoose.Types.ObjectId(subject.subjectId),
            obtainedMarks: 0,
            totalMarks: subject.totalMarks || 100,
            passingMarks: subject.passingMarks || 40,
            grade: "",
            remarks: "Pending",
          })),
          result: "Pending",
        };

        const newResult = await Result.create(resultData);
        const populatedResult = await Result.findById(newResult._id)
          .populate(
            "studentId",
            "studentName fatherName rollNumber class section"
          )
          .populate("examId", "examName examType academicYear")
          .populate("subjects.subjectId", "subjectName subjectCode");

        results.push(populatedResult);
        console.log(`Created result for student ${student.studentName}`);
      } catch (error) {
        console.error(
          `Error creating result for student ${student.studentName}:`,
          error
        );
        errors.push({
          studentId: student._id.toString(),
          studentName: student.studentName,
          message: error.message,
        });
      }
    }

    console.log(`Successfully created ${results.length} results`);
    console.log(`Failed to create ${errors.length} results`);

    res.status(201).json({
      success: true,
      message: `Created ${results.length} result records`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in bulkCreateResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update Result (Enter Marks)
export const updateResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Bulk Update Results (Enter marks for multiple students)
export const bulkUpdateResults = async (req, res) => {
  try {
    const { results } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No results provided",
      });
    }

    const updatedResults = [];
    const errors = [];

    for (const resultData of results) {
      try {
        // Validate resultId
        if (!mongoose.Types.ObjectId.isValid(resultData.resultId)) {
          errors.push({
            resultId: resultData.resultId,
            message: "Invalid result ID format",
          });
          continue;
        }

        const result = await Result.findById(resultData.resultId);

        if (!result) {
          errors.push({
            resultId: resultData.resultId,
            message: "Result not found",
          });
          continue;
        }

        // Update subject marks
        if (resultData.subjects && Array.isArray(resultData.subjects)) {
          resultData.subjects.forEach((subjectData) => {
            const subjectIndex = result.subjects.findIndex(
              (s) => s.subjectId.toString() === subjectData.subjectId
            );

            if (subjectIndex !== -1) {
              result.subjects[subjectIndex].obtainedMarks =
                subjectData.obtainedMarks;
              result.subjects[subjectIndex].remarks =
                subjectData.remarks || "Pass";
            }
          });
        }

        await result.save();

        const populatedResult = await Result.findById(result._id)
          .populate(
            "studentId",
            "studentName fatherName rollNumber class section"
          )
          .populate("examId", "examName examType academicYear")
          .populate("subjects.subjectId", "subjectName subjectCode");

        updatedResults.push(populatedResult);
      } catch (error) {
        console.error(`Error updating result ${resultData.resultId}:`, error);
        errors.push({
          resultId: resultData.resultId,
          message: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updatedResults.length} results`,
      data: updatedResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in bulkUpdateResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Results by Exam and Class
export const getResultsByExamAndClass = async (req, res) => {
  try {
    const { examId, class: className, section } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    // Validate examId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = { examId: new mongoose.Types.ObjectId(examId) };
    if (className) query.class = className;
    if (section) query.section = section;

    const results = await Result.find(query)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode totalMarks")
      .sort({ class: 1, section: 1, position: 1 });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error in getResultsByExamAndClass:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Student Results (All Exams)
export const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const results = await Result.find({ studentId })
      .populate("examId", "examName examType academicYear startDate")
      .populate("subjects.subjectId", "subjectName subjectCode")
      .sort({ createdAt: -1 });

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No results found for this student",
      });
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error in getStudentResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Result by ID
export const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Calculate and Update Positions for an Exam
export const calculatePositions = async (req, res) => {
  try {
    const { examId, class: className, section } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    // Validate examId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = {
      examId: new mongoose.Types.ObjectId(examId),
      result: "Pass",
    };
    if (className) query.class = className;
    if (section) query.section = section;

    // Get all passed results sorted by percentage (highest first)
    const results = await Result.find(query).sort({
      percentage: -1,
      totalObtainedMarks: -1,
    });

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No passed results found for position calculation",
      });
    }

    // Update positions
    const updatedResults = [];
    for (let i = 0; i < results.length; i++) {
      results[i].position = i + 1;
      await results[i].save();
      updatedResults.push(results[i]);
    }

    res.status(200).json({
      success: true,
      message: `Updated positions for ${results.length} students`,
      data: updatedResults,
    });
  } catch (error) {
    console.error("Error in calculatePositions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Publish Results
export const publishResults = async (req, res) => {
  try {
    const { examId, class: className, section } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    // Validate examId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = { examId: new mongoose.Types.ObjectId(examId) };
    if (className) query.class = className;
    if (section) query.section = section;

    const result = await Result.updateMany(query, {
      isPublished: true,
      publishedDate: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Published ${result.modifiedCount} results`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error) {
    console.error("Error in publishResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Unpublish Results
export const unpublishResults = async (req, res) => {
  try {
    const { examId, class: className, section } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    const query = { examId };
    if (className) query.class = className;
    if (section) query.section = section;

    const result = await Result.updateMany(query, {
      isPublished: false,
      publishedDate: null,
    });

    res.status(200).json({
      success: true,
      message: `Unpublished ${result.modifiedCount} results`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in unpublishResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Class Performance Report
export const getClassPerformanceReport = async (req, res) => {
  try {
    const { examId, class: className, section } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    // Validate examId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const matchQuery = { examId: new mongoose.Types.ObjectId(examId) };
    if (className) matchQuery.class = className;
    if (section) matchQuery.section = section;

    const report = await Result.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $group: {
          _id: {
            class: "$class",
            section: "$section",
          },
          totalStudents: { $sum: 1 },
          passedStudents: {
            $sum: { $cond: [{ $eq: ["$result", "Pass"] }, 1, 0] },
          },
          failedStudents: {
            $sum: { $cond: [{ $eq: ["$result", "Fail"] }, 1, 0] },
          },
          pendingStudents: {
            $sum: { $cond: [{ $eq: ["$result", "Pending"] }, 1, 0] },
          },
          averagePercentage: { $avg: "$percentage" },
          highestPercentage: { $max: "$percentage" },
          lowestPercentage: { $min: "$percentage" },
          totalMarks: { $first: "$totalMarks" },
          averageObtained: { $avg: "$totalObtainedMarks" },
        },
      },
      {
        $project: {
          _id: 0,
          class: "$_id.class",
          section: "$_id.section",
          totalStudents: 1,
          passedStudents: 1,
          failedStudents: 1,
          pendingStudents: 1,
          passPercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$passedStudents", "$totalStudents"] },
                  100,
                ],
              },
              2,
            ],
          },
          averagePercentage: { $round: ["$averagePercentage", 2] },
          highestPercentage: { $round: ["$highestPercentage", 2] },
          lowestPercentage: { $round: ["$lowestPercentage", 2] },
          totalMarks: 1,
          averageObtained: { $round: ["$averageObtained", 2] },
        },
      },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error in getClassPerformanceReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Subject-wise Performance Analysis
export const getSubjectWisePerformance = async (req, res) => {
  try {
    const { examId, class: className, section } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    // Validate examId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const matchQuery = { examId: new mongoose.Types.ObjectId(examId) };
    if (className) matchQuery.class = className;
    if (section) matchQuery.section = section;

    const report = await Result.aggregate([
      { $match: matchQuery },
      { $unwind: "$subjects" },
      {
        $lookup: {
          from: "subjects",
          localField: "subjects.subjectId",
          foreignField: "_id",
          as: "subjectDetails",
        },
      },
      { $unwind: "$subjectDetails" },
      {
        $group: {
          _id: "$subjects.subjectId",
          subjectName: { $first: "$subjectDetails.subjectName" },
          subjectCode: { $first: "$subjectDetails.subjectCode" },
          totalMarks: { $first: "$subjects.totalMarks" },
          passingMarks: { $first: "$subjects.passingMarks" },
          averageMarks: { $avg: "$subjects.obtainedMarks" },
          highestMarks: { $max: "$subjects.obtainedMarks" },
          lowestMarks: { $min: "$subjects.obtainedMarks" },
          totalStudents: { $sum: 1 },
          passedCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gte: [
                        "$subjects.obtainedMarks",
                        "$subjects.passingMarks",
                      ],
                    },
                    { $ne: ["$subjects.remarks", "Absent"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          failedCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $lt: [
                        "$subjects.obtainedMarks",
                        "$subjects.passingMarks",
                      ],
                    },
                    { $ne: ["$subjects.remarks", "Absent"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          absentCount: {
            $sum: {
              $cond: [{ $eq: ["$subjects.remarks", "Absent"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          subjectName: 1,
          subjectCode: 1,
          totalMarks: 1,
          passingMarks: 1,
          averageMarks: { $round: ["$averageMarks", 2] },
          averagePercentage: {
            $round: [
              {
                $multiply: [{ $divide: ["$averageMarks", "$totalMarks"] }, 100],
              },
              2,
            ],
          },
          highestMarks: 1,
          lowestMarks: 1,
          totalStudents: 1,
          passedCount: 1,
          failedCount: 1,
          absentCount: 1,
          passPercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$passedCount", "$totalStudents"] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $sort: { subjectName: 1 },
      },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error in getSubjectWisePerformance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Top Performers
export const getTopPerformers = async (req, res) => {
  try {
    const { examId, class: className, section, limit = 10 } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    // Validate examId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = {
      examId: new mongoose.Types.ObjectId(examId),
      result: "Pass",
    };
    if (className) query.class = className;
    if (section) query.section = section;

    const topPerformers = await Result.find(query)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType")
      .sort({ percentage: -1, totalObtainedMarks: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, data: topPerformers });
  } catch (error) {
    console.error("Error in getTopPerformers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Result
export const deleteResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Result deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteResult:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Delete Results
export const bulkDeleteResults = async (req, res) => {
  try {
    const { examId, class: className, section } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    const query = { examId };
    if (className) query.class = className;
    if (section) query.section = section;

    const result = await Result.deleteMany(query);

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} results`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error in bulkDeleteResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
