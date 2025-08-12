"use client";

import type React from "react";
import axios from "axios";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Plus, Search } from "lucide-react";
const BACKEND = import.meta.env.VITE_BACKEND; // your backend URL

interface Student {
  _id: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  fatherCnic: string;
  bform: string;
  dob: string;
  phoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  class: number;
  email: string;
  password: string;
}

interface StudentManagementProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
}

export function StudentManagement({
  students,
  setStudents,
}: StudentManagementProps) {
  const [formData, setFormData] = useState<Omit<Student, "_id">>({
    rollNumber: "",
    studentName: "",
    fatherName: "",
    fatherCnic: "",
    bform: "",
    dob: "",
    phoneNumber: "",
    fatherOccupation: "",
    motherName: "",
    motherOccupation: "",
    class: 0,
    email: "",
    password: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const preparedData = {
      ...formData,
      class: Number(formData.class), // convert to number
      dob: new Date(formData.dob).toISOString(), // convert to ISO string (or Date object in backend)
      rollNumber: "", // or remove this as backend auto-generates it
    };
    try {
      // Send formData to backend API
      const response = await axios.post(
        `${BACKEND}/api/students`,
        preparedData
      );

      // Backend returns created student object
      const createdStudent = response.data.data;

      // Update local state with newly created student
      setStudents([...students, createdStudent]);

      // Reset form
      setFormData({
        rollNumber: "",
        studentName: "",
        fatherName: "",
        fatherCnic: "",
        bform: "",
        dob: "",
        phoneNumber: "",
        fatherOccupation: "",
        motherName: "",
        motherOccupation: "",
        class: 0,
        email: "",
        password: "",
      });
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student. Please try again.");
    }
  };

  const handleInputChange = (
    field: keyof Omit<Student, "id">,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherCnic.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Student Management
        </h1>
        <p className="text-muted-foreground">Add and manage student records</p>
      </div>

      <Tabs defaultValue="add" className="space-y-4">
        <TabsList>
          <TabsTrigger value="add">Add Student</TabsTrigger>
          <TabsTrigger value="list">View Students</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Student</CardTitle>
              <CardDescription>Enter student information below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name</Label>
                    <Input
                      id="studentName"
                      value={formData.studentName}
                      onChange={(e) =>
                        handleInputChange("studentName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father Name</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={(e) =>
                        handleInputChange("fatherName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherCnic">Father CNIC</Label>
                    <Input
                      id="fatherCnic"
                      value={formData.fatherCnic}
                      onChange={(e) =>
                        handleInputChange("fatherCnic", e.target.value)
                      }
                      placeholder="12345-1234567-1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bform">B-Form Number</Label>
                    <Input
                      id="bform"
                      value={formData.bform}
                      onChange={(e) =>
                        handleInputChange("bform", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      placeholder="03XXXXXXXXX"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherOccupation">Father Occupation</Label>
                    <Input
                      id="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={(e) =>
                        handleInputChange("fatherOccupation", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother Name</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e) =>
                        handleInputChange("motherName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 ">
                    <Label htmlFor="motherOccupation">Mother Occupation</Label>
                    <Input
                      id="motherOccupation"
                      value={formData.motherOccupation}
                      onChange={(e) =>
                        handleInputChange("motherOccupation", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 ">
                    <Label htmlFor="class">Class</Label>
                    <Input
                      id="class"
                      value={formData.class}
                      onChange={(e) =>
                        handleInputChange("class", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 ">
                    <Label htmlFor="Email">Email</Label>
                    <Input
                      id="Email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 ">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Students List ({students.length})</CardTitle>
              <CardDescription>
                View and search all registered students
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Father Name</TableHead>
                      <TableHead>Father CNIC</TableHead>
                      <TableHead>B-Form</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Father Occupation</TableHead>
                      <TableHead>Mother Name</TableHead>
                      <TableHead>Mother Occupation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-muted-foreground"
                        >
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">
                            {student.rollNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.studentName}
                          </TableCell>
                          <TableCell>{student.fatherName}</TableCell>
                          <TableCell>{student.fatherCnic}</TableCell>
                          <TableCell>{student.bform}</TableCell>
                          <TableCell>
                            {new Date(student.dob).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{student.phoneNumber}</TableCell>
                          <TableCell>{student.fatherOccupation}</TableCell>
                          <TableCell>{student.motherName}</TableCell>
                          <TableCell>{student.motherOccupation}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
