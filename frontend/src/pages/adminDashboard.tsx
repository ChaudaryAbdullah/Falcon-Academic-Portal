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

const BACKEND = import.meta.env.VITE_BACKEND;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const res = await axios.get(`${BACKEND}/api/students`, {
        withCredentials: true,
      });
      setStudents(res.data.data);
      console.log(students);
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      const res = await axios.get(`${BACKEND}/api/teachers`, {
        withCredentials: true,
      });
      setTeachers(res.data.data);
      console.log(teachers);
    };
    fetchTeachers();
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
        return <FeeManagement students={students} />;
      case "feeStructure":
        return <FeeStructure />;
      case "studentDiscount":
        return (
          <StudentDiscount students={students} setStudents={setStudents} />
        );
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
