import { Student } from "../models/student.js";
import bcrypt from "bcrypt";
import multer from "multer";

// Configure multer for handling file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

// Helper function to convert image to base64
const imageToBase64 = (student) => {
  if (student.img && student.img.data) {
    student.img.data = student.img.data.toString("base64");
  }
  if (!student.status || student.status === "") {
    student.status = "active";
  }
  return student;
};

// Create Student with Image Upload
export const createStudent = async (req, res) => {
  try {
    if (req.body.email === "" || req.body.email === null) {
      req.body.email = undefined;
    }

    if (req.body.password === "" || req.body.password === null) {
      req.body.password = "12345678";
    }

    let imageData = null;
    if (req.file) {
      imageData = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const studentData = {
      ...req.body,
      ...(imageData && { img: imageData }),
    };

    const student = await Student.create(studentData);

    const responseStudent = student.toObject();
    if (responseStudent.img && responseStudent.img.data) {
      responseStudent.img.data = responseStudent.img.data.toString("base64");
    }

    res.status(201).json({ success: true, data: responseStudent });
  } catch (error) {
    console.error("Error creating student:", error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size too large. Maximum size allowed is 5MB.",
          errorType: "FILE_SIZE_ERROR",
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message,
        errorType: "UPLOAD_ERROR",
      });
    }

    if (error.message === "Only image files are allowed!") {
      return res.status(400).json({
        success: false,
        message:
          "Only image files are allowed. Please upload a valid image file.",
        errorType: "INVALID_FILE_TYPE",
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        success: false,
        message: `${field} '${value}' already exists. Please use a different ${field}.`,
        field,
        value,
        errorType: "DUPLICATE_KEY",
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
        errorType: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred",
      errorType: "UNKNOWN_ERROR",
    });
  }
};

