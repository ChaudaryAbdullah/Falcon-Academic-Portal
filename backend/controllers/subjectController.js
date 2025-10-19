import { Subject } from "../models/subject.js";
import { ClassSubject } from "../models/classSubject.js";

// Create Subject
export const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Subjects
export const getAllSubjects = async (req, res) => {
  try {
    const { isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    } else {
      query.isActive = true; // Default to active subjects only
    }

    const subjects = await Subject.find(query).sort({ subjectName: 1 });
    res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Subject by ID
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Subjects by Class
export const getSubjectsByClass = async (req, res) => {
  try {
    const { class: className } = req.params;

    const subjects = await Subject.find({
      classes: className,
      isActive: true,
    }).sort({ subjectName: 1 });

    res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Subject
export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Subject (Soft delete)
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Permanently Delete Subject
export const permanentlyDeleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Also remove from ClassSubject mappings
    await ClassSubject.updateMany(
      { subjects: req.params.id },
      { $pull: { subjects: req.params.id } }
    );

    res.status(200).json({
      success: true,
      message: "Subject permanently deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Create Subjects
export const bulkCreateSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No subjects provided",
      });
    }

    const createdSubjects = [];
    const errors = [];

    for (const subjectData of subjects) {
      try {
        // Check if subject code already exists
        const existingSubject = await Subject.findOne({
          subjectCode: subjectData.subjectCode,
        });

        if (existingSubject) {
          errors.push({
            subjectCode: subjectData.subjectCode,
            message: "Subject code already exists",
          });
          continue;
        }

        const subject = await Subject.create(subjectData);
        createdSubjects.push(subject);
      } catch (error) {
        errors.push({
          subjectCode: subjectData.subjectCode,
          message: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdSubjects.length} subjects`,
      data: createdSubjects,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign Subjects to Class
export const assignSubjectsToClass = async (req, res) => {
  try {
    const { class: className, subjects, academicYear } = req.body;

    if (!className || !subjects || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Class, subjects array, and academic year are required",
      });
    }

    // Validate that all subject IDs exist
    const validSubjects = await Subject.find({
      _id: { $in: subjects },
      isActive: true,
    });

    if (validSubjects.length !== subjects.length) {
      return res.status(400).json({
        success: false,
        message: "One or more subject IDs are invalid",
      });
    }

    // Check if mapping already exists
    let classSubject = await ClassSubject.findOne({
      class: className,
      academicYear: academicYear,
    });

    if (classSubject) {
      // Update existing mapping
      classSubject.subjects = subjects;
      classSubject.isActive = true;
      await classSubject.save();
    } else {
      // Create new mapping
      classSubject = await ClassSubject.create({
        class: className,
        subjects: subjects,
        academicYear: academicYear,
      });
    }

    const populated = await ClassSubject.findById(classSubject._id).populate(
      "subjects",
      "subjectName subjectCode totalMarks passingMarks"
    );

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Class Subject Mapping
export const getClassSubjects = async (req, res) => {
  try {
    const { class: className, academicYear } = req.query;

    if (!className || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Class and academic year are required",
      });
    }

    const classSubject = await ClassSubject.findOne({
      class: className,
      academicYear: academicYear,
      isActive: true,
    }).populate("subjects", "subjectName subjectCode totalMarks passingMarks");

    if (!classSubject) {
      return res.status(404).json({
        success: false,
        message: "No subjects found for this class",
      });
    }

    res.status(200).json({ success: true, data: classSubject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Class Subject Mappings
export const getAllClassSubjectMappings = async (req, res) => {
  try {
    const { academicYear } = req.query;

    const query = { isActive: true };
    if (academicYear) query.academicYear = academicYear;

    const mappings = await ClassSubject.find(query)
      .populate("subjects", "subjectName subjectCode totalMarks passingMarks")
      .sort({ class: 1 });

    res.status(200).json({ success: true, data: mappings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove Subject from Class
export const removeSubjectFromClass = async (req, res) => {
  try {
    const { class: className, subjectId, academicYear } = req.body;

    if (!className || !subjectId || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Class, subject ID, and academic year are required",
      });
    }

    const classSubject = await ClassSubject.findOne({
      class: className,
      academicYear: academicYear,
    });

    if (!classSubject) {
      return res.status(404).json({
        success: false,
        message: "Class subject mapping not found",
      });
    }

    // Remove subject from array
    classSubject.subjects = classSubject.subjects.filter(
      (id) => id.toString() !== subjectId
    );

    await classSubject.save();

    const populated = await ClassSubject.findById(classSubject._id).populate(
      "subjects",
      "subjectName subjectCode totalMarks passingMarks"
    );

    res.status(200).json({
      success: true,
      message: "Subject removed from class",
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Class Subject Mapping
export const deleteClassSubjectMapping = async (req, res) => {
  try {
    const { id } = req.params;

    const classSubject = await ClassSubject.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!classSubject) {
      return res.status(404).json({
        success: false,
        message: "Class subject mapping not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class subject mapping deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
