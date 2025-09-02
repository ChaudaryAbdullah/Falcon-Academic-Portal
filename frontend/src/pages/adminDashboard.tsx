"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, GraduationCap, UserPlus, Plus, Receipt } from "lucide-react";
import { StudentManagement } from "../components/StudentManagment";
import { TeacherManagement } from "../components/TeacherManagment";
import AdminSidebar from "../components/AdminSidebar";
import { FeeManagement } from "../components/FeeManagment";
import FeeStructure from "../components/FeeStructure";
import StudentDiscount from "../components/StudentDiscount";
import axios from "axios";
import { Toaster } from "sonner";
import FeeReports from "../components/FeeReports";
import { PaperFundManagement } from "../components/PaperFundManagement";

const BACKEND = import.meta.env.VITE_BACKEND;

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
  fPhoneNumber: string;
  mPhoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  class: string;
  email: string;
  password: string;
  address: string;
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

interface FeeStructure {
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
    fPhoneNumber: string;
    class: string;
    section: string;
  };
  month: string;
  year: string;
  tutionFee: number;
  examFee: number;
  miscFee: number;
  totalAmount: number;
  arrears: number;
  discount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
}

interface paperFundChallan {
  id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    fPhoneNumber: string;
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [feeStructure, setFeeStructure] = useState<FeeStructure[]>([]);
  const [studentDiscounts, setStudentDiscounts] = useState([]);
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [paperFundChallans, setPaperFundChallans] = useState<
    paperFundChallan[]
  >([]);
  useEffect(() => {
    const fetchStudents = async () => {
      const res = await axios.get(`${BACKEND}/api/students`, {
        withCredentials: true,
      });
      setStudents(res.data.data);
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      const res = await axios.get(`${BACKEND}/api/teachers`, {
        withCredentials: true,
      });
      setTeachers(res.data.data);
    };
    fetchTeachers();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch fee structure
        const feeStructureRes = await axios.get(
          `${BACKEND}/api/fee-structures`,
          {
            withCredentials: true,
          }
        );
        setFeeStructure(feeStructureRes.data);

        // Fetch student discounts
        const discountsRes = await axios.get(
          `${BACKEND}/api/student-discounts`,
          {
            withCredentials: true,
          }
        );
        setStudentDiscounts(discountsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchFee = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/fees`, {
          withCredentials: true,
        });
        setChallans(res.data.data);
      } catch (error) {
        console.error("Error fetching fees:", error);
      }
    };
    fetchFee();
  }, []);

  useEffect(() => {
    const fetchPaperFund = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/paperFund`, {
          withCredentials: true,
        });
        setPaperFundChallans(res.data.data);
      } catch (error) {
        console.error("Error fetching fees:", error);
      }
    };
    fetchPaperFund();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "students":
        return (
          <StudentManagement students={students} setStudents={setStudents} />
        );
      case "teachers":
        return (
          <TeacherManagement teachers={teachers} setTeachers={setTeachers} />
        );
      case "fees":
        return (
          <FeeManagement
            students={students}
            feeStructure={feeStructure}
            setFeeStructure={setFeeStructure}
            studentDiscounts={studentDiscounts}
            challans={challans}
            setChallans={setChallans}
          />
        );
      case "paperFund":
        return (
          <PaperFundManagement
            students={students}
            feeStructure={feeStructure}
            challans={paperFundChallans}
            setChallans={setPaperFundChallans}
          />
        );
      case "feeStructure":
        return (
          <FeeStructure
            feeStructures={feeStructure}
            setFeeStructures={setFeeStructure}
          />
        );
      case "studentDiscount":
        return <StudentDiscount students={students} />;
      case "fee-reports":
        return <FeeReports students={students} />;
      default:
        return (
          <div className="space-y-6">
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
                  <div className="text-2xl font-bold">{students.length}</div>
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
                  <div className="text-2xl font-bold">{teachers.length}</div>
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

      <main className="ml-72 py-6 pr-6">
        <div className="px-4 py-6 sm:px-0">{renderContent()}</div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
