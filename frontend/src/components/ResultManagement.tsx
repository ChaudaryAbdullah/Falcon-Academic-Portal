import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  TrendingUp,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from "lucide-react";

import axios from "axios";
import { toast } from "sonner";

const BACKEND = import.meta.env.VITE_BACKEND;

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

interface ClassStats {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  averageObtained: number;
  averagePercentage: number;
  class: string;
  highestPercentage: number;
  lowestPercentage: number;
  passPercentage: number;
  pendingStudents: number;
  section: string;
  totalMarks: number;
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
  subjects: {
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
  }[];
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

interface ResultsManagementProps {
  students: Student[];
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  results: Result[];
  setResults: React.Dispatch<React.SetStateAction<Result[]>>;
}

const classes = [
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
];

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
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

export default function ResultsManagement({
  students,
  subjects,
  setSubjects,
  exams,
  setExams,
}: ResultsManagementProps) {
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manage-subjects");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [viewResults, setViewResults] = useState<Result[]>([]);
  const [studentsMarks, setStudentsMarks] = useState<Result[]>([]);
  const examTypes = ["1st Term", "Mid Term", "Final Term"];
  const academicYear = "2024-2025";

  // Helper function to get class label
  const getClassLabel = (value: string) => {
    const classObj = classes.find((c) => c.value === value);
    return classObj ? classObj.label : value;
  };

  // Helper function to get section label
  const getSectionLabel = (value: string) => {
    const sectionObj = sections.find((s) => s.value === value);
    return sectionObj ? sectionObj.label : value;
  };

  // Manage Subjects Tab - keeping your existing code
  const ManageSubjectsTab = () => {
    const [newSubject, setNewSubject] = useState({
      subjectName: "",
      subjectCode: "",
      totalMarks: 100,
      passingMarks: 50,
      classes: [] as string[],
    });

    // Add state for editing
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleAddSubject = async () => {
      try {
        if (!newSubject.subjectName || !newSubject.subjectCode) {
          toast.error("Subject name and code are required");
          return;
        }

        setLoading(true);
        const response = await axios.post(
          `${BACKEND}/api/subjects`,
          newSubject,
          { withCredentials: true }
        );
        setSubjects([...subjects, response.data.data]);
        setNewSubject({
          subjectName: "",
          subjectCode: "",
          totalMarks: 100,
          passingMarks: 50,
          classes: [],
        });
        toast.success("Subject added successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to add subject");
      } finally {
        setLoading(false);
      }
    };

    const handleEditSubject = (subject: Subject) => {
      setEditingSubject(subject);
      setNewSubject({
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        totalMarks: subject.totalMarks,
        passingMarks: subject.passingMarks,
        classes: subject.classes,
      });
      setIsEditing(true);
    };

    const handleUpdateSubject = async () => {
      if (!editingSubject) return;

      try {
        if (!newSubject.subjectName || !newSubject.subjectCode) {
          toast.error("Subject name and code are required");
          return;
        }

        setLoading(true);
        const response = await axios.put(
          `${BACKEND}/api/subjects/${editingSubject._id}`,
          newSubject,
          { withCredentials: true }
        );

        setSubjects(
          subjects.map((s) =>
            s._id === editingSubject._id ? response.data.data : s
          )
        );

        setNewSubject({
          subjectName: "",
          subjectCode: "",
          totalMarks: 100,
          passingMarks: 50,
          classes: [],
        });
        setEditingSubject(null);
        setIsEditing(false);
        toast.success("Subject updated successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to update subject");
      } finally {
        setLoading(false);
      }
    };

    const handleCancelEdit = () => {
      setNewSubject({
        subjectName: "",
        subjectCode: "",
        totalMarks: 100,
        passingMarks: 50,
        classes: [],
      });
      setEditingSubject(null);
      setIsEditing(false);
    };

    const handleDeleteSubject = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this subject?"))
        return;

      try {
        setLoading(true);
        await axios.delete(`${BACKEND}/api/subjects/${id}`, {
          withCredentials: true,
        });
        setSubjects(subjects.filter((s) => s._id !== id));
        toast.success("Subject deleted successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to delete subject");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {isEditing ? "Edit Subject" : "Add New Subject"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Subject Name</Label>
                <Input
                  value={newSubject.subjectName}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      subjectName: e.target.value,
                    })
                  }
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label>Subject Code</Label>
                <Input
                  value={newSubject.subjectCode}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      subjectCode: e.target.value,
                    })
                  }
                  placeholder="e.g., MATH"
                />
              </div>
              <div>
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={newSubject.totalMarks}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      totalMarks: parseInt(e.target.value) || 100,
                    })
                  }
                />
              </div>
              <div>
                <Label>Passing Marks</Label>
                <Input
                  type="number"
                  value={newSubject.passingMarks}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      passingMarks: parseInt(e.target.value) || 40,
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Assign to Classes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {classes.map((cls) => (
                    <Button
                      key={cls.value}
                      size="sm"
                      variant={
                        newSubject.classes.includes(cls.value)
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        if (newSubject.classes.includes(cls.value)) {
                          setNewSubject({
                            ...newSubject,
                            classes: newSubject.classes.filter(
                              (c) => c !== cls.value
                            ),
                          });
                        } else {
                          setNewSubject({
                            ...newSubject,
                            classes: [...newSubject.classes, cls.value],
                          });
                        }
                      }}
                    >
                      {cls.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleUpdateSubject}
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Update Subject
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleAddSubject}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Subject"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No subjects found. Add a subject to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Passing Marks</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow
                      key={subject._id}
                      className={
                        editingSubject?._id === subject._id ? "bg-blue-50" : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {subject.subjectName}
                      </TableCell>
                      <TableCell>{subject.subjectCode}</TableCell>
                      <TableCell>{subject.totalMarks}</TableCell>
                      <TableCell>{subject.passingMarks}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {subject.classes?.map((cls) => (
                            <Badge
                              key={cls}
                              variant="outline"
                              className="text-xs"
                            >
                              {getClassLabel(cls)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSubject(subject)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSubject(subject._id)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Manage Exams Tab - keeping your existing code
  const ManageExamsTab = () => {
    const [newExam, setNewExam] = useState({
      examName: "",
      examType: "",
      startDate: "",
      endDate: "",
      classes: [] as string[],
      academicYear: academicYear,
    });
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleAddExam = async () => {
      try {
        if (
          !newExam.examName ||
          !newExam.examType ||
          newExam.classes.length === 0
        ) {
          toast.error("Please fill all required fields");
          return;
        }

        setLoading(true);
        const response = await axios.post(
          `${BACKEND}/api/exams`,
          { ...newExam, status: "scheduled" },
          { withCredentials: true }
        );
        setExams([...exams, response.data.data]);
        setNewExam({
          examName: "",
          examType: "",
          startDate: "",
          endDate: "",
          classes: [],
          academicYear: academicYear,
        });
        toast.success("Exam scheduled successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to schedule exam");
      } finally {
        setLoading(false);
      }
    };

    const handleEditExam = (exam: Exam) => {
      setEditingExam(exam);
      setNewExam({
        examName: exam.examName,
        examType: exam.examType,
        startDate: exam.startDate,
        endDate: exam.endDate,
        classes: exam.classes,
        academicYear: exam.academicYear,
      });
      setIsEditing(true);
    };

    const handleUpdateExam = async () => {
      if (!editingExam) return;

      try {
        if (
          !newExam.examName ||
          !newExam.examType ||
          newExam.classes.length === 0
        ) {
          toast.error("Please fill all required fields");
          return;
        }

        setLoading(true);
        const response = await axios.put(
          `${BACKEND}/api/exams/${editingExam._id}`,
          newExam,
          { withCredentials: true }
        );

        setExams(
          exams.map((e) => (e._id === editingExam._id ? response.data.data : e))
        );

        setNewExam({
          examName: "",
          examType: "",
          startDate: "",
          endDate: "",
          classes: [],
          academicYear: academicYear,
        });
        setEditingExam(null);
        setIsEditing(false);
        toast.success("Exam updated successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to update exam");
      } finally {
        setLoading(false);
      }
    };

    const handleCancelEdit = () => {
      setNewExam({
        examName: "",
        examType: "",
        startDate: "",
        endDate: "",
        classes: [],
        academicYear: academicYear,
      });
      setEditingExam(null);
      setIsEditing(false);
    };

    const handleDeleteExam = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this exam?")) return;

      try {
        setLoading(true);
        await axios.delete(`${BACKEND}/api/exams/${id}`, {
          withCredentials: true,
        });
        setExams(exams.filter((e) => e._id !== id));
        toast.success("Exam deleted successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to delete exam");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {isEditing ? "Edit Exam" : "Schedule New Exam"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Exam Name</Label>
                <Input
                  value={newExam.examName}
                  onChange={(e) =>
                    setNewExam({ ...newExam, examName: e.target.value })
                  }
                  placeholder="e.g., 1st Term Exam 2024"
                />{" "}
              </div>
              <div>
                <Label>Exam Type</Label>
                <Select
                  value={newExam.examType}
                  onValueChange={(value) =>
                    setNewExam({ ...newExam, examType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Input value={academicYear} disabled />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newExam.startDate}
                  onChange={(e) =>
                    setNewExam({ ...newExam, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newExam.endDate}
                  onChange={(e) =>
                    setNewExam({ ...newExam, endDate: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Select Classes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {classes.map((cls) => (
                    <Button
                      key={cls.value}
                      size="sm"
                      variant={
                        newExam.classes.includes(cls.value)
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        if (newExam.classes.includes(cls.value)) {
                          setNewExam({
                            ...newExam,
                            classes: newExam.classes.filter(
                              (c) => c !== cls.value
                            ),
                          });
                        } else {
                          setNewExam({
                            ...newExam,
                            classes: [...newExam.classes, cls.value],
                          });
                        }
                      }}
                    >
                      {cls.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleUpdateExam}
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Update Exam
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleAddExam}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      "Schedule Exam"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No exams scheduled. Schedule an exam to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow
                      key={exam._id}
                      className={
                        editingExam?._id === exam._id ? "bg-blue-50" : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {exam.examName}
                      </TableCell>
                      <TableCell>{exam.examType}</TableCell>
                      <TableCell>{exam.academicYear}</TableCell>
                      <TableCell>
                        {exam.startDate
                          ? new Date(exam.startDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {exam.endDate
                          ? new Date(exam.endDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {exam.classes?.slice(0, 3).map((cls) => (
                            <Badge
                              key={cls}
                              variant="outline"
                              className="text-xs"
                            >
                              {getClassLabel(cls)}
                            </Badge>
                          ))}
                          {exam.classes?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{exam.classes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exam.status === "completed"
                              ? "default"
                              : exam.status === "ongoing"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditExam(exam)}
                            title="Edit Exam"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteExam(exam._id)}
                            title="Delete Exam"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Enter Marks Tab
  const EnterMarksTab = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const loadStudents = async () => {
      if (!selectedExam || !selectedClass || !selectedSection) {
        toast.error("Please select exam, class, and section");
        return;
      }

      // Don't allow "all" for Enter Marks
      if (selectedClass === "all" || selectedSection === "all") {
        toast.error(
          "Please select a specific class and section to enter marks"
        );
        return;
      }

      try {
        setLoading(true);

        console.log("Loading students with params:", {
          examId: selectedExam,
          class: selectedClass,
          section: selectedSection,
        });

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

        // Try to load existing results
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

        console.log("Results response:", resultsResponse.data);

        if (resultsResponse.data.data && resultsResponse.data.data.length > 0) {
          const loadedResults = [...resultsResponse.data.data];
          console.log(
            "Setting studentsMarks with:",
            loadedResults.length,
            "results"
          );
          setStudentsMarks(loadedResults);
          toast.success(`Results loaded for ${loadedResults.length} students!`);
        } else {
          // Create bulk results
          const classSubjects = subjects.filter((s) =>
            s.classes.includes(selectedClass)
          );

          if (classSubjects.length === 0) {
            toast.error("No subjects assigned to this class");
            setLoading(false);
            return;
          }

          console.log(
            "Creating bulk results for",
            studentsInClass.length,
            "students"
          );

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

          console.log("Bulk create response:", createResponse.data);

          if (createResponse.data.data && createResponse.data.data.length > 0) {
            const createdResults = [...createResponse.data.data];
            setStudentsMarks(createdResults);
            toast.success(
              `Created results for ${createdResults.length} students!`
            );
          } else {
            // Reload after creation
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
              const reloadedResults = [...newResultsResponse.data.data];
              setStudentsMarks(reloadedResults);
              toast.success(
                `Loaded ${reloadedResults.length} student records!`
              );
            } else {
              toast.error("Failed to load results after creation");
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

    const updateMarks = (
      resultId: string,
      subjectId: string,
      marks: string
    ) => {
      const marksValue = parseInt(marks) || 0;

      setStudentsMarks((prev) =>
        prev.map((result) => {
          if (result._id === resultId) {
            return {
              ...result,
              subjects: result.subjects.map((subject) => {
                if (subject.subjectId._id === subjectId) {
                  return {
                    ...subject,
                    obtainedMarks: marksValue,
                    // Update remarks immediately for better UX
                    remarks:
                      marksValue >= subject.passingMarks ? "Pass" : "Fail",
                  };
                }
                return subject;
              }),
            };
          }
          return result;
        })
      );
    };

    const handleSubmitResults = async () => {
      try {
        setLoading(true);

        const resultsToUpdate = studentsMarks.map((result) => ({
          resultId: result._id,
          subjects: result.subjects.map((s) => ({
            subjectId: s.subjectId._id,
            obtainedMarks: s.obtainedMarks,
            remarks: s.obtainedMarks >= s.passingMarks ? "Pass" : "Fail",
          })),
        }));

        console.log("Submitting results:", resultsToUpdate);

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

        toast.success("Results submitted successfully!");

        // Reload to show updated results with calculated positions
        loadStudents();
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

    return (
      <div className="space-y-6">
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
                <Select value={selectedExam} onValueChange={setSelectedExam}>
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
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
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
                  disabled={loading}
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

            {selectedClass !== "all" &&
              selectedSection !== "all" &&
              studentsInSelectedClass.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-900">
                      <strong>{studentsInSelectedClass.length}</strong> student
                      {studentsInSelectedClass.length !== 1 ? "s" : ""} found in{" "}
                      <strong>Class {getClassLabel(selectedClass)}</strong>,{" "}
                      <strong>
                        Section {getSectionLabel(selectedSection)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

            {selectedClass !== "all" &&
              selectedSection !== "all" &&
              studentsInSelectedClass.length === 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-900">
                      <strong>No students</strong> found in{" "}
                      <strong>Class {getClassLabel(selectedClass)}</strong>,{" "}
                      <strong>
                        Section {getSectionLabel(selectedSection)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

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
                    Class {getClassLabel(selectedClass)} - Section{" "}
                    {getSectionLabel(selectedSection)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Roll No</TableHead>
                      <TableHead className="min-w-[150px]">
                        Student Name
                      </TableHead>
                      {studentsMarks[0]?.subjects?.map((subject) => (
                        <TableHead
                          key={subject.subjectId._id}
                          className="min-w-[100px]"
                        >
                          <div>
                            <div className="font-medium">
                              {subject.subjectId.subjectName}
                            </div>
                            <div className="text-xs text-gray-500">
                              Max: {subject.totalMarks} | Pass:{" "}
                              {subject.passingMarks}
                            </div>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((result) => {
                      const totalObtained = result.subjects?.reduce(
                        (sum, s) => sum + (s.obtainedMarks || 0),
                        0
                      );
                      const totalMarks = result.subjects?.reduce(
                        (sum, s) => sum + s.totalMarks,
                        0
                      );
                      const percentage =
                        totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;
                      const hasFailed = result.subjects?.some(
                        (s) => s.obtainedMarks < s.passingMarks
                      );

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
                          {result.subjects?.map((subject) => (
                            <TableCell key={subject.subjectId._id}>
                              <Input
                                type="number"
                                min="0"
                                max={subject.totalMarks}
                                defaultValue={subject.obtainedMarks}
                                onBlur={(e) =>
                                  updateMarks(
                                    result._id,
                                    subject.subjectId._id,
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const val = e.currentTarget.value;
                                    const num = parseInt(val, 10);
                                    if (
                                      val !== "" &&
                                      !isNaN(num) &&
                                      num <= subject.totalMarks
                                    ) {
                                      updateMarks(
                                        result._id,
                                        subject.subjectId._id,
                                        e.currentTarget.value
                                      );
                                      e.currentTarget.blur();
                                    }
                                  }
                                }}
                                className="w-20"
                              />

                              {subject.obtainedMarks > 0 && (
                                <div className="text-xs mt-1">
                                  <Badge
                                    variant={
                                      subject.obtainedMarks >=
                                      subject.passingMarks
                                        ? "default"
                                        : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {subject.remarks ||
                                      (subject.obtainedMarks >=
                                      subject.passingMarks
                                        ? "Pass"
                                        : "Fail")}
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="font-bold">
                              <div className="text-lg">{totalObtained}</div>
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
                              variant={hasFailed ? "destructive" : "default"}
                              className="whitespace-nowrap"
                            >
                              {hasFailed ? "Has Failures" : "All Pass"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Component */}
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
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {studentsMarks.length}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Data Entered</p>
                    <p className="text-2xl font-bold text-green-600">
                      {
                        studentsMarks.filter((r) =>
                          r.subjects.some((s) => s.obtainedMarks > 0)
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {
                        studentsMarks.filter(
                          (r) => !r.subjects.some((s) => s.obtainedMarks > 0)
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Subjects</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {studentsMarks[0]?.subjects?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    Press{" "}
                    <kbd className="px-2 py-1 bg-gray-100 rounded">
                      Enter
                    </kbd>{" "}
                    to move to next field
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to reload? Any unsaved changes will be lost."
                          )
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
          !loading &&
          selectedExam &&
          selectedClass !== "all" &&
          selectedSection !== "all" && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">No results loaded yet</p>
                  <p className="text-sm mt-2">
                    Click "Load Students" to create or load results for{" "}
                    <strong>Class {getClassLabel(selectedClass)}</strong>,{" "}
                    <strong>Section {getSectionLabel(selectedSection)}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {!selectedExam && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <Edit className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">Select an exam to get started</p>
                <p className="text-sm mt-2">
                  Choose an exam, class, and section from the dropdowns above
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedExam &&
          (selectedClass === "all" || selectedSection === "all") && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-400" />
                  <p className="font-medium">
                    Please select a specific class and section
                  </p>
                  <p className="text-sm mt-2">
                    You need to select a specific class and section to enter
                    marks
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    );
  };

  // View Results Tab
  // View Results Tab with Pagination
  const ViewResultsTab = () => {
    // Add pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const loadResults = async () => {
      if (!selectedExam) {
        toast.error("Please select an exam");
        return;
      }

      try {
        setLoading(true);

        console.log("Loading view results with params:", {
          examId: selectedExam,
          class: selectedClass,
          section: selectedSection,
        });

        const response = await axios.get(`${BACKEND}/api/results/exam-class`, {
          params: {
            examId: selectedExam,
            ...(selectedClass &&
              selectedClass !== "all" && { class: selectedClass }),
            ...(selectedSection &&
              selectedSection !== "all" && { section: selectedSection }),
          },
          withCredentials: true,
        });

        console.log("View Results Response:", response.data);
        const loadedResults = response.data.data || [];
        setViewResults(loadedResults);
        setCurrentPage(1); // Reset to page 1 when loading new data

        toast.success(`Loaded ${loadedResults.length} results!`);
      } catch (err: any) {
        console.error("Error loading results:", err);
        toast.error(err.response?.data?.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    const handlePublishResults = async () => {
      if (!selectedExam) {
        toast.error("Please select an exam");
        return;
      }

      try {
        setLoading(true);
        await axios.post(
          `${BACKEND}/api/results/publish`,
          {
            examId: selectedExam,
            ...(selectedClass &&
              selectedClass !== "all" && { class: selectedClass }),
            ...(selectedSection &&
              selectedSection !== "all" && { section: selectedSection }),
          },
          { withCredentials: true }
        );
        toast.success("Results published successfully!");
        loadResults(); // Reload to show updated status
      } catch (err: any) {
        console.error("Error publishing results:", err);
        toast.error(err.response?.data?.message || "Failed to publish results");
      } finally {
        setLoading(false);
      }
    };

    // Calculate pagination
    const totalPages = Math.ceil(viewResults.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = viewResults.slice(startIndex, endIndex);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Filter Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Select Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
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
                <Label>Select Class (Optional)</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Select Section (Optional)</Label>
                <Select
                  value={selectedSection}
                  onValueChange={setSelectedSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
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
                  onClick={loadResults}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "View Results"
                  )}
                </Button>
              </div>
            </div>

            {/* Info Banner */}
            {viewResults.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    <strong>{viewResults.length}</strong> result
                    {viewResults.length !== 1 ? "s" : ""} loaded
                    {selectedClass !== "all" && (
                      <>
                        {" "}
                        for{" "}
                        <strong>Class {getClassLabel(selectedClass)}</strong>
                      </>
                    )}
                    {selectedSection !== "all" && (
                      <>
                        ,{" "}
                        <strong>
                          Section {getSectionLabel(selectedSection)}
                        </strong>
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {viewResults.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Results ({viewResults.length} student
                  {viewResults.length !== 1 ? "s" : ""})
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
                        <SelectItem value={viewResults.length.toString()}>
                          All
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePublishResults}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Publish Results
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Obtained</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResults.map((result) => (
                      <TableRow key={result._id}>
                        <TableCell>{result.studentId?.rollNumber}</TableCell>
                        <TableCell className="font-medium">
                          {result.studentId?.studentName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getClassLabel(result.class)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getSectionLabel(result.section)}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.totalMarks}</TableCell>
                        <TableCell className="font-semibold">
                          {result.totalObtainedMarks}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              result.percentage >= 80
                                ? "text-green-600"
                                : result.percentage >= 60
                                ? "text-blue-600"
                                : result.percentage >= 40
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.percentage?.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{result.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {result.position === 1 && (
                              <Trophy className="h-4 w-4 text-yellow-500" />
                            )}
                            {result.position === 2 && (
                              <Trophy className="h-4 w-4 text-gray-400" />
                            )}
                            {result.position === 3 && (
                              <Trophy className="h-4 w-4 text-orange-400" />
                            )}
                            <span className="font-semibold">
                              {result.position || "-"}
                            </span>
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
                          >
                            {result.result}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={result.isPublished ? "default" : "outline"}
                          >
                            {result.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Component */}
              {viewResults.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={viewResults.length}
                  itemsPerPage={itemsPerPage}
                />
              )}

              {/* Summary Stats */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {viewResults.length}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {viewResults.filter((r) => r.result === "Pass").length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {viewResults.filter((r) => r.result === "Fail").length}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average %</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {viewResults.length > 0
                      ? (
                          viewResults.reduce(
                            (sum, r) => sum + (r.percentage || 0),
                            0
                          ) / viewResults.length
                        ).toFixed(2)
                      : "0.00"}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          !loading &&
          selectedExam && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">No results found</p>
                  <p className="text-sm mt-2">
                    {selectedClass !== "all" || selectedSection !== "all"
                      ? "Try selecting different filters or ensure results have been entered for this exam."
                      : "Select filters and click 'View Results' to display student results."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {!selectedExam && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">Select an exam to view results</p>
                <p className="text-sm mt-2">
                  Choose an exam from the dropdown above to get started
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  // Reports Tab
  const ReportsTab = () => {
    const loadReports = async () => {
      if (!selectedExam) {
        toast.error("Please select an exam");
        return;
      }

      try {
        setLoading(true);

        console.log("Loading reports with params:", {
          examId: selectedExam,
          class: selectedClass,
          section: selectedSection,
        });

        // Load performance data
        const perfResponse = await axios.get(
          `${BACKEND}/api/results/subject-performance`,
          {
            params: {
              examId: selectedExam,
              ...(selectedClass &&
                selectedClass !== "all" && { class: selectedClass }),
              ...(selectedSection &&
                selectedSection !== "all" && { section: selectedSection }),
            },
            withCredentials: true,
          }
        );
        setPerformanceData(perfResponse.data.data || []);

        // Load class statistics
        const classResponse = await axios.get(
          `${BACKEND}/api/results/class-performance`,
          {
            params: {
              examId: selectedExam,
              ...(selectedClass &&
                selectedClass !== "all" && { class: selectedClass }),
              ...(selectedSection &&
                selectedSection !== "all" && { section: selectedSection }),
            },
            withCredentials: true,
          }
        );
        console.log("Class Response Full:", classResponse.data);
        console.log("Class Response Data Array:", classResponse.data.data);
        console.log("First Item:", classResponse.data.data?.[0]);

        const statsData = classResponse.data.data?.[0] || null;
        setClassStats(statsData);

        // Load top performers
        const topResponse = await axios.get(
          `${BACKEND}/api/results/top-performers`,
          {
            params: {
              examId: selectedExam,
              ...(selectedClass &&
                selectedClass !== "all" && { class: selectedClass }),
              ...(selectedSection &&
                selectedSection !== "all" && { section: selectedSection }),
              limit: 10,
            },
            withCredentials: true,
          }
        );
        console.log("Top Performers Response:", topResponse.data);
        setTopPerformers(topResponse.data.data || []);

        toast.success("Reports loaded successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Select Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
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
                <Label>Select Class (Optional)</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Select Section (Optional)</Label>
                <Select
                  value={selectedSection}
                  onValueChange={setSelectedSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
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
                  onClick={loadReports}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Statistics Cards */}
        {classStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold">
                      {classStats.totalStudents || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Passed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {classStats.passedStudents || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {classStats.failedStudents || 0}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pass Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {classStats.passPercentage?.toFixed(2) || 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subject Performance Table */}
        {performanceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Average Marks</TableHead>
                    <TableHead>Highest</TableHead>
                    <TableHead>Lowest</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((subject, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {subject.subjectName}
                      </TableCell>
                      <TableCell>{subject.averageMarks?.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">
                        {subject.highestMarks}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {subject.lowestMarks}
                      </TableCell>
                      <TableCell>
                        {subject.passPercentage?.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${subject.passPercentage || 0}%`,
                            }}
                          ></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top 10 Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          student.position === 1
                            ? "bg-yellow-100 text-yellow-700"
                            : student.position === 2
                            ? "bg-gray-100 text-gray-700"
                            : student.position === 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {student.position}
                      </div>
                      <div>
                        <p className="font-medium">
                          {student.studentId?.studentName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Roll No: {student.studentId?.rollNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {student.percentage?.toFixed(2)}%
                      </p>
                      <Badge variant="outline">{student.grade}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {!loading &&
          !classStats &&
          !performanceData.length &&
          !topPerformers.length && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">No reports generated yet</p>
                  <p className="text-sm mt-2">
                    Select an exam and click "Generate Report" to view
                    performance analytics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Results Management System</h1>
        <p className="text-gray-600">
          Manage subjects, schedule exams, enter marks, and generate
          comprehensive reports
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5 gap-4">
          <TabsTrigger
            value="manage-subjects"
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="manage-exams" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Exams</span>
          </TabsTrigger>
          <TabsTrigger value="enter-marks" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Enter Marks</span>
          </TabsTrigger>
          <TabsTrigger value="view-results" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">View Results</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage-subjects">
          <ManageSubjectsTab />
        </TabsContent>

        <TabsContent value="manage-exams">
          <ManageExamsTab />
        </TabsContent>

        <TabsContent value="enter-marks">
          <EnterMarksTab />
        </TabsContent>

        <TabsContent value="view-results">
          <ViewResultsTab />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
