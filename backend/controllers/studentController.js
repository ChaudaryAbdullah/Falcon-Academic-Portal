import { Student } from "../models/student.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

// Configure multer for handling file uploads
const storage = multer.memoryStorage(); // Store files in memory as Buffer

const fileFilter = (req, file, cb) => {
  // Check if the file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Create Student with Image Upload
export const createStudent = async (req, res) => {
  try {
    // Handle empty email and password
    if (req.body.email === "" || req.body.email === null) {
      req.body.email = undefined;
    }

    if (req.body.password === "" || req.body.password === null) {
      req.body.password = "12345678"; // Default password
    }

    // Handle image upload
    let imageData = null;
    if (req.file) {
      imageData = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    // Create student data object
    const studentData = {
      ...req.body,
      ...(imageData && { img: imageData }),
    };

    const student = await Student.create(studentData);

    // Convert image buffer to base64 for response (if exists)
    const responseStudent = student.toObject();
    if (responseStudent.img && responseStudent.img.data) {
      responseStudent.img.data = responseStudent.img.data.toString("base64");
    }

    res.status(201).json({ success: true, data: responseStudent });
  } catch (error) {
    console.error("Error creating student:", error);

    // Handle multer errors
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

    // Handle custom file filter errors
    if (error.message === "Only image files are allowed!") {
      return res.status(400).json({
        success: false,
        message:
          "Only image files are allowed. Please upload a valid image file.",
        errorType: "INVALID_FILE_TYPE",
      });
    }

    // Duplicate key error
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

    // Validation error
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

// Get All Students with Images
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find();

    // Convert image buffers to base64 for all students
    const studentsWithImages = students.map((student) => {
      const studentObj = student.toObject();
      if (studentObj.img && studentObj.img.data) {
        studentObj.img.data = studentObj.img.data.toString("base64");
      }
      return studentObj;
    });

    res.status(200).json({ success: true, data: studentsWithImages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Student with Image
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Convert image buffer to base64
    const studentObj = student.toObject();
    if (studentObj.img && studentObj.img.data) {
      studentObj.img.data = studentObj.img.data.toString("base64");
    }

    res.status(200).json({ success: true, data: studentObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Student with Optional Image Upload
export const updateStudent = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Handle image upload if a new image is provided
    if (req.file) {
      updateData.img = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    // If password is being updated, hash it before saving
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Convert image buffer to base64 for response
    const responseStudent = student.toObject();
    if (responseStudent.img && responseStudent.img.data) {
      responseStudent.img.data = responseStudent.img.data.toString("base64");
    }

    res.status(200).json({ success: true, data: responseStudent });
  } catch (error) {
    // Handle multer errors
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

    // Handle duplicate key errors
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
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Student Image by ID (optional endpoint for serving images directly)
export const getStudentImage = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student || !student.img || !student.img.data) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    res.set("Content-Type", student.img.contentType);
    res.send(student.img.data);
  } catch (error) {
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

    if (student.status !== "active") {
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

    if (student.status !== "active") {
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

// Reactivate Student (optional - to undo pass out or struck off)
export const reactivateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.status === "active") {
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

// Get Students by Status
export const getStudentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!["active", "passedOut", "struckOff"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use: active, passedOut, or struckOff",
      });
    }

    const students = await Student.find({ status });

    const studentsWithImages = students.map((student) => {
      const studentObj = student.toObject();
      if (studentObj.img && studentObj.img.data) {
        studentObj.img.data = studentObj.img.data.toString("base64");
      }
      return studentObj;
    });

    res.status(200).json({ success: true, data: studentsWithImages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
