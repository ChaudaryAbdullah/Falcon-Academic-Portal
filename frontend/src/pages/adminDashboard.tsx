"use client";

import { useEffect, useState, Suspense, lazy, useCallback } from "react";
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

// Lazy load components
const StudentManagement = lazy(() =>
  import("../components/StudentManagment").then((module) => ({
    default: module.StudentManagement,
  }))
);
const TeacherManagement = lazy(() =>
  import("../components/TeacherManagment").then((module) => ({
    default: module.TeacherManagement,
  }))
);
const FeeManagement = lazy(() =>
  import("../components/FeeManagment").then((module) => ({
    default: module.FeeManagement,
  }))
);
const FeeStructure = lazy(() => import("../components/FeeStructure"));
const StudentDiscount = lazy(() => import("../components/StudentDiscount"));
const FeeReports = lazy(() => import("../components/FeeReports"));
const PaperFundManagement = lazy(() =>
  import("../components/PaperFundManagement").then((module) => ({
    default: module.PaperFundManagement,
  }))
);
const ResultsManagement = lazy(() => import("../components/ResultManagement"));

const BACKEND = import.meta.env.VITE_BACKEND;

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    <span className="mt-4 text-gray-600 text-lg">Loading...</span>
  </div>
);

// All interfaces...
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
  img?: {
    data: string;
    contentType: string;
  };
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

