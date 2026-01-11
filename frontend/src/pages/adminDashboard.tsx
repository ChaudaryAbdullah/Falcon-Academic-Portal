"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Users,
  GraduationCap,
  UserPlus,
  Plus,
  Receipt,
  Loader2,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import axios from "axios";
import { Toaster } from "sonner";

import { StudentManagement } from "../components/StudentManagment";
import { TeacherManagement } from "../components/TeacherManagment";
import { FeeManagement } from "../components/FeeManagment";
import FeeStructure from "../components/FeeStructure";
import StudentDiscount from "../components/StudentDiscount";
import FeeReports from "../components/FeeReports";
import { PaperFundManagement } from "../components/PaperFundManagement";
import ResultsManagement from "../components/ResultManagement";

const BACKEND = import.meta.env.VITE_BACKEND;

// Interfaces (keep all your existing interfaces here)
interface Student {
  _id: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  fatherCnic: string;
  motherCnic: string;
  bform: string;
  dob: string;
  section: string;
  gender: string;
  fPhoneNumber: string;
  mPhoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  class: string;
  email: string;
  password: string;
  address: string;
  discountCode: string;
  img?: { data: string; contentType: string };
}

interface Teacher {
  _id: string;
  fullName: string;
  fatherHusbandName: string;
  salary: string;
  cnic: string;
  dob: string;
  phoneNumber: string;
  email: string;
  password: string;
}

interface FeeStructureType {
  _id: string;
  className: string;
  tutionFee: number;
  examFee: number;
  paperFund: number;
  miscFee: number;
  createdAt: string;
  updatedAt: string;
}

interface FeeChallan {
  id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    mPhoneNumber: string;
    class: string;
    section: string;
    discountCode: string;
  };
  month: string;
  year: string;
  tutionFee: number;
  examFee: number;
  miscFee: number;
  totalAmount: number;
  remainingBalance: number;
  arrears: number;
  discount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
}

interface PaperFundChallan {
  id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    mPhoneNumber: string;
    class: string;
    section: string;
  };
  year: string;
  paperFund: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
  paidDate?: string;
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
    subjectId: { _id: string; subjectName: string; subjectCode: string };
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

interface LoadingState {
  students: boolean;
  teachers: boolean;
  feeStructure: boolean;
  studentDiscounts: boolean;
  challans: boolean;
  paperFundChallans: boolean;
  subjects: boolean;
  exams: boolean;
  results: boolean;
}

