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

interface TeacherManagementProps {
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
}

export function TeacherManagement({
  teachers,
  setTeachers,
}: TeacherManagementProps) {
  const [formData, setFormData] = useState<Omit<Teacher, "_id">>({
    fullName: "",
    fatherHusbandName: "",
    salary: "",
    cnic: "",
    dob: "",
    phoneNumber: "",
    email: "",
    password: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Send formData to backend API
      const response = await axios.post(`${BACKEND}/api/teachers`, formData);

      // Backend returns created student object
      const newTeacher = response.data.data;
      setTeachers([...teachers, newTeacher]);
      setFormData({
        fullName: "",
        fatherHusbandName: "",
        salary: "",
        cnic: "",
        dob: "",
        phoneNumber: "",
        email: "",
        password: "",
      });
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student. Please try again.");
    }
  };

  const handleInputChange = (
    field: keyof Omit<Teacher, "id">,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.fatherHusbandName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      teacher.cnic.includes(searchTerm) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Teacher Management
        </h1>
        <p className="text-muted-foreground">Add and manage teacher records</p>
      </div>

      <Tabs defaultValue="add" className="space-y-4">
        <TabsList>
          <TabsTrigger value="add">Add Teacher</TabsTrigger>
          <TabsTrigger value="list">View Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Teacher</CardTitle>
              <CardDescription>Enter teacher information below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherHusbandName">
                      Father/Husband Name
                    </Label>
                    <Input
                      id="fatherHusbandName"
                      value={formData.fatherHusbandName}
                      onChange={(e) =>
                        handleInputChange("fatherHusbandName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) =>
                        handleInputChange("salary", e.target.value)
                      }
                      placeholder="50000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC</Label>
                    <Input
                      id="cnic"
                      value={formData.cnic}
                      onChange={(e) =>
                        handleInputChange("cnic", e.target.value)
                      }
                      placeholder="12345-1234567-1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
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
                  Add Teacher
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Teachers List ({teachers.length})</CardTitle>
              <CardDescription>
                View and search all registered teachers
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
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
                      <TableHead>Full Name</TableHead>
                      <TableHead>Father/Husband Name</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          No teachers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <TableRow key={teacher._id}>
                          <TableCell className="font-medium">
                            {teacher.fullName}
                          </TableCell>
                          <TableCell>{teacher.fatherHusbandName}</TableCell>
                          <TableCell>
                            Rs.{" "}
                            {Number.parseInt(teacher.salary).toLocaleString()}
                          </TableCell>
                          <TableCell>{teacher.cnic}</TableCell>
                          <TableCell>
                            {" "}
                            {new Date(teacher.dob).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{teacher.phoneNumber}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
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