const TAB_DATA_REQUIREMENTS: Record<string, string[]> = {
  dashboard: ["counts"],
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

  // Data states
  const [students, setStudents] = useState<Student[] | null>(null);
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [feeStructure, setFeeStructure] = useState<FeeStructureType[] | null>(
    null
  );
  const [studentDiscounts, setStudentDiscounts] = useState<any[] | null>(null);
  const [challans, setChallans] = useState<FeeChallan[] | null>(null);
  const [paperFundChallans, setPaperFundChallans] = useState<
    PaperFundChallan[] | null
  >(null);
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  const [counts, setCounts] = useState<{
    students: number;
    teachers: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState<Set<string>>(new Set());

  isLoading;
  // ✅ WRAPPER SETTERS - These convert null types to non-null types
  const handleSetStudents = useCallback(
    (value: React.SetStateAction<Student[]>) => {
      setStudents((prev) => {
        const currentValue = prev || [];
        return typeof value === "function" ? value(currentValue) : value;
      });
    },
    []
  );

  const handleSetTeachers = useCallback(
    (value: React.SetStateAction<Teacher[]>) => {
      setTeachers((prev) => {
        const currentValue = prev || [];
        return typeof value === "function" ? value(currentValue) : value;
      });
    },
    []
  );

  const handleSetFeeStructure = useCallback(
    (value: React.SetStateAction<FeeStructureType[]>) => {
      setFeeStructure((prev) => {
        const currentValue = prev || [];
        return typeof value === "function" ? value(currentValue) : value;
      });
    },
    []
  );

  const handleSetChallans = useCallback(
    (value: React.SetStateAction<FeeChallan[]>) => {
      setChallans((prev) => {
        const currentValue = prev || [];
        return typeof value === "function" ? value(currentValue) : value;
      });
    },
    []
  );

  const handleSetPaperFundChallans = useCallback(
    (value: React.SetStateAction<PaperFundChallan[]>) => {
      setPaperFundChallans((prev) => {
        const currentValue = prev || [];
        return typeof value === "function" ? value(currentValue) : value;
      });
    },
    []
  );

  const handleSetSubjects = useCallback(
    (value: React.SetStateAction<Subject[]>) => {
      setSubjects((prev) => {
        const currentValue = prev || [];
        return typeof value === "function" ? value(currentValue) : value;
      });
    },
    []
  );

  const handleSetExams = useCallback((value: React.SetStateAction<Exam[]>) => {
    setExams((prev) => {
      const currentValue = prev || [];
      return typeof value === "function" ? value(currentValue) : value;
    });
  }, []);

  const handleSetResults = useCallback(
    (value: React.SetStateAction<Result[]>) => {
      setResults((prev) => {
        const currentValue = prev || [];
        return typeof value === "function" ? value(currentValue) : value;
      });
    },
    []
  );

  // Fetch functions
  const fetchCounts = useCallback(async () => {
    if (loadedData.has("counts")) return;
    try {
      const [studentsRes, teachersRes] = await Promise.all([
        axios.get(`${BACKEND}/api/students`, {
          withCredentials: true,
          params: { limit: 1, countOnly: true },
        }),
        axios.get(`${BACKEND}/api/teachers`, {
          withCredentials: true,
          params: { limit: 1, countOnly: true },
        }),
      ]);
      setCounts({
        students: studentsRes.data.total || studentsRes.data.data?.length || 0,
        teachers: teachersRes.data.total || teachersRes.data.data?.length || 0,
      });
      setLoadedData((prev) => new Set(prev).add("counts"));
    } catch (error) {
      console.error("Error fetching counts:", error);
      setCounts({ students: 0, teachers: 0 });
    }
  }, [loadedData]);

  const fetchStudents = useCallback(async () => {
    if (loadedData.has("students")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/students`, {
        withCredentials: true,
      });
      setStudents(res.data.data);
      setLoadedData((prev) => new Set(prev).add("students"));
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  }, [loadedData]);

  const fetchTeachers = useCallback(async () => {
    if (loadedData.has("teachers")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/teachers`, {
        withCredentials: true,
      });
      setTeachers(res.data.data);
      setLoadedData((prev) => new Set(prev).add("teachers"));
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    }
  }, [loadedData]);

  const fetchFeeStructure = useCallback(async () => {
    if (loadedData.has("feeStructure")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/fee-structures`, {
        withCredentials: true,
      });
      setFeeStructure(res.data);
      setLoadedData((prev) => new Set(prev).add("feeStructure"));
    } catch (error) {
      console.error("Error fetching fee structure:", error);
      setFeeStructure([]);
    }
  }, [loadedData]);

  const fetchStudentDiscounts = useCallback(async () => {
    if (loadedData.has("studentDiscounts")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/student-discounts`, {
        withCredentials: true,
      });
      setStudentDiscounts(res.data);
      setLoadedData((prev) => new Set(prev).add("studentDiscounts"));
    } catch (error) {
      console.error("Error fetching student discounts:", error);
      setStudentDiscounts([]);
    }
  }, [loadedData]);

  const fetchChallans = useCallback(async () => {
    if (loadedData.has("challans")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/fees`, {
        withCredentials: true,
      });
      setChallans(res.data.data);
      setLoadedData((prev) => new Set(prev).add("challans"));
    } catch (error) {
      console.error("Error fetching challans:", error);
      setChallans([]);
    }
  }, [loadedData]);

  const fetchPaperFundChallans = useCallback(async () => {
    if (loadedData.has("paperFundChallans")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/paperFund`, {
        withCredentials: true,
      });
      setPaperFundChallans(res.data.data);
      setLoadedData((prev) => new Set(prev).add("paperFundChallans"));
    } catch (error) {
      console.error("Error fetching paper fund challans:", error);
      setPaperFundChallans([]);
    }
  }, [loadedData]);

  const fetchSubjects = useCallback(async () => {
    if (loadedData.has("subjects")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/subjects`, {
        params: { isActive: true },
        withCredentials: true,
      });
      setSubjects(res.data.data);
      setLoadedData((prev) => new Set(prev).add("subjects"));
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  }, [loadedData]);

  const fetchExams = useCallback(async () => {
    if (loadedData.has("exams")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/exams`, {
        params: { isActive: true },
        withCredentials: true,
      });
      setExams(res.data.data);
      setLoadedData((prev) => new Set(prev).add("exams"));
    } catch (error) {
      console.error("Error fetching exams:", error);
      setExams([]);
    }
  }, [loadedData]);

  const fetchResults = useCallback(async () => {
    if (loadedData.has("results")) return;
    try {
      const res = await axios.get(`${BACKEND}/api/results`, {
        withCredentials: true,
      });
      setResults(res.data.data);
      setLoadedData((prev) => new Set(prev).add("results"));
    } catch (error) {
      console.error("Error fetching results:", error);
      setResults([]);
    }
  }, [loadedData]);

  // Load data based on active tab
  useEffect(() => {
    const loadDataForTab = async () => {
      const requirements = TAB_DATA_REQUIREMENTS[activeTab] || [];
      const fetchPromises: Promise<void>[] = [];

      setIsLoading(true);

      for (const req of requirements) {
        switch (req) {
          case "counts":
            fetchPromises.push(fetchCounts());
            break;
          case "students":
            fetchPromises.push(fetchStudents());
            break;
          case "teachers":
            fetchPromises.push(fetchTeachers());
            break;
          case "feeStructure":
            fetchPromises.push(fetchFeeStructure());
            break;
          case "studentDiscounts":
            fetchPromises.push(fetchStudentDiscounts());
            break;
          case "challans":
            fetchPromises.push(fetchChallans());
            break;
          case "paperFundChallans":
            fetchPromises.push(fetchPaperFundChallans());
            break;
          case "subjects":
            fetchPromises.push(fetchSubjects());
            break;
          case "exams":
            fetchPromises.push(fetchExams());
            break;
          case "results":
            fetchPromises.push(fetchResults());
            break;
        }
      }

      await Promise.all(fetchPromises);
      setIsLoading(false);
    };

    loadDataForTab();
  }, [
    activeTab,
    fetchCounts,
    fetchStudents,
    fetchTeachers,
    fetchFeeStructure,
    fetchStudentDiscounts,
    fetchChallans,
    fetchPaperFundChallans,
    fetchSubjects,
    fetchExams,
    fetchResults,
  ]);

  const isDataReady = (tab: string): boolean => {
    const requirements = TAB_DATA_REQUIREMENTS[tab] || [];
    return requirements.every((req) => {
      switch (req) {
        case "counts":
          return counts !== null;
        case "students":
          return students !== null;
        case "teachers":
          return teachers !== null;
        case "feeStructure":
          return feeStructure !== null;
        case "studentDiscounts":
          return studentDiscounts !== null;
        case "challans":
          return challans !== null;
        case "paperFundChallans":
          return paperFundChallans !== null;
        case "subjects":
          return subjects !== null;
        case "exams":
          return exams !== null;
        case "results":
          return results !== null;
        default:
          return true;
      }
    });
  };

  const renderContent = () => {
    if (!isDataReady(activeTab)) {
      return <LoadingSpinner />;
    }

    switch (activeTab) {
      case "students":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <StudentManagement
              students={students || []}
              setStudents={handleSetStudents}
            />
          </Suspense>
        );
      case "teachers":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TeacherManagement
              teachers={teachers || []}
              setTeachers={handleSetTeachers}
            />
          </Suspense>
        );
      case "fees":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <FeeManagement
              students={students || []}
              feeStructure={feeStructure || []}
              setFeeStructure={handleSetFeeStructure}
              studentDiscounts={studentDiscounts || []}
              challans={challans || []}
              setChallans={handleSetChallans}
            />
          </Suspense>
        );
      case "paperFund":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PaperFundManagement
              students={students || []}
              feeStructure={feeStructure || []}
              challans={paperFundChallans || []}
              setChallans={handleSetPaperFundChallans}
            />
          </Suspense>
        );
      case "feeStructure":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <FeeStructure
              feeStructures={feeStructure || []}
              setFeeStructures={handleSetFeeStructure}
            />
          </Suspense>
        );
      case "studentDiscount":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <StudentDiscount students={students || []} />
          </Suspense>
        );
      case "fee-reports":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <FeeReports students={students || []} />
          </Suspense>
        );
      case "results":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ResultsManagement
              students={students || []}
              subjects={subjects || []}
              setSubjects={handleSetSubjects}
              exams={exams || []}
              setExams={handleSetExams}
              results={results || []}
              setResults={handleSetResults}
            />
          </Suspense>
        );
      default:
        return (
          <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
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
                    {counts?.students ?? (
                      <Loader2 className="h-5 w-5 animate-spin" />
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
                    {counts?.teachers ?? (
                      <Loader2 className="h-5 w-5 animate-spin" />
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
                    className="w-full bg-transparent"
                    onClick={() => setActiveTab("teachers")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add Teacher
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-transparent"
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
