import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  CheckCircle,
  Users,
  Loader2,
  Edit,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import axios from "axios";
import { toast } from "sonner";

const BACKEND = import.meta.env.VITE_BACKEND;

const allClasses = [
  { value: "Play", label: "Play" },
  { value: "Nursery", label: "Nursery" },
  { value: "Prep", label: "Prep" },
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
];

const sections = [
  { value: "Red", label: "Red" },
  { value: "Blue", label: "Blue" },
  { value: "Pink", label: "Pink" },
  { value: "Green", label: "Green" },
  { value: "Yellow", label: "Yellow" },
  { value: "White", label: "White" },
  { value: "Purple", label: "Purple" },
];

interface Student {
  _id: string;
  rollNumber: string;
  studentName: string;
  class: string;
  section: string;
}

interface Subject {
  _id: string;
  subjectName: string;
  subjectCode: string;
  totalMarks: number;
  passingMarks: number;
  classes: string[];
  isActive: boolean;
}

interface Exam {
  _id: string;
  examName: string;
  examType: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  classes: string[];
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  isActive: boolean;
}

interface ResultSubject {
  subjectId: {
    _id: string;
    subjectName: string;
    subjectCode: string;
  };
  totalMarks: number;
  obtainedMarks: number;
  passingMarks: number;
  grade: string;
  remarks: string;
}

interface SubjectGroup {
  code: string;
  displayName: string;
  subjects: ResultSubject[];
  totalMaxMarks: number;
  totalPassingMarks: number;
  totalObtainedMarks: number;
  isGrouped: boolean;
  isPassed: boolean;
  percentage: number;
  grade: string;
}

