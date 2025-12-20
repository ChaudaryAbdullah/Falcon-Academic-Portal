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
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// ============ HELPER FUNCTION FOR DUPLICATE ERROR MESSAGES ============
const getDuplicateErrorMessage = (error) => {
  const keyPattern = error.keyPattern || {};
  const keyValue = error.keyValue || {};

  // Check for compound index (dob + fatherCnic)
  if (keyPattern.dob && keyPattern.fatherCnic) {
    return {
      message:
        "A student with the same Date of Birth and Father's CNIC already exists. " +
        "This could be a duplicate entry. Please verify the student details.",
      field: "dob_fatherCnic",
      errorType: "DUPLICATE_STUDENT",
    };
  }

  // Check for individual field duplicates
  const field = Object.keys(keyPattern)[0];
  const value = keyValue[field];

  const fieldMessages = {
    rollNumber: {
      message: `Roll number '${value}' already exists.`,
      field: "rollNumber",
      errorType: "DUPLICATE_ROLL_NUMBER",
    },
    bform: {
      message: `B-Form number '${value}' already exists. A student with this B-Form is already registered.`,
      field: "bform",
      errorType: "DUPLICATE_BFORM",
    },
    email: {
      message: `Email '${value}' already exists. Please use a different email address.`,
      field: "email",
      errorType: "DUPLICATE_EMAIL",
    },
  };

  return (
    fieldMessages[field] || {
      message: `${field} '${value}' already exists. Please use a different value.`,
      field: field,
      errorType: "DUPLICATE_KEY",
    }
  );
};

// ============ CREATE STUDENT ============
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

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: responseStudent,
    });
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

    // Handle duplicate key error (including compound index)
    if (error.code === 11000) {
      const duplicateError = getDuplicateErrorMessage(error);
      return res.status(400).json({
        success: false,
        ...duplicateError,
      });
    }

    // Handle custom duplicate student error from pre-validate hook
    if (error.name === "DuplicateStudentError") {
      return res.status(400).json({
        success: false,
        message: error.message,
        field: "dob_fatherCnic",
        errorType: "DUPLICATE_STUDENT",
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
        message:
          "Validation failed: " + errors.map((e) => e.message).join(", "),
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

// ============ GET ALL STUDENTS ============
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

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

// ============ GET SINGLE STUDENT ============
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
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

// ============ UPDATE STUDENT ============
export const updateStudent = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Handle empty email
    if (updateData.email === "" || updateData.email === null) {
      updateData.email = undefined;
    }

    // Handle image upload if a new image is provided
    if (req.file) {
      updateData.img = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    // If password is being updated, hash it before saving
    if (updateData.password && updateData.password !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      // Don't update password if empty
      delete updateData.password;
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Convert image buffer to base64 for response
    const responseStudent = student.toObject();
    if (responseStudent.img && responseStudent.img.data) {
      responseStudent.img.data = responseStudent.img.data.toString("base64");
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: responseStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);

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

    // Handle duplicate key errors (including compound index)
    if (error.code === 11000) {
      const duplicateError = getDuplicateErrorMessage(error);
      return res.status(400).json({
        success: false,
        ...duplicateError,
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
        message:
          "Validation failed: " + errors.map((e) => e.message).join(", "),
        errors,
        errorType: "VALIDATION_ERROR",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
      errorType: "UNKNOWN_ERROR",
    });
  }
};

// ============ DELETE STUDENT ============
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET STUDENT IMAGE ============
export const getStudentImage = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student || !student.img || !student.img.data) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    res.set("Content-Type", student.img.contentType);
    res.send(student.img.data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ CHECK FOR DUPLICATE (Optional - for frontend validation) ============
export const checkDuplicate = async (req, res) => {
  try {
    const { dob, fatherCnic, studentId } = req.query;

    if (!dob || !fatherCnic) {
      return res.status(400).json({
        success: false,
        message: "DOB and Father CNIC are required",
      });
    }

    const query = {
      dob: new Date(dob),
      fatherCnic: fatherCnic.trim(),
    };

    // Exclude current student if updating
    if (studentId) {
      query._id = { $ne: studentId };
    }

    const existingStudent = await Student.findOne(query).select(
      "studentName rollNumber fatherName"
    );

    if (existingStudent) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: `A student with the same DOB and Father's CNIC already exists: ${existingStudent.studentName} (Roll: ${existingStudent.rollNumber})`,
        existingStudent: {
          name: existingStudent.studentName,
          rollNumber: existingStudent.rollNumber,
          fatherName: existingStudent.fatherName,
        },
      });
    }

    res.status(200).json({
      success: true,
      isDuplicate: false,
      message: "No duplicate found",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
