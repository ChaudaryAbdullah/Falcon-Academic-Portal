import { Student } from "../models/student.js";
import bcrypt from "bcrypt";

// Create Student
export const createStudent = async (req, res) => {
  try {
    console.log("Received create student request:", req.body);
    if (req.body.email === "" || req.body.email === null) {
      req.body.email = undefined;
    }

    if (req.body.password === "") {
      req.body.password = 12345678; // Treat empty string as null
    }
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    console.error("Error creating student:", error);

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

// Get All Students
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Student
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Student
export const updateStudent = async (req, res) => {
  try {
    let updateData = { ...req.body };

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

    res.status(200).json({ success: true, data: student });
  } catch (error) {
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
