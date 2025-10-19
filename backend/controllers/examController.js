
import { Exam } from "../models/exam.js";
import { Result } from "../models/result.js";

// Create Exam
export const createExam = async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Exams
export const getAllExams = async (req, res) => {
  try {
    const { academicYear, status, examType } = req.query;
    
    const query = { isActive: true };
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;
    if (examType) query.examType = examType;

    const exams = await Exam.find(query).sort({ startDate: -1 });
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Exam by ID
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Exams by Class
export const getExamsByClass = async (req, res) => {
  try {
    const { class: className } = req.params;
    const { academicYear, status } = req.query;

    const query = {
      classes: className,
      isActive: true,
    };
    
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const exams = await Exam.find(query).sort({ startDate: -1 });
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Exam
export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update Exam Status
export const updateExamStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["scheduled", "ongoing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: scheduled, ongoing, completed, or cancelled",
      });
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Exam status updated to ${status}`,
      data: exam,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Exam (Soft delete)
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Permanently Delete Exam
export const permanentlyDeleteExam = async (req, res) => {
  try {
    // Check if there are any results for this exam
    const resultsCount = await Result.countDocuments({ examId: req.params.id });
    
    if (resultsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete exam. ${resultsCount} result(s) are associated with this exam. Delete results first.`,
      });
    }

    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam permanently deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Exam Statistics
export const getExamStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Get result statistics
    const stats = await Result.aggregate([
      { $match: { examId: exam._id } },
      {
        $group: {
          _id: null,
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
          publishedResults: {
            $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalStudents: 0,
      passedStudents: 0,
      failedStudents: 0,
      pendingStudents: 0,
      averagePercentage: 0,
      highestPercentage: 0,
      publishedResults: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        exam,
        statistics,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Available Academic Years
export const getAvailableAcademicYears = async (req, res) => {
  try {
    const years = await Exam.distinct("academicYear");
    
    // Sort years in descending order
    const sortedYears = years
      .filter((year) => year)
      .sort((a, b) => b.localeCompare(a));

    res.status(200).json({
      success: true,
      data: sortedYears,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
