import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { GraduationCap, BookOpen, Eye, Edit, BarChart3 } from "lucide-react";

// Import Tab Components
import ManageSubjectsTab from "./tabs/ManageSubjectsTab";
import ManageExamsTab from "./tabs/ManageExamsTab";
import EnterMarksTab from "./tabs/EnterMarksTab";
import ViewResultsTab from "./tabs/ViewResultsTab";
import ReportsTab from "./tabs/ReportsTab";

// ==================== TYPES (Export for use in other files) ====================

export interface Student {
  _id: string;
  rollNumber: string;
  studentName: string;
  class: string;
  section: string;
}

export interface Subject {
  _id: string;
  subjectName: string;
  subjectCode: string;
  totalMarks: number;
  passingMarks: number;
  classes: string[];
  isActive: boolean;
}

export interface Exam {
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

export interface ResultSubject {
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

export interface Result {
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

export interface SubjectGroup {
  code: string;
  displayName: string;
  subjects: ResultSubject[];
  totalMaxMarks: number;
  totalPassingMarks: number;
}

export interface ClassStats {
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

interface ResultsManagementProps {
  students: Student[];
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  results: Result[];
  setResults: React.Dispatch<React.SetStateAction<Result[]>>;
}

// ==================== CONSTANTS (Export for use in other files) ====================

export const BACKEND = import.meta.env.VITE_BACKEND;

export const classes = [
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

export const sections = [
  { value: "Red", label: "Red" },
  { value: "Blue", label: "Blue" },
  { value: "Pink", label: "Pink" },
  { value: "Green", label: "Green" },
  { value: "Yellow", label: "Yellow" },
  { value: "White", label: "White" },
];

export const examTypes = ["1st Term", "Mid Term", "Final Term"];

// ==================== HELPER FUNCTIONS (Export for use in other files) ====================

export const getClassLabel = (value: string): string => {
  const classObj = classes.find((c) => c.value === value);
  return classObj ? classObj.label : value;
};

export const getSectionLabel = (value: string): string => {
  const sectionObj = sections.find((s) => s.value === value);
  return sectionObj ? sectionObj.label : value;
};

export const groupSubjectsByCode = (
  subjectsList: ResultSubject[]
): SubjectGroup[] => {
  if (!subjectsList || subjectsList.length === 0) return [];

  const groupMap = new Map<string, SubjectGroup>();

  subjectsList.forEach((subject) => {
    const code = subject.subjectId.subjectCode;

    if (!groupMap.has(code)) {
      groupMap.set(code, {
        code,
        displayName: code,
        subjects: [],
        totalMaxMarks: 0,
        totalPassingMarks: 0,
      });
    }

    const group = groupMap.get(code)!;
    group.subjects.push(subject);
    group.totalMaxMarks += subject.totalMarks;
    group.totalPassingMarks += subject.passingMarks;
  });

  return Array.from(groupMap.values());
};

export const getGroupObtainedTotal = (
  subjectsList: ResultSubject[]
): number => {
  return subjectsList.reduce((sum, s) => sum + (s.obtainedMarks || 0), 0);
};

// ==================== MAIN COMPONENT ====================

export default function ResultsManagement({
  students,
  subjects,
  setSubjects,
  exams,
  setExams,
}: ResultsManagementProps) {
  // Shared State

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manage-subjects");

  // State for different tabs
  const [studentsMarks, setStudentsMarks] = useState<Result[]>([]);
  const [viewResults, setViewResults] = useState<Result[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

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
          <ManageSubjectsTab
            subjects={subjects}
            setSubjects={setSubjects}
            loading={loading}
            setLoading={setLoading}
          />
        </TabsContent>

        <TabsContent value="manage-exams">
          <ManageExamsTab
            exams={exams}
            setExams={setExams}
            loading={loading}
            setLoading={setLoading}
          />
        </TabsContent>

        <TabsContent value="enter-marks">
          <EnterMarksTab
            students={students}
            subjects={subjects}
            exams={exams}
            studentsMarks={studentsMarks}
            setStudentsMarks={setStudentsMarks}
          />
        </TabsContent>

        <TabsContent value="view-results">
          <ViewResultsTab
            exams={exams}
            viewResults={viewResults}
            setViewResults={setViewResults}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab
            exams={exams}
            performanceData={performanceData}
            setPerformanceData={setPerformanceData}
            classStats={classStats}
            setClassStats={setClassStats}
            topPerformers={topPerformers}
            setTopPerformers={setTopPerformers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
