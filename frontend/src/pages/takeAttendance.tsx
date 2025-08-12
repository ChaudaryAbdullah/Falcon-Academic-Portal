"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Sidebar from "../components/Sidebar";

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  attendanceStatus: "present" | "absent" | "late";
}

export function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [students, setStudents] = useState<Student[]>([
    {
      id: 1,
      name: "John Smith",
      rollNumber: "001",
      attendanceStatus: "absent",
    },
    {
      id: 2,
      name: "Emma Johnson",
      rollNumber: "002",
      attendanceStatus: "absent",
    },
    {
      id: 3,
      name: "Michael Brown",
      rollNumber: "003",
      attendanceStatus: "absent",
    },
    {
      id: 4,
      name: "Sarah Davis",
      rollNumber: "004",
      attendanceStatus: "absent",
    },
    {
      id: 5,
      name: "David Wilson",
      rollNumber: "005",
      attendanceStatus: "absent",
    },
    {
      id: 6,
      name: "Lisa Anderson",
      rollNumber: "006",
      attendanceStatus: "absent",
    },
    {
      id: 7,
      name: "James Taylor",
      rollNumber: "007",
      attendanceStatus: "absent",
    },
    {
      id: 8,
      name: "Maria Garcia",
      rollNumber: "008",
      attendanceStatus: "absent",
    },
  ]);

  const classes = [
    "Grade 10A - Algebra",
    "Grade 9B - Geometry",
    "Grade 11C - Calculus",
    "Grade 8A - Basic Math",
    "Grade 12B - Statistics",
  ];

  const handleAttendanceChange = (
    studentId: number,
    status: "present" | "absent" | "late"
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, attendanceStatus: status }
          : student
      )
    );
  };

  const markAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        attendanceStatus: "present" as const,
      }))
    );
  };

  const handleSubmitAttendance = () => {
    if (!selectedClass || !selectedDate) {
      alert("Please select both class and date");
      return;
    }

    const attendanceData = {
      class: selectedClass,
      date: selectedDate,
      students: students.map((s) => ({
        name: s.name,
        rollNumber: s.rollNumber,
        attendanceStatus: s.attendanceStatus,
      })),
    };

    console.log("Attendance submitted:", attendanceData);
    alert("Attendance submitted successfully!");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole="teacher" selectOption="Attendance" />
      <main className="flex-1 p-6 ml-64 ">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, Ms. Johnson
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-sm font-medium">March 15, 2024</p>
            </div>
            <Avatar className="w-10 h-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mark Attendance Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Mark Attendance
          </h2>

          {/* Form Controls */}
          <Card className="bg-white">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Select Class */}
                <div className="space-y-2">
                  <Label
                    htmlFor="class-select"
                    className="text-sm font-medium text-gray-700"
                  >
                    Select Class:
                  </Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Date */}
                <div className="space-y-2">
                  <Label
                    htmlFor="date-select"
                    className="text-sm font-medium text-gray-700"
                  >
                    Select Date:
                  </Label>
                  <Input
                    id="date-select"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  onClick={handleSubmitAttendance}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  Submit Attendance
                </Button>
                {selectedClass && selectedDate && (
                  <Button
                    onClick={markAllPresent}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-2 bg-transparent"
                  >
                    Present All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          {selectedClass && selectedDate && (
            <Card className="bg-white">
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="bg-blue-600 text-white">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5">Student Name</div>
                    <div className="col-span-3">Roll Number</div>
                    <div className="col-span-3 text-center">Attendance</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <div
                      key={student.id}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50"
                    >
                      <div className="col-span-1 text-center text-gray-600 font-medium">
                        {index + 1}
                      </div>
                      <div className="col-span-5">
                        <span className="font-medium text-gray-900">
                          {student.name}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-gray-600">
                          {student.rollNumber}
                        </span>
                      </div>
                      <div className="col-span-3 flex justify-center">
                        <Select
                          value={student.attendanceStatus}
                          onValueChange={(
                            value: "present" | "absent" | "late"
                          ) => handleAttendanceChange(student.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Total Students: {students.length}
                    </span>
                    <span className="text-gray-600">
                      Present:{" "}
                      {
                        students.filter((s) => s.attendanceStatus === "present")
                          .length
                      }{" "}
                      | Absent:{" "}
                      {
                        students.filter((s) => s.attendanceStatus === "absent")
                          .length
                      }{" "}
                      | Late:{" "}
                      {
                        students.filter((s) => s.attendanceStatus === "late")
                          .length
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!selectedClass || !selectedDate ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-blue-800 text-sm">
                  📝 Please select a class and date to view the attendance
                  sheet.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}