interface Result {
  _id: string;
  studentId: {
    _id: string;
    studentName: string;
    fatherName: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  examId: {
    _id: string;
    examName: string;
    examType: string;
    academicYear: string;
  };
  class: string;
  section: string;
  subjects: ResultSubject[];
  totalMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  grade: string;
  result: "Pass" | "Fail" | "Pending";
  position?: number;
  isPublished: boolean;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

interface EnterMarksTabProps {
  students: Student[];
  subjects: Subject[];
  exams: Exam[];
  studentsMarks: Result[];
  setStudentsMarks: React.Dispatch<React.SetStateAction<Result[]>>;
}

const sortResultsByRollNumber = (results: Result[]): Result[] => {
  return [...results].sort((a, b) => {
    const rollA = parseInt(a.studentId?.rollNumber || "0");
    const rollB = parseInt(b.studentId?.rollNumber || "0");
    return rollA - rollB;
  });
};

const getClassLabel = (value: string): string => {
  const classObj = allClasses.find((c) => c.value === value);
  return classObj ? classObj.label : value;
};

const getSectionLabel = (value: string): string => {
  const sectionObj = sections.find((s) => s.value === value);
  return sectionObj ? sectionObj.label : value;
};

// Calculate grade based on percentage
const calculateGrade = (percentage: number): string => {
  if (percentage >= 95) return "A++";
  else if (percentage >= 90) return "A+";
  else if (percentage >= 85) return "A";
  else if (percentage >= 80) return "B++";
  else if (percentage >= 75) return "B+";
  else if (percentage >= 70) return "B";
  else if (percentage >= 60) return "C";
  else if (percentage >= 50) return "D";
  else if (percentage >= 40) return "E";
  return "U";
};

// Group subjects by subject code
const groupSubjectsByCode = (subjects: ResultSubject[]): SubjectGroup[] => {
  if (!subjects || subjects.length === 0) return [];

  const groupMap = new Map<string, SubjectGroup>();

  subjects.forEach((subject) => {
    const code = subject.subjectId?.subjectCode || "OTHER";

    if (!groupMap.has(code)) {
      groupMap.set(code, {
        code,
        displayName: code,
        subjects: [],
        totalMaxMarks: 0,
        totalPassingMarks: 0,
        totalObtainedMarks: 0,
        isGrouped: false,
        isPassed: false,
        percentage: 0,
        grade: "",
      });
    }

    const group = groupMap.get(code)!;
    group.subjects.push(subject);
    group.totalMaxMarks += subject.totalMarks;
    group.totalPassingMarks += subject.passingMarks;
    group.totalObtainedMarks += subject.obtainedMarks ?? 0;
  });

  // Calculate group stats
  groupMap.forEach((group) => {
    group.isGrouped = group.subjects.length > 1;
    group.percentage =
      group.totalMaxMarks > 0
        ? (group.totalObtainedMarks / group.totalMaxMarks) * 100
        : 0;
    group.grade = calculateGrade(group.percentage);
    group.isPassed = group.totalObtainedMarks >= group.totalPassingMarks;
  });

  return Array.from(groupMap.values());
};

// Check if marks are entered (0 is valid, null/undefined is not)
const isMarksEntered = (obtainedMarks: number | null | undefined): boolean => {
  return obtainedMarks !== null && obtainedMarks !== undefined;
};

// Calculate overall result using GROUPED LOGIC
const calculateOverallResult = (
  subjects: ResultSubject[]
): "Pass" | "Fail" | "Pending" => {
  if (!subjects || subjects.length === 0) return "Pending";

  const groups = groupSubjectsByCode(subjects);

  // Check if all marks are entered
  const allMarksEntered = subjects.every((s) =>
    isMarksEntered(s.obtainedMarks)
  );

  if (!allMarksEntered) return "Pending";

  // Check each group
  for (const group of groups) {
    if (group.isGrouped) {
      // Grouped subjects - check group total only
      if (group.totalObtainedMarks < group.totalPassingMarks) {
        return "Fail";
      }
    } else {
      // Single subject - check individual pass/fail
      const s = group.subjects[0];
      if (s.obtainedMarks < s.passingMarks) {
        return "Fail";
      }
    }
  }

  return "Pass";
};

// Calculate result with partial marks entered
export const calculatePartialResult = (
  subjects: ResultSubject[]
): "Pass" | "Fail" | "Pending" => {
  if (!subjects || subjects.length === 0) return "Pending";

  const groups = groupSubjectsByCode(subjects);

  // Check if any marks are entered
  const hasAnyMarks = subjects.some((s) => isMarksEntered(s.obtainedMarks));
  if (!hasAnyMarks) return "Pending";

  // Check each group
  for (const group of groups) {
    const enteredSubjects = group.subjects.filter((s) =>
      isMarksEntered(s.obtainedMarks)
    );

    if (enteredSubjects.length === 0) continue;

    if (group.isGrouped) {
      // Grouped - only check if ALL subjects in group are entered
      if (enteredSubjects.length === group.subjects.length) {
        const totalObt = enteredSubjects.reduce(
          (sum, s) => sum + (s.obtainedMarks ?? 0),
          0
        );
        const totalPass = enteredSubjects.reduce(
          (sum, s) => sum + s.passingMarks,
          0
        );
        if (totalObt < totalPass) {
          return "Fail";
        }
      }
    } else {
      // Single subject - check individual
      if (enteredSubjects[0].obtainedMarks < enteredSubjects[0].passingMarks) {
        return "Fail";
      }
    }
  }

  // Check if all marks entered
  const allEntered = subjects.every((s) => isMarksEntered(s.obtainedMarks));
  if (allEntered) {
    return calculateOverallResult(subjects);
  }

  return "Pending";
};

const getGroupObtainedTotal = (subjectsList: ResultSubject[]): number => {
  return subjectsList.reduce((sum, s) => sum + (s.obtainedMarks ?? 0), 0);
};

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="w-10"
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ==================== MARKS INPUT COMPONENT ====================
// Separate component for marks input to handle local state properly

interface MarksInputProps {
  resultId: string;
  subjectId: string;
  initialValue: number | undefined | null;
  maxMarks: number;
  passingMarks: number;
  onUpdate: (resultId: string, subjectId: string, marks: number) => void;
  className?: string;
}

function MarksInput({
  resultId,
  subjectId,
  initialValue,
  maxMarks,
  passingMarks,
  onUpdate,
  className = "w-20",
}: MarksInputProps) {
  // Local state - empty string means not entered, "0" means zero
  const [localValue, setLocalValue] = useState<string>(() => {
    if (initialValue === undefined || initialValue === null) {
      return ""; // Not entered
    }
    return initialValue.toString(); // Could be "0"
  });

  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
      setLocalValue(val);
      setIsDirty(true);
    }
  };