// ⚡ OPTIMIZED: Get All Students WITHOUT images
export const getStudents = async (req, res) => {
  try {
    const students = await Student.aggregate([
      {
        $project: {
          __v: 0,
          img: 0, // EXCLUDE images completely
        },
      },
      {
        $sort: { rollNumber: 1 },
      },
    ]).exec();

    // No need to process images since we excluded them
    const processedStudents = students.map((student) => {
      if (!student.status || student.status === "") {
        student.status = "active";
      }
      return student;
    });

    res.status(200).json({
      success: true,
      data: processedStudents,
      count: processedStudents.length,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ⚡ NEW: Get Students with Image Placeholders (lightweight)
export const getStudentsLight = async (req, res) => {
  try {
    const students = await Student.aggregate([
      {
        $project: {
          __v: 0,
          img: 0, // Don't include actual image data
        },
      },
      {
        $addFields: {
          hasImage: { $cond: [{ $ifNull: ["$img", false] }, true, false] },
        },
      },
      {
        $sort: { rollNumber: 1 },
      },
    ]).exec();

    const processedStudents = students.map((student) => {
      if (!student.status || student.status === "") {
        student.status = "active";
      }
      return student;
    });

    res.status(200).json({
      success: true,
      data: processedStudents,
      count: processedStudents.length,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ⚡ OPTIMIZED: Get Single Student
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select("-__v")
      .lean()
      .exec();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const processedStudent = imageToBase64(student);

    res.status(200).json({ success: true, data: processedStudent });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Student with Optional Image Upload
export const updateStudent = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.file) {
      updateData.img = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const responseStudent = student.toObject();
    if (responseStudent.img && responseStudent.img.data) {
      responseStudent.img.data = responseStudent.img.data.toString("base64");
    }

    res.status(200).json({ success: true, data: responseStudent });
  } catch (error) {
    console.error("Error updating student:", error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size too large. Maximum size allowed is 5MB.",
          errorType: "FILE_SIZE_ERROR",
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message,
        errorType: "UPLOAD_ERROR",
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        success: false,
        message: `${field} '${value}' already exists. Please use a different ${field}.`,
        field,
        value,
        errorType: "DUPLICATE_KEY",
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Student
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Student Image by ID
export const getStudentImage = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("img").lean();

    if (!student || !student.img || !student.img.data) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    res.set("Content-Type", student.img.contentType);
    res.send(student.img.data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ⚡ NEW: Batch Get Student Images
export const getBatchStudentImages = async (req, res) => {
  try {
    const { ids } = req.body; // Array of student IDs

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. 'ids' array is required",
      });
    }

    const students = await Student.find(
      { _id: { $in: ids } },
      { _id: 1, img: 1 },
    ).lean();

    const images = students.reduce((acc, student) => {
      if (student.img && student.img.data) {
        acc[student._id] = {
          data: student.img.data.toString("base64"),
          contentType: student.img.contentType,
        };
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Error fetching batch images:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pass Out Student
export const passOutStudent = async (req, res) => {
  try {
    const { passOutYear, passOutClass, reason } = req.body;

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (
      student.status !== "active" &&
      student.status !== "" &&
      student.status
    ) {
      return res.status(400).json({
        success: false,
        message: `Student is already ${
          student.status === "passedOut" ? "passed out" : "struck off"
        }`,
      });
    }

    student.status = "passedOut";
    student.statusDate = new Date();
    student.statusReason = reason || "Completed education";
    student.passOutYear = passOutYear || new Date().getFullYear().toString();
    student.passOutClass = passOutClass || student.class;

    await student.save();

    const responseStudent = student.toObject();
    if (responseStudent.img && responseStudent.img.data) {
      responseStudent.img.data = responseStudent.img.data.toString("base64");
    }

    res.status(200).json({
      success: true,
      message: "Student marked as passed out successfully",
      data: responseStudent,
    });
  } catch (error) {
    console.error("Error passing out student:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Strike Off Student
export const strikeOffStudent = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required for striking off a student",
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (
      student.status !== "active" &&
      student.status !== "" &&
      student.status
    ) {
      return res.status(400).json({
        success: false,
        message: `Student is already ${
          student.status === "passedOut" ? "passed out" : "struck off"
        }`,
      });
    }

    student.status = "struckOff";
    student.statusDate = new Date();
    student.statusReason = reason;

    await student.save();

    const responseStudent = student.toObject();
    if (responseStudent.img && responseStudent.img.data) {
      responseStudent.img.data = responseStudent.img.data.toString("base64");
    }

    res.status(200).json({
      success: true,
      message: "Student struck off successfully",
      data: responseStudent,
    });
  } catch (error) {
    console.error("Error striking off student:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reactivate Student
export const reactivateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (
      student.status === "active" ||
      !student.status ||
      student.status === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Student is already active",
      });
    }

    student.status = "active";
    student.statusDate = undefined;
    student.statusReason = undefined;
    student.passOutYear = undefined;
    student.passOutClass = undefined;

    await student.save();

    const responseStudent = student.toObject();
    if (responseStudent.img && responseStudent.img.data) {
      responseStudent.img.data = responseStudent.img.data.toString("base64");
    }

    res.status(200).json({
      success: true,
      message: "Student reactivated successfully",
      data: responseStudent,
    });
  } catch (error) {
    console.error("Error reactivating student:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ⚡ OPTIMIZED: Get Students by Status
export const getStudentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!["active", "passedOut", "struckOff"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use: active, passedOut, or struckOff",
      });
    }

    const query =
      status === "active"
        ? {
            $or: [
              { status: "active" },
              { status: { $exists: false } },
              { status: "" },
            ],
          }
        : { status };

    const students = await Student.find(query)
      .select("-__v -img") // EXCLUDE images
      .sort({ rollNumber: 1 })
      .lean()
      .exec();

    const processedStudents = students.map((student) => {
      if (!student.status || student.status === "") {
        student.status = "active";
      }
      return student;
    });

    res.status(200).json({
      success: true,
      data: processedStudents,
      count: processedStudents.length,
    });
  } catch (error) {
    console.error("Error fetching students by status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ⚡ OPTIMIZED: Get Students with Pagination WITHOUT images
export const getStudentsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const { class: classFilter, section, status, search } = req.query;

    let query = {};

    if (classFilter) query.class = classFilter;
    if (section) query.section = section;

    if (status === "active") {
      query.$or = [
        { status: "active" },
        { status: { $exists: false } },
        { status: "" },
      ];
    } else if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
      ];
    }

    const [total, students] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query)
        .select("-__v -img") // EXCLUDE images
        .sort({ rollNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    const processedStudents = students.map((student) => {
      if (!student.status || student.status === "") {
        student.status = "active";
      }
      return student;
    });

    res.status(200).json({
      success: true,
      data: processedStudents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching paginated students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