const TAB_REQUIREMENTS: Record<string, (keyof LoadingState)[]> = {
  dashboard: [],
  students: ["students"],
  teachers: ["teachers"],
  fees: ["students", "feeStructure", "studentDiscounts", "challans"],
  paperFund: ["students", "feeStructure", "paperFundChallans"],
  feeStructure: ["feeStructure"],
  studentDiscount: ["students"],
  "fee-reports": ["students"],
  results: ["students", "subjects", "exams", "results"],
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Initialize with empty arrays - render immediately, no null checks needed
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [feeStructure, setFeeStructure] = useState<FeeStructureType[]>([]);
  const [studentDiscounts, setStudentDiscounts] = useState<any[]>([]);
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [paperFundChallans, setPaperFundChallans] = useState<
    PaperFundChallan[]
  >([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [counts, setCounts] = useState({ students: 0, teachers: 0 });

  // Track loading state for each data type
  const [loading, setLoading] = useState<LoadingState>({
    students: true,
    teachers: true,
    feeStructure: true,
    studentDiscounts: true,
    challans: true,
    paperFundChallans: true,
    subjects: true,
    exams: true,
    results: true,
  });

  // Prevent double fetch in StrictMode
  const hasFetched = useRef(false);

  // 🚀 PREFETCH ALL DATA ON MOUNT - This is the key optimization
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const api = axios.create({
      baseURL: BACKEND,
      withCredentials: true,
    });

    // Helper to update loading state
    const setLoaded = (key: keyof LoadingState) => {
      setLoading((prev) => ({ ...prev, [key]: false }));
    };

    // Fire ALL requests simultaneously - don't wait for any to complete
    // Students
    api
      .get("/api/students")
      .then((res) => {
        const data = res.data.data || [];
        setStudents(data);
        setCounts((prev) => ({ ...prev, students: data.length }));
      })
      .catch(console.error)
      .finally(() => setLoaded("students"));

    // Teachers
    api
      .get("/api/teachers")
      .then((res) => {
        const data = res.data.data || [];
        setTeachers(data);
        setCounts((prev) => ({ ...prev, teachers: data.length }));
      })
      .catch(console.error)
      .finally(() => setLoaded("teachers"));

    // Fee Structure
    api
      .get("/api/fee-structures")
      .then((res) => setFeeStructure(res.data || []))
      .catch(console.error)
      .finally(() => setLoaded("feeStructure"));

    // Student Discounts
    api
      .get("/api/student-discounts")
      .then((res) => setStudentDiscounts(res.data || []))
      .catch(console.error)
      .finally(() => setLoaded("studentDiscounts"));

    // Fee Challans
    api
      .get("/api/fees")
      .then((res) => setChallans(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoaded("challans"));

    // Paper Fund Challans
    api
      .get("/api/paperFund")
      .then((res) => setPaperFundChallans(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoaded("paperFundChallans"));

    // Subjects
    api
      .get("/api/subjects", { params: { isActive: true } })
      .then((res) => setSubjects(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoaded("subjects"));

    // Exams
    api
      .get("/api/exams", { params: { isActive: true } })
      .then((res) => setExams(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoaded("exams"));

    // Results
    api
      .get("/api/results")
      .then((res) => setResults(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoaded("results"));
  }, []);

  // Check if tab data is ready
  const isTabReady = useCallback(
    (tab: string): boolean => {
      const requirements = TAB_REQUIREMENTS[tab] || [];
      if (requirements.length === 0) return true;
      return requirements.every((req) => !loading[req]);
    },
    [loading]
  );

  // Wrapper setters for child components
  const handleSetStudents = useCallback(
    (value: React.SetStateAction<Student[]>) => {
      setStudents((prev) =>
        typeof value === "function" ? value(prev) : value
      );
    },
    []
  );

  const handleSetTeachers = useCallback(
    (value: React.SetStateAction<Teacher[]>) => {
      setTeachers((prev) =>
        typeof value === "function" ? value(prev) : value
      );
    },
    []
  );

  const handleSetFeeStructure = useCallback(
    (value: React.SetStateAction<FeeStructureType[]>) => {
      setFeeStructure((prev) =>
        typeof value === "function" ? value(prev) : value
      );
    },
    []
  );

  const handleSetChallans = useCallback(
    (value: React.SetStateAction<FeeChallan[]>) => {
      setChallans((prev) =>
        typeof value === "function" ? value(prev) : value
      );
    },
    []
  );

  const handleSetPaperFundChallans = useCallback(
    (value: React.SetStateAction<PaperFundChallan[]>) => {
      setPaperFundChallans((prev) =>
        typeof value === "function" ? value(prev) : value
      );
    },
    []
  );

  const handleSetSubjects = useCallback(
    (value: React.SetStateAction<Subject[]>) => {
      setSubjects((prev) =>
        typeof value === "function" ? value(prev) : value
      );
    },
    []
  );

  const handleSetExams = useCallback((value: React.SetStateAction<Exam[]>) => {
    setExams((prev) => (typeof value === "function" ? value(prev) : value));
  }, []);

  const handleSetResults = useCallback(
    (value: React.SetStateAction<Result[]>) => {
      setResults((prev) => (typeof value === "function" ? value(prev) : value));
    },
    []
  );

  // Render content based on active tab
  const renderContent = () => {
    // Show minimal loading spinner only if required data isn't ready
    if (!isTabReady(activeTab)) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    switch (activeTab) {
      case "students":
        return (
          <StudentManagement
            students={students}
            setStudents={handleSetStudents}
          />
        );
      case "teachers":
        return (
          <TeacherManagement
            teachers={teachers}
            setTeachers={handleSetTeachers}
          />
        );
      case "fees":
        return (
          <FeeManagement
            students={students}
            feeStructure={feeStructure}
            setFeeStructure={handleSetFeeStructure}
            studentDiscounts={studentDiscounts}
            challans={challans}
            setChallans={handleSetChallans}
          />
        );
      case "paperFund":
        return (
          <PaperFundManagement
            students={students}
            feeStructure={feeStructure}
            challans={paperFundChallans}
            setChallans={handleSetPaperFundChallans}
          />
        );
      case "feeStructure":
        return (
          <FeeStructure
            feeStructures={feeStructure}
            setFeeStructures={handleSetFeeStructure}
          />
        );
      case "studentDiscount":
        return <StudentDiscount students={students} />;
      case "fee-reports":
        return <FeeReports students={students} />;
      case "results":
        return (
          <ResultsManagement
            students={students}
            subjects={subjects}
            setSubjects={handleSetSubjects}
            exams={exams}
            setExams={handleSetExams}
            results={results}
            setResults={handleSetResults}
          />
        );
      default:
        return (
          <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage students and teachers in your educational institution
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Students
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading.students ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      counts.students
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enrolled students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Teachers
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading.teachers ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      counts.teachers
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active teachers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Quick Actions
                  </CardTitle>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    size="sm"
                    className="w-full bg-blue-600"
                    onClick={() => setActiveTab("students")}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("teachers")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add Teacher
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("fees")}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Generate Challan
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-green-600 font-medium">
                    All Systems Online
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="md:ml-72 py-6 pr-6">
        <div className="space-y-6">{renderContent()}</div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
