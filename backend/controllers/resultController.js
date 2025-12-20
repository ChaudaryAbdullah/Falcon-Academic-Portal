import { Result } from "../models/result.js";
import { Exam } from "../models/exam.js";
import { Subject } from "../models/subject.js";
import { Student } from "../models/student.js";
import mongoose from "mongoose";

// Helper function to round to 2 decimal places
const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// Helper function to validate and sanitize marks
const sanitizeMarks = (obtainedMarks, totalMarks) => {
  let marks = parseFloat(obtainedMarks) || 0;
  if (marks < 0) marks = 0;
  if (marks > totalMarks) marks = totalMarks;
  return roundToTwo(marks);
};

// Create Single Result
export const createResult = async (req, res) => {
  try {
    // Pre-fetch subject codes if subjects are provided
    if (req.body.subjects && req.body.subjects.length > 0) {
      const subjectIds = req.body.subjects.map((s) => s.subjectId);
      const subjectDocs = await Subject.find(
        { _id: { $in: subjectIds } },
        { subjectCode: 1 }
      ).lean();

      const subjectCodeMap = new Map(
        subjectDocs.map((s) => [s._id.toString(), s.subjectCode])
      );

      req.body.subjects = req.body.subjects.map((subject) => ({
        ...subject,
        subjectCode: subjectCodeMap.get(subject.subjectId.toString()) || "",
        obtainedMarks: sanitizeMarks(
          subject.obtainedMarks || 0,
          subject.totalMarks || 100
        ),
      }));
    }

    const result = await Result.create(req.body);

    const populatedResult = await Result.findById(result._id)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode")
      .lean();

    res.status(201).json({ success: true, data: populatedResult });
  } catch (error) {
    console.error("Error in createResult:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Results (with pagination for performance)
export const getAllResults = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      examId,
      class: className,
      section,
    } = req.query;

    const query = {};
    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      query.examId = new mongoose.Types.ObjectId(examId);
    }
    if (className) query.class = className;
    if (section) query.section = section;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      Result.find(query)
        .populate(
          "studentId",
          "studentName fatherName rollNumber class section"
        )
        .populate("examId", "examName examType academicYear")
        .populate("subjects.subjectId", "subjectName subjectCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Result.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getAllResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Create Results for a Class - OPTIMIZED with insertMany
export const bulkCreateResults = async (req, res) => {
  try {
    const { examId, class: className, section, subjects } = req.body;

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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    // Parallel fetch: exam, students, subject codes, existing results
    const examObjectId = new mongoose.Types.ObjectId(examId);
    const subjectIds = subjects.map(
      (s) => new mongoose.Types.ObjectId(s.subjectId)
    );

    const [exam, students, subjectDocs, existingResults] = await Promise.all([
      Exam.findById(examObjectId).lean(),
      Student.find(
        { class: className, section: section },
        { _id: 1, studentName: 1 }
      ).lean(),
      Subject.find(
        { _id: { $in: subjectIds } },
        { _id: 1, subjectCode: 1 }
      ).lean(),
      Result.find(
        { examId: examObjectId, class: className, section: section },
        { studentId: 1 }
      ).lean(),
    ]);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No students found in class="${className}" and section="${section}"`,
      });
    }

    // Create maps for quick lookup
    const subjectCodeMap = new Map(
      subjectDocs.map((s) => [s._id.toString(), s.subjectCode])
    );

    const existingStudentIds = new Set(
      existingResults.map((r) => r.studentId.toString())
    );

    // Filter out students who already have results
    const newStudents = students.filter(
      (s) => !existingStudentIds.has(s._id.toString())
    );

    if (newStudents.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All students already have results for this exam",
        data: [],
        skipped: students.length,
      });
    }

    // Prepare bulk insert data
    // In bulkCreateResults function, update this part:

    // In bulkCreateResults function
    const resultsToInsert = newStudents.map((student) => ({
      studentId: student._id,
      examId: examObjectId,
      class: className,
      section: section,
      subjects: subjects.map((subject) => ({
        subjectId: new mongoose.Types.ObjectId(subject.subjectId),
        subjectCode: subjectCodeMap.get(subject.subjectId) || "",
        obtainedMarks: null, // NULL = not entered yet
        totalMarks: subject.totalMarks || 100,
        passingMarks: subject.passingMarks || 40,
        grade: "",
        remarks: "Pending",
        isPassed: false,
      })),
      result: "Pending",
      totalMarks: subjects.reduce((sum, s) => sum + (s.totalMarks || 100), 0),
      totalObtainedMarks: 0,
      percentage: 0,
    }));

    // Bulk insert
    const insertedResults = await Result.insertMany(resultsToInsert, {
      ordered: false,
      rawResult: false,
    });

    // Get IDs of inserted results for population
    const insertedIds = insertedResults.map((r) => r._id);

    // Populate the results
    const populatedResults = await Result.find({ _id: { $in: insertedIds } })
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode")
      .lean();

    res.status(201).json({
      success: true,
      message: `Created ${populatedResults.length} result records`,
      data: populatedResults,
      skipped: existingStudentIds.size,
    });
  } catch (error) {
    console.error("Error in bulkCreateResults:", error);

    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Some results already exist",
        data: [],
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Result (Enter Marks) - Single
export const updateResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID format",
      });
    }

    // Sanitize marks if subjects are being updated
    if (req.body.subjects && Array.isArray(req.body.subjects)) {
      req.body.subjects = req.body.subjects.map((subject) => ({
        ...subject,
        obtainedMarks: sanitizeMarks(
          subject.obtainedMarks,
          subject.totalMarks || 100
        ),
      }));
    }

    const result = await Result.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Update subjects if provided
    if (req.body.subjects && Array.isArray(req.body.subjects)) {
      req.body.subjects.forEach((subjectData) => {
        const subjectIndex = result.subjects.findIndex(
          (s) => s.subjectId.toString() === subjectData.subjectId
        );

        if (subjectIndex !== -1) {
          const totalMarks = result.subjects[subjectIndex].totalMarks;
          result.subjects[subjectIndex].obtainedMarks = sanitizeMarks(
            subjectData.obtainedMarks,
            totalMarks
          );
          if (subjectData.remarks) {
            result.subjects[subjectIndex].remarks = subjectData.remarks;
          }
        }
      });
    }

    // Save triggers pre-save middleware
    await result.save();

    const populatedResult = await Result.findById(result._id)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode")
      .lean();

    res.status(200).json({ success: true, data: populatedResult });
  } catch (error) {
    console.error("Error in updateResult:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Bulk Update Results - OPTIMIZED with parallel processing
export const bulkUpdateResults = async (req, res) => {
  try {
    const { results } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No results provided",
      });
    }

    const validResultIds = results
      .filter((r) => mongoose.Types.ObjectId.isValid(r.resultId))
      .map((r) => new mongoose.Types.ObjectId(r.resultId));

    if (validResultIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid result IDs provided",
      });
    }

    const existingResults = await Result.find({
      _id: { $in: validResultIds },
    });

    const resultMap = new Map(
      existingResults.map((r) => [r._id.toString(), r])
    );

    const updatePromises = [];
    const errors = [];
    const updatedIds = [];

    for (const resultData of results) {
      try {
        if (!mongoose.Types.ObjectId.isValid(resultData.resultId)) {
          errors.push({
            resultId: resultData.resultId,
            message: "Invalid result ID format",
          });
          continue;
        }

        const result = resultMap.get(resultData.resultId);

        if (!result) {
          errors.push({
            resultId: resultData.resultId,
            message: "Result not found",
          });
          continue;
        }

        // Update subject marks
        if (resultData.subjects && Array.isArray(resultData.subjects)) {
          for (const subjectData of resultData.subjects) {
            const subjectIndex = result.subjects.findIndex(
              (s) => s.subjectId.toString() === subjectData.subjectId
            );

            if (subjectIndex !== -1) {
              const subject = result.subjects[subjectIndex];

              // Check if marks are being set
              // null/undefined = not entered
              // number (including 0) = entered
              if (
                subjectData.obtainedMarks !== null &&
                subjectData.obtainedMarks !== undefined
              ) {
                let marks = parseFloat(subjectData.obtainedMarks);

                // Validate marks
                if (isNaN(marks)) {
                  marks = 0;
                }
                if (marks < 0) {
                  marks = 0;
                }
                if (marks > subject.totalMarks) {
                  marks = subject.totalMarks;
                }

                result.subjects[subjectIndex].obtainedMarks =
                  Math.round(marks * 100) / 100;

                // Set remarks based on marks (unless Absent)
                if (subjectData.remarks === "Absent") {
                  result.subjects[subjectIndex].remarks = "Absent";
                }
                // The pre-save middleware will handle Pass/Fail
              }
            }
          }
        }

        // Save will trigger pre-save middleware
        updatePromises.push(
          result.save().then(() => {
            updatedIds.push(result._id);
          })
        );
      } catch (error) {
        errors.push({
          resultId: resultData.resultId,
          message: error.message,
        });
      }
    }

    await Promise.allSettled(updatePromises);

    const populatedResults = await Result.find({ _id: { $in: updatedIds } })
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode")
      .lean();

    res.status(200).json({
      success: true,
      message: `Updated ${populatedResults.length} results`,
      data: populatedResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in bulkUpdateResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Results by Exam and Class - OPTIMIZED with lean()
export const getResultsByExamAndClass = async (req, res) => {
  try {
    const { examId, class: className, section } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = { examId: new mongoose.Types.ObjectId(examId) };
    if (className && className !== "all") query.class = className;
    if (section && section !== "all") query.section = section;

    const results = await Result.find(query)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode totalMarks")
      .sort({ "studentId.rollNumber": 1, position: 1 })
      .lean();

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

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format",
      });
    }

    const results = await Result.find({
      studentId: new mongoose.Types.ObjectId(studentId),
    })
      .populate("examId", "examName examType academicYear startDate")
      .populate("subjects.subjectId", "subjectName subjectCode")
      .sort({ createdAt: -1 })
      .lean();

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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID format",
      });
    }

    const result = await Result.findById(id)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType academicYear")
      .populate("subjects.subjectId", "subjectName subjectCode")
      .lean();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getResultById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Calculate and Update Positions - OPTIMIZED with bulkWrite
export const calculatePositions = async (req, res) => {
  try {
    const { examId, class: className, section } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

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

    // Get all passed results sorted by percentage
    const results = await Result.find(query, {
      _id: 1,
      percentage: 1,
      totalObtainedMarks: 1,
    })
      .sort({ percentage: -1, totalObtainedMarks: -1 })
      .lean();

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No passed results found for position calculation",
        data: [],
      });
    }

    // Prepare bulk update operations
    const bulkOps = results.map((result, index) => ({
      updateOne: {
        filter: { _id: result._id },
        update: { $set: { position: index + 1 } },
      },
    }));

    // Execute bulk update
    await Result.bulkWrite(bulkOps, { ordered: false });

    res.status(200).json({
      success: true,
      message: `Updated positions for ${results.length} students`,
      count: results.length,
    });
  } catch (error) {
    console.error("Error in calculatePositions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Publish Results - OPTIMIZED
export const publishResults = async (req, res) => {
  try {
    const { examId, class: className, section } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = { examId: new mongoose.Types.ObjectId(examId) };
    if (className && className !== "all") query.class = className;
    if (section && section !== "all") query.section = section;

    const result = await Result.updateMany(query, {
      $set: {
        isPublished: true,
        publishedDate: new Date(),
      },
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

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = { examId: new mongoose.Types.ObjectId(examId) };
    if (className && className !== "all") query.class = className;
    if (section && section !== "all") query.section = section;

    const result = await Result.updateMany(query, {
      $set: {
        isPublished: false,
        publishedDate: null,
      },
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

// Get Class Performance Report - OPTIMIZED
export const getClassPerformanceReport = async (req, res) => {
  try {
    const { examId, class: className, section } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const matchQuery = { examId: new mongoose.Types.ObjectId(examId) };
    if (className && className !== "all") matchQuery.class = className;
    if (section && section !== "all") matchQuery.section = section;

    const report = await Result.aggregate([
      { $match: matchQuery },
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
                $cond: [
                  { $eq: ["$totalStudents", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$passedStudents", "$totalStudents"] },
                      100,
                    ],
                  },
                ],
              },
              2,
            ],
          },
          averagePercentage: {
            $round: [{ $ifNull: ["$averagePercentage", 0] }, 2],
          },
          highestPercentage: {
            $round: [{ $ifNull: ["$highestPercentage", 0] }, 2],
          },
          lowestPercentage: {
            $round: [{ $ifNull: ["$lowestPercentage", 0] }, 2],
          },
          totalMarks: 1,
          averageObtained: {
            $round: [{ $ifNull: ["$averageObtained", 0] }, 2],
          },
        },
      },
      { $sort: { class: 1, section: 1 } },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error in getClassPerformanceReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Subject-wise Performance Analysis - OPTIMIZED with group by subjectCode
export const getSubjectWisePerformance = async (req, res) => {
  try {
    const { examId, class: className, section, groupByCode } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const matchQuery = { examId: new mongoose.Types.ObjectId(examId) };
    if (className && className !== "all") matchQuery.class = className;
    if (section && section !== "all") matchQuery.section = section;

    // Determine if we should group by subject code
    const groupField =
      groupByCode === "true" ? "$subjects.subjectCode" : "$subjects.subjectId";

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
          _id:
            groupByCode === "true"
              ? "$subjects.subjectCode"
              : "$subjects.subjectId",
          subjectName: { $first: "$subjectDetails.subjectName" },
          subjectCode: { $first: "$subjectDetails.subjectCode" },
          totalMarks: { $sum: "$subjects.totalMarks" },
          avgTotalMarks: { $avg: "$subjects.totalMarks" },
          passingMarks: { $sum: "$subjects.passingMarks" },
          avgPassingMarks: { $avg: "$subjects.passingMarks" },
          totalObtainedMarks: { $sum: "$subjects.obtainedMarks" },
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
                    { $gt: ["$subjects.obtainedMarks", 0] },
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
          subjectCount: { $addToSet: "$subjects.subjectId" },
        },
      },
      {
        $project: {
          subjectName: 1,
          subjectCode: 1,
          totalMarks: { $round: ["$avgTotalMarks", 2] },
          passingMarks: { $round: ["$avgPassingMarks", 2] },
          averageMarks: { $round: ["$averageMarks", 2] },
          averagePercentage: {
            $round: [
              {
                $cond: [
                  { $eq: ["$avgTotalMarks", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$averageMarks", "$avgTotalMarks"] },
                      100,
                    ],
                  },
                ],
              },
              2,
            ],
          },
          highestMarks: { $round: ["$highestMarks", 2] },
          lowestMarks: { $round: ["$lowestMarks", 2] },
          totalStudents: 1,
          passedCount: 1,
          failedCount: 1,
          absentCount: 1,
          passPercentage: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalStudents", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$passedCount", "$totalStudents"] },
                      100,
                    ],
                  },
                ],
              },
              2,
            ],
          },
          isGrouped: { $gt: [{ $size: "$subjectCount" }, 1] },
          subjectCountInGroup: { $size: "$subjectCount" },
        },
      },
      { $sort: { subjectCode: 1, subjectName: 1 } },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error in getSubjectWisePerformance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Subject Group Performance (NEW - for grouped subjects analysis)
export const getSubjectGroupPerformance = async (req, res) => {
  try {
    const { examId, class: className, section } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const matchQuery = { examId: new mongoose.Types.ObjectId(examId) };
    if (className && className !== "all") matchQuery.class = className;
    if (section && section !== "all") matchQuery.section = section;

    const report = await Result.aggregate([
      { $match: matchQuery },
      { $unwind: "$subjectGroups" },
      {
        $group: {
          _id: "$subjectGroups.groupCode",
          groupName: { $first: "$subjectGroups.groupName" },
          totalMaxMarks: { $first: "$subjectGroups.totalMaxMarks" },
          totalPassingMarks: { $first: "$subjectGroups.totalPassingMarks" },
          averageObtained: { $avg: "$subjectGroups.totalObtainedMarks" },
          highestObtained: { $max: "$subjectGroups.totalObtainedMarks" },
          lowestObtained: { $min: "$subjectGroups.totalObtainedMarks" },
          averagePercentage: { $avg: "$subjectGroups.percentage" },
          subjectCount: { $first: "$subjectGroups.subjectCount" },
          totalStudents: { $sum: 1 },
          passedCount: {
            $sum: { $cond: ["$subjectGroups.isPassed", 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          groupCode: "$_id",
          groupName: 1,
          totalMaxMarks: 1,
          totalPassingMarks: 1,
          averageObtained: { $round: ["$averageObtained", 2] },
          highestObtained: { $round: ["$highestObtained", 2] },
          lowestObtained: { $round: ["$lowestObtained", 2] },
          averagePercentage: { $round: ["$averagePercentage", 2] },
          subjectCount: 1,
          totalStudents: 1,
          passedCount: 1,
          failedCount: { $subtract: ["$totalStudents", "$passedCount"] },
          passPercentage: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalStudents", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$passedCount", "$totalStudents"] },
                      100,
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { groupCode: 1 } },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error in getSubjectGroupPerformance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Top Performers - OPTIMIZED
export const getTopPerformers = async (req, res) => {
  try {
    const { examId, class: className, section, limit = 10 } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

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
    if (className && className !== "all") query.class = className;
    if (section && section !== "all") query.section = section;

    const topPerformers = await Result.find(query)
      .populate("studentId", "studentName fatherName rollNumber class section")
      .populate("examId", "examName examType")
      .select(
        "studentId examId percentage totalObtainedMarks totalMarks grade position class section"
      )
      .sort({ percentage: -1, totalObtainedMarks: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ success: true, data: topPerformers });
  } catch (error) {
    console.error("Error in getTopPerformers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Result
export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID format",
      });
    }

    const result = await Result.findByIdAndDelete(id);

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

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = { examId: new mongoose.Types.ObjectId(examId) };
    if (className && className !== "all") query.class = className;
    if (section && section !== "all") query.section = section;

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

// Get Results Summary by Exam (NEW - Quick overview)
export const getResultsSummary = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const summary = await Result.aggregate([
      { $match: { examId: new mongoose.Types.ObjectId(examId) } },
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ["$result", "Pass"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$result", "Fail"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$result", "Pending"] }, 1, 0] } },
          published: { $sum: { $cond: ["$isPublished", 1, 0] } },
          avgPercentage: { $avg: "$percentage" },
          highestPercentage: { $max: "$percentage" },
          lowestPercentage: { $min: "$percentage" },
          classes: { $addToSet: "$class" },
          sections: { $addToSet: "$section" },
        },
      },
      {
        $project: {
          _id: 0,
          totalResults: 1,
          passed: 1,
          failed: 1,
          pending: 1,
          published: 1,
          unpublished: { $subtract: ["$totalResults", "$published"] },
          avgPercentage: { $round: ["$avgPercentage", 2] },
          highestPercentage: { $round: ["$highestPercentage", 2] },
          lowestPercentage: { $round: ["$lowestPercentage", 2] },
          passRate: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalResults", 0] },
                  0,
                  {
                    $multiply: [{ $divide: ["$passed", "$totalResults"] }, 100],
                  },
                ],
              },
              2,
            ],
          },
          classCount: { $size: "$classes" },
          sectionCount: { $size: "$sections" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: summary[0] || {
        totalResults: 0,
        passed: 0,
        failed: 0,
        pending: 0,
        published: 0,
        unpublished: 0,
        avgPercentage: 0,
        highestPercentage: 0,
        lowestPercentage: 0,
        passRate: 0,
        classCount: 0,
        sectionCount: 0,
      },
    });
  } catch (error) {
    console.error("Error in getResultsSummary:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Calculate/Recalculate Results for Exam
// Add this to your controller
export const calculateResults = async (req, res) => {
  try {
    const { examId, class: className, section } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    const query = { examId: new mongoose.Types.ObjectId(examId) };
    if (className && className !== "all") query.class = className;
    if (section && section !== "all") query.section = section;

    const results = await Result.find(query);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No results found to calculate",
      });
    }

    let updated = 0;
    let passed = 0;
    let failed = 0;
    let pending = 0;
    const errors = [];

    // Process each result - just save to trigger pre-save middleware
    for (const result of results) {
      try {
        await result.save();
        updated++;

        if (result.result === "Pass") passed++;
        else if (result.result === "Fail") failed++;
        else pending++;
      } catch (err) {
        errors.push({
          resultId: result._id,
          error: err.message,
        });
      }
    }

    // Calculate positions for passed students
    const passedResults = await Result.find({
      ...query,
      result: "Pass",
    })
      .sort({ percentage: -1, totalObtainedMarks: -1 })
      .lean();

    if (passedResults.length > 0) {
      const bulkOps = passedResults.map((result, index) => ({
        updateOne: {
          filter: { _id: result._id },
          update: { $set: { position: index + 1 } },
        },
      }));
      await Result.bulkWrite(bulkOps, { ordered: false });
    }

    res.status(200).json({
      success: true,
      message: `Calculated ${updated} results: ${passed} Pass, ${failed} Fail, ${pending} Pending`,
      data: {
        total: updated,
        passed,
        failed,
        pending,
        positionsAssigned: passedResults.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in calculateResults:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