  const handleBlur = () => {
    if (!isDirty) return;

    // Empty means "not entered" - don't update
    if (localValue === "" || localValue === "-") {
      return;
    }

    let numValue = parseFloat(localValue);

    if (isNaN(numValue)) {
      numValue = 0;
    }

    // Clamp to valid range
    if (numValue < 0) {
      numValue = 0;
      toast.error("Marks cannot be negative");
    }

    if (numValue > maxMarks) {
      numValue = maxMarks;
      toast.error(`Marks cannot exceed ${maxMarks}`);
    }

    // Round to 2 decimal places
    numValue = Math.round(numValue * 100) / 100;

    setLocalValue(numValue.toString());
    onUpdate(resultId, subjectId, numValue); // Pass the number (including 0)
    setIsDirty(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Determine display state
  const hasMarks = localValue !== "" && !isNaN(parseFloat(localValue));
  const numericValue = hasMarks ? parseFloat(localValue) : null;
  const isPassing = numericValue !== null && numericValue >= passingMarks;

  return (
    <div className="flex flex-col items-center">
      <Input
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${className} text-center`}
        placeholder="-"
      />
      {hasMarks && (
        <Badge
          variant={isPassing ? "default" : "destructive"}
          className="text-xs mt-1"
        >
          {isPassing ? "Pass" : "Fail"}
        </Badge>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function EnterMarksTab({
  students,
  subjects,
  exams,
  studentsMarks,
  setStudentsMarks,
}: EnterMarksTabProps) {
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const currentExam = useMemo(() => {
    return exams.find((exam) => exam._id === selectedExam);
  }, [exams, selectedExam]);

  const availableClasses = useMemo(() => {
    if (
      !currentExam ||
      !currentExam.classes ||
      currentExam.classes.length === 0
    ) {
      return [];
    }
    return allClasses.filter((cls) => currentExam.classes.includes(cls.value));
  }, [currentExam]);

  const handleExamChange = (examId: string) => {
    setSelectedExam(examId);
    setSelectedClass("");
    setSelectedSection("");
    setStudentsMarks([]);
  };

  const isClassValidForExam = useMemo(() => {
    if (!selectedClass || !currentExam) return false;
    return currentExam.classes?.includes(selectedClass);
  }, [selectedClass, currentExam]);

  const loadStudents = async () => {
    if (!selectedExam) {
      toast.error("Please select an exam");
      return;
    }

    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    if (!selectedSection) {
      toast.error("Please select a section");
      return;
    }

    if (!isClassValidForExam) {
      toast.error(
        `${getClassLabel(
          selectedClass
        )} is not included in this exam. Please select a valid class.`
      );
      return;
    }

    try {
      setLoading(true);

      const studentsInClass = students.filter(
        (s) => s.class === selectedClass && s.section === selectedSection
      );

      if (studentsInClass.length === 0) {
        toast.error(
          `No students found in Class ${getClassLabel(
            selectedClass
          )}, Section ${getSectionLabel(selectedSection)}`
        );
        setLoading(false);
        return;
      }

      // Step 1: Get existing results
      const resultsResponse = await axios.get(
        `${BACKEND}/api/results/exam-class`,
        {
          params: {
            examId: selectedExam,
            class: selectedClass,
            section: selectedSection,
          },
          withCredentials: true,
        }
      );

      const existingResults = resultsResponse.data.data || [];

      // Step 2: Check if all students have results
      const existingStudentIds = new Set(
        existingResults.map((r: Result) => r.studentId._id)
      );

      const missingStudents = studentsInClass.filter(
        (s) => !existingStudentIds.has(s._id)
      );

      // Step 3: If there are missing students, create results for them
      if (missingStudents.length > 0) {
        console.log(
          `Creating results for ${missingStudents.length} new students`
        );

        const classSubjects = subjects.filter((s) =>
          s.classes.includes(selectedClass)
        );

        if (classSubjects.length === 0) {
          toast.error("No subjects assigned to this class");
          if (existingResults.length > 0) {
            setStudentsMarks(sortResultsByRollNumber(existingResults));
          }
          setLoading(false);
          return;
        }

        // Create results for missing students one by one
        const createPromises = missingStudents.map(async (student) => {
          try {
            const createData = {
              studentId: student._id,
              examId: selectedExam,
              class: selectedClass,
              section: selectedSection,
              subjects: classSubjects.map((s) => ({
                subjectId: s._id,
                totalMarks: s.totalMarks,
                passingMarks: s.passingMarks,
              })),
            };

            const response = await axios.post(
              `${BACKEND}/api/results`,
              createData,
              { withCredentials: true }
            );

            return response.data.data;
          } catch (error) {
            console.error(
              `Failed to create result for student ${student._id}:`,
              error
            );
            return null;
          }
        });

        const newResults = await Promise.all(createPromises);
        const successfulResults = newResults.filter((r) => r !== null);

        if (successfulResults.length > 0) {
          toast.success(
            `Created results for ${successfulResults.length} new students!`
          );
        }

        // Step 4: Reload all results
        await new Promise((resolve) => setTimeout(resolve, 500));

        const updatedResultsResponse = await axios.get(
          `${BACKEND}/api/results/exam-class`,
          {
            params: {
              examId: selectedExam,
              class: selectedClass,
              section: selectedSection,
            },
            withCredentials: true,
          }
        );

        const allResults = updatedResultsResponse.data.data || [];
        setStudentsMarks(sortResultsByRollNumber(allResults));

        toast.success(
          `Loaded ${allResults.length} total students (${missingStudents.length} newly added)`
        );
      } else {
        // All students already have results
        if (existingResults.length > 0) {
          setStudentsMarks(sortResultsByRollNumber(existingResults));
          toast.success(
            `Results loaded for ${existingResults.length} students!`
          );
        } else {
          // No results exist at all - create for all students
          const classSubjects = subjects.filter((s) =>
            s.classes.includes(selectedClass)
          );

          if (classSubjects.length === 0) {
            toast.error("No subjects assigned to this class");
            setLoading(false);
            return;
          }

          const bulkData = {
            examId: selectedExam,
            class: selectedClass,
            section: selectedSection,
            subjects: classSubjects.map((s) => ({
              subjectId: s._id,
              totalMarks: s.totalMarks,
              passingMarks: s.passingMarks,
            })),
          };

          const createResponse = await axios.post(
            `${BACKEND}/api/results/bulk`,
            bulkData,
            { withCredentials: true }
          );

          if (createResponse.data.data && createResponse.data.data.length > 0) {
            setStudentsMarks(sortResultsByRollNumber(createResponse.data.data));
            toast.success(
              `Created results for ${createResponse.data.data.length} students!`
            );
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newResultsResponse = await axios.get(
              `${BACKEND}/api/results/exam-class`,
              {
                params: {
                  examId: selectedExam,
                  class: selectedClass,
                  section: selectedSection,
                },
                withCredentials: true,
              }
            );

            if (
              newResultsResponse.data.data &&
              newResultsResponse.data.data.length > 0
            ) {
              setStudentsMarks(
                sortResultsByRollNumber(newResultsResponse.data.data)
              );
              toast.success(
                `Loaded ${newResultsResponse.data.data.length} student records!`
              );
            } else {
              toast.error("Failed to load results after creation");
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
    setCurrentPage(1);
  };

  // Update marks in parent state
  const updateMarks = (resultId: string, subjectId: string, marks: number) => {
    setStudentsMarks((prev) => {
      const updated = prev.map((result) => {
        if (result._id === resultId) {
          // Update the specific subject
          const updatedSubjects = result.subjects.map((subject) => {
            if (subject.subjectId._id === subjectId) {
              const subjectPercentage =
                subject.totalMarks > 0 ? (marks / subject.totalMarks) * 100 : 0;
              return {
                ...subject,
                obtainedMarks: marks,
                grade: calculateGrade(subjectPercentage),
                remarks: marks >= subject.passingMarks ? "Pass" : "Fail",
              };
            }
            return subject;
          });

          // Calculate totals
          const subjectsWithMarks = updatedSubjects.filter((s) =>
            isMarksEntered(s.obtainedMarks)
          );

          const totalMarks = updatedSubjects.reduce(
            (sum, s) => sum + s.totalMarks,
            0
          );
          const totalObtainedMarks = subjectsWithMarks.reduce(
            (sum, s) => sum + (s.obtainedMarks ?? 0),
            0
          );
          const percentage =
            totalMarks > 0 ? (totalObtainedMarks / totalMarks) * 100 : 0;
          const grade = calculateGrade(percentage);

          // Determine result status using GROUPED LOGIC
          const resultStatus = calculatePartialResult(updatedSubjects);

          return {
            ...result,
            subjects: updatedSubjects,
            totalMarks,
            totalObtainedMarks,
            percentage,
            grade,
            result: resultStatus,
          };
        }
        return result;
      });

      // Maintain sorting after update
      return sortResultsByRollNumber(updated);
    });
  };

  const handleSubmitResults = async () => {
    if (!isClassValidForExam) {
      toast.error("Invalid class for this exam. Cannot submit results.");
      return;
    }

    const hasAnyMarks = studentsMarks.some((r) =>
      r.subjects.some(
        (s) => s.obtainedMarks !== undefined && s.obtainedMarks !== null
      )
    );

    if (!hasAnyMarks) {
      toast.error(
        "Please enter marks for at least one student before submitting."
      );
      return;
    }

    try {
      setLoading(true);

      const resultsToUpdate = studentsMarks.map((result) => ({
        resultId: result._id,
        subjects: result.subjects.map((s) => ({
          subjectId: s.subjectId._id,
          obtainedMarks:
            s.obtainedMarks !== undefined && s.obtainedMarks !== null
              ? s.obtainedMarks
              : null,
        })),
      }));

      await axios.post(
        `${BACKEND}/api/results/bulk-update`,
        { results: resultsToUpdate },
        { withCredentials: true }
      );

      await axios.post(
        `${BACKEND}/api/results/calculate-positions`,
        {
          examId: selectedExam,
          class: selectedClass,
          section: selectedSection,
        },
        { withCredentials: true }
      );

      toast.success("Results submitted and calculated successfully!");
      await loadStudents(); // This will reload and sort automatically
    } catch (err: any) {
      console.error("Error submitting results:", err);
      toast.error(err.response?.data?.message || "Failed to submit results");
    } finally {
      setLoading(false);
    }
  };
  const totalPages = Math.ceil(studentsMarks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = studentsMarks.slice(startIndex, endIndex);

  const studentsInSelectedClass = students.filter(
    (s) => s.class === selectedClass && s.section === selectedSection
  );

  const subjectGroups =
    studentsMarks.length > 0
      ? groupSubjectsByCode(studentsMarks[0].subjects)
      : [];

  const hasGroupedSubjects = subjectGroups.some((g) => g.subjects.length > 1);

  const stats = useMemo(() => {
    const total = studentsMarks.length;
    const withMarks = studentsMarks.filter((r) =>
      r.subjects.some(
        (s) => s.obtainedMarks !== undefined && s.obtainedMarks !== null
      )
    ).length;
    const pending = total - withMarks;
    const passed = studentsMarks.filter((r) => r.result === "Pass").length;
    const failed = studentsMarks.filter((r) => r.result === "Fail").length;

    return { total, withMarks, pending, passed, failed };
  }, [studentsMarks]);

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Select Exam and Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Select Exam</Label>
              <Select value={selectedExam} onValueChange={handleExamChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.examName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Class</Label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={!selectedExam || availableClasses.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedExam
                        ? "Select exam first"
                        : availableClasses.length === 0
                        ? "No classes for this exam"
                        : "Select class"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Section</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedClass ? "Select class first" : "Select section"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.value} value={section.value}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadStudents}
                className="w-full"
                disabled={
                  loading || !selectedExam || !selectedClass || !selectedSection
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load Students"
                )}
              </Button>
            </div>
          </div>

          {currentExam && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">
                  Exam Classes:
                </span>
                {currentExam.classes?.map((cls) => (
                  <Badge key={cls} variant="outline" className="text-xs">
                    {getClassLabel(cls)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedClass &&
            selectedSection &&
            studentsInSelectedClass.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    <strong>{studentsInSelectedClass.length}</strong> student
                    {studentsInSelectedClass.length !== 1 ? "s" : ""} found in{" "}
                    <strong>Class {getClassLabel(selectedClass)}</strong>,{" "}
                    <strong>Section {getSectionLabel(selectedSection)}</strong>
                  </span>
                </div>
              </div>
            )}

          {selectedClass &&
            selectedSection &&
            studentsInSelectedClass.length === 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-900">
                    <strong>No students</strong> found in{" "}
                    <strong>Class {getClassLabel(selectedClass)}</strong>,{" "}
                    <strong>Section {getSectionLabel(selectedSection)}</strong>
                  </span>
                </div>
              </div>
            )}

          {selectedExam && selectedClass && !isClassValidForExam && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-900">
                  <strong>Warning:</strong> {getClassLabel(selectedClass)} is
                  not included in the selected exam. Please select a valid
                  class.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Entry Table */}
      {studentsMarks.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Enter Marks - {studentsMarks.length} Student
                {studentsMarks.length !== 1 ? "s" : ""}
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Rows per page:</Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value={studentsMarks.length.toString()}>
                        All
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="outline" className="text-sm">
                  {getClassLabel(selectedClass)} - Section{" "}
                  {getSectionLabel(selectedSection)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {hasGroupedSubjects && (
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16 border-b-0" rowSpan={2}>
                        Roll No
                      </TableHead>
                      <TableHead
                        className="min-w-[150px] border-b-0"
                        rowSpan={2}
                      >
                        Student Name
                      </TableHead>
                      {subjectGroups.map((group) => (
                        <React.Fragment key={`header-${group.code}`}>
                          {group.subjects.length === 1 ? (
                            <TableHead
                              rowSpan={2}
                              className="min-w-[100px] text-center border-l"
                            >
                              <div>
                                <div className="font-medium">
                                  {group.subjects[0].subjectId.subjectName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Max: {group.subjects[0].totalMarks} | Pass:{" "}
                                  {group.subjects[0].passingMarks}
                                </div>
                              </div>
                            </TableHead>
                          ) : (
                            <TableHead
                              colSpan={group.subjects.length + 1}
                              className="text-center bg-blue-50 border-l border-blue-200"
                            >
                              <div className="font-bold text-blue-800">
                                {group.displayName}
                              </div>
                              <div className="text-xs text-blue-600">
                                Total Max: {group.totalMaxMarks} | Pass:{" "}
                                {group.totalPassingMarks}
                              </div>
                            </TableHead>
                          )}
                        </React.Fragment>
                      ))}
                      <TableHead
                        className="min-w-[100px] border-b-0"
                        rowSpan={2}
                      >
                        Grand Total
                      </TableHead>
                      <TableHead className="border-b-0" rowSpan={2}>
                        Result
                      </TableHead>
                    </TableRow>
                  )}
                  <TableRow>
                    {!hasGroupedSubjects && (
                      <>
                        <TableHead className="w-16">Roll No</TableHead>
                        <TableHead className="min-w-[150px]">
                          Student Name
                        </TableHead>
                      </>
                    )}
                    {subjectGroups.map((group) => (
                      <React.Fragment key={`subheader-${group.code}`}>
                        {group.subjects.length === 1 ? (
                          !hasGroupedSubjects && (
                            <TableHead className="min-w-[100px] text-center">
                              <div>
                                <div className="font-medium">
                                  {group.subjects[0].subjectId.subjectName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Max: {group.subjects[0].totalMarks} | Pass:{" "}
                                  {group.subjects[0].passingMarks}
                                </div>
                              </div>
                            </TableHead>
                          )
                        ) : (
                          <>
                            {group.subjects.map((subject, idx) => (
                              <TableHead
                                key={`sub-${subject.subjectId._id}`}
                                className={`min-w-[90px] text-center bg-blue-50/50 ${
                                  idx === 0 ? "border-l border-blue-200" : ""
                                }`}
                              >
                                <div>
                                  <div className="font-medium text-xs">
                                    {subject.subjectId.subjectName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Max: {subject.totalMarks}
                                  </div>
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="min-w-[80px] bg-blue-100 border-l-2 border-blue-300 text-center">
                              <div>
                                <div className="font-bold text-sm text-blue-800">
                                  Total
                                </div>
                                <div className="text-xs text-blue-600">
                                  Max: {group.totalMaxMarks}
                                </div>
                              </div>
                            </TableHead>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                    {!hasGroupedSubjects && (
                      <>
                        <TableHead className="min-w-[100px]">Total</TableHead>
                        <TableHead>Result</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((result) => {
                    const resultGroups = groupSubjectsByCode(result.subjects);
                    const totalObtained = result.subjects?.reduce(
                      (sum, s) => sum + (s.obtainedMarks ?? 0),
                      0
                    );
                    const totalMarks = result.subjects?.reduce(
                      (sum, s) => sum + s.totalMarks,
                      0
                    );
                    const percentage =
                      totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;

                    return (
                      <TableRow key={result._id}>
                        <TableCell className="font-medium">
                          {result.studentId?.rollNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {result.studentId?.studentName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.studentId?.fatherName}
                            </div>
                          </div>
                        </TableCell>
                        {resultGroups.map((group) => (
                          <React.Fragment
                            key={`row-${result._id}-${group.code}`}
                          >
                            {group.subjects.length === 1 ? (
                              <TableCell className="border-l">
                                <MarksInput
                                  key={`${result._id}-${group.subjects[0].subjectId._id}`}
                                  resultId={result._id}
                                  subjectId={group.subjects[0].subjectId._id}
                                  initialValue={group.subjects[0].obtainedMarks}
                                  maxMarks={group.subjects[0].totalMarks}
                                  passingMarks={group.subjects[0].passingMarks}
                                  onUpdate={updateMarks}
                                  className="w-20"
                                />
                              </TableCell>
                            ) : (
                              <>
                                {group.subjects.map((subject, idx) => (
                                  <TableCell
                                    key={`cell-${result._id}-${subject.subjectId._id}`}
                                    className={`bg-blue-50/30 ${
                                      idx === 0
                                        ? "border-l border-blue-200"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex flex-col items-center">
                                      <MarksInput
                                        key={`${result._id}-${subject.subjectId._id}`}
                                        resultId={result._id}
                                        subjectId={subject.subjectId._id}
                                        initialValue={subject.obtainedMarks}
                                        maxMarks={subject.totalMarks}
                                        passingMarks={subject.passingMarks}
                                        onUpdate={updateMarks}
                                        className="w-16"
                                      />
                                      <span className="text-xs text-gray-400 mt-1">
                                        /{subject.totalMarks}
                                      </span>
                                    </div>
                                  </TableCell>
                                ))}
                                <TableCell className="bg-blue-100 border-l-2 border-blue-300">
                                  <div className="text-center">
                                    <div className="font-bold text-lg text-blue-800">
                                      {getGroupObtainedTotal(
                                        group.subjects
                                      ).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      / {group.totalMaxMarks}
                                    </div>
                                    {group.subjects.some(
                                      (s) =>
                                        s.obtainedMarks !== undefined &&
                                        s.obtainedMarks !== null
                                    ) && (
                                      <Badge
                                        variant={
                                          getGroupObtainedTotal(
                                            group.subjects
                                          ) >= group.totalPassingMarks
                                            ? "default"
                                            : "destructive"
                                        }
                                        className="text-xs mt-1"
                                      >
                                        {getGroupObtainedTotal(
                                          group.subjects
                                        ) >= group.totalPassingMarks
                                          ? "Pass"
                                          : "Fail"}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </>
                            )}
                          </React.Fragment>
                        ))}
                        <TableCell>
                          <div className="font-bold text-center">
                            <div className="text-lg">
                              {totalObtained.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">
                              / {totalMarks}
                            </div>
                            <div className="text-sm text-blue-600 mt-1">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              result.result === "Pass"
                                ? "default"
                                : result.result === "Fail"
                                ? "destructive"
                                : "outline"
                            }
                            className={
                              result.result === "Pending"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : ""
                            }
                          >
                            {result.result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {studentsMarks.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={studentsMarks.length}
                itemsPerPage={itemsPerPage}
              />
            )}

            {/* Summary and Actions */}
            <div className="mt-6 space-y-4">
              {hasGroupedSubjects && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Grouped Subjects:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {subjectGroups
                      .filter((g) => g.subjects.length > 1)
                      .map((group) => (
                        <div
                          key={group.code}
                          className="bg-white px-3 py-1 rounded border border-blue-200"
                        >
                          <span className="font-medium">
                            {group.displayName}:
                          </span>{" "}
                          {group.subjects
                            .map((s) => s.subjectId.subjectName)
                            .join(" + ")}
                          <span className="text-gray-500 ml-2">
                            (Total: {group.totalMaxMarks})
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.passed}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.failed}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Subject Groups</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {subjectGroups.length}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  Press{" "}
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> or
                  click outside to save. Type{" "}
                  <kbd className="px-2 py-1 bg-gray-100 rounded">0</kbd> for
                  zero marks.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (
                        window.confirm("Reload? Unsaved changes will be lost.")
                      ) {
                        loadStudents();
                      }
                    }}
                    disabled={loading}
                  >
                    Reload Data
                  </Button>
                  <Button
                    onClick={handleSubmitResults}
                    disabled={loading}
                    className="min-w-[150px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submit Results
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {!selectedExam && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Edit className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">Select an exam to get started</p>
                  <p className="text-sm mt-2">
                    Choose an exam from the dropdown above
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedExam && availableClasses.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-400" />
                  <p className="font-medium">
                    No classes assigned to this exam
                  </p>
                  <p className="text-sm mt-2">
                    Please edit the exam and assign classes first
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedExam && availableClasses.length > 0 && !selectedClass && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">Select a class</p>
                  <p className="text-sm mt-2">
                    Choose a class from the available options for this exam
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedExam && selectedClass && !selectedSection && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">Select a section</p>
                  <p className="text-sm mt-2">
                    Choose a section to load students
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedExam &&
            selectedClass &&
            selectedSection &&
            !loading &&
            studentsMarks.length === 0 && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium">No results loaded yet</p>
                    <p className="text-sm mt-2">
                      Click "Load Students" to create or load results for{" "}
                      <strong>Class {getClassLabel(selectedClass)}</strong>,{" "}
                      <strong>
                        Section {getSectionLabel(selectedSection)}
                      </strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
        </>
      )}
    </div>
  );
}
