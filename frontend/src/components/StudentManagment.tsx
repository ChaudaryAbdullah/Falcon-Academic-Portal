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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Plus, Search, Filter, X, Settings } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND; // your backend URL

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
}

interface StudentManagementProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
}

interface Filters {
  class: string;
  section: string;
  fatherOccupation: string;
  motherOccupation: string;
}

interface ColumnVisibility {
  rollNumber: boolean;
  studentName: boolean;
  class: boolean;
  section: boolean;
  fatherName: boolean;
  fatherCnic: boolean;
  bform: boolean;
  dob: boolean;
  fPhoneNumber: boolean;
  fatherOccupation: boolean;
  motherName: boolean;
  motherOccupation: boolean;
  mPhoneNumber: boolean;
  address: boolean;
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
    section: "",
    fPhoneNumber: "",
    mPhoneNumber: "",
    fatherOccupation: "",
    motherName: "",
    motherOccupation: "",
    motherCnic: "",
    class: "",
    address: "",
    email: "",
    password: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>({
    class: "",
    section: "",
    fatherOccupation: "",
    motherOccupation: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    rollNumber: true,
    studentName: true,
    class: true,
    section: true,
    fatherName: true,
    fatherCnic: false,
    bform: false,
    dob: false,
    fPhoneNumber: true,
    fatherOccupation: true,
    motherName: false,
    motherOccupation: false,
    mPhoneNumber: false,
    address: false,
  });

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
        section: "",
        fPhoneNumber: "",
        mPhoneNumber: "",
        motherCnic: "",
        fatherOccupation: "",
        motherName: "",
        motherOccupation: "",
        class: "",
        address: "",
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

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      class: "",
      section: "",
      fatherOccupation: "",
      motherOccupation: "",
    });
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const columnLabels: Record<keyof ColumnVisibility, string> = {
    rollNumber: "Roll Number",
    studentName: "Student Name",
    class: "Class",
    section: "Section",
    fatherName: "Father Name",
    fatherCnic: "Father CNIC",
    bform: "B-Form",
    dob: "Date of Birth",
    fPhoneNumber: "Father Phone",
    fatherOccupation: "Father Occupation",
    motherName: "Mother Name",
    motherOccupation: "Mother Occupation",
    mPhoneNumber: "Mother Phone",
    address: "Address",
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof Student) => {
    const values = students.map((student) => student[field]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch =
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherCnic.includes(searchTerm) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fPhoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mPhoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.motherCnic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.bform.includes(searchTerm);

    // Field filters
    const matchesClass = !filters.class || student.class === filters.class;
    const matchesSection =
      !filters.section || student.section === filters.section;
    const matchesFatherOccupation =
      !filters.fatherOccupation ||
      student.fatherOccupation === filters.fatherOccupation;
    const matchesMotherOccupation =
      !filters.motherOccupation ||
      student.motherOccupation === filters.motherOccupation;

    return (
      matchesSearch &&
      matchesClass &&
      matchesSection &&
      matchesFatherOccupation &&
      matchesMotherOccupation
    );
  });

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
                  <div className="space-y-2 ">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 mb-5">
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
                  <div className="space-y-2 mb-5">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      value={formData.section}
                      onChange={(e) =>
                        handleInputChange("section", e.target.value)
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
                    <Label htmlFor="fPhoneNumber1">Father Phone Number</Label>
                    <Input
                      id="fPhoneNumber"
                      value={formData.fPhoneNumber}
                      onChange={(e) =>
                        handleInputChange("fPhoneNumber", e.target.value)
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

                  <div className="space-y-2 mt-5 ">
                    <Label htmlFor="motherName">Mother Name</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e) =>
                        handleInputChange("motherName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 mt-5">
                    <Label htmlFor="motherCnic">Mother CNIC</Label>
                    <Input
                      id="motherCnic"
                      value={formData.motherCnic}
                      onChange={(e) =>
                        handleInputChange("motherCnic", e.target.value)
                      }
                      placeholder="12345-1234567-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mPhoneNumber1">Mother Phone Number</Label>
                    <Input
                      id="mPhoneNumber"
                      value={formData.mPhoneNumber}
                      onChange={(e) =>
                        handleInputChange("mPhoneNumber", e.target.value)
                      }
                      placeholder="03XXXXXXXXX"
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
                    />
                  </div>

                  <div className="space-y-2 mt-5">
                    <Label htmlFor="Email">Email</Label>
                    <Input
                      id="Email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 mt-5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
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
              <CardTitle>
                Students List ({filteredStudents.length} of {students.length})
              </CardTitle>
              <CardDescription>
                View and search all registered students
              </CardDescription>

              {/* Search and Filter Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Column Visibility Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Columns
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(columnLabels).map(([key, label]) => (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={
                              columnVisibility[key as keyof ColumnVisibility]
                            }
                            onCheckedChange={() =>
                              toggleColumnVisibility(
                                key as keyof ColumnVisibility
                              )
                            }
                          >
                            {label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Filters Button */}
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Filter Section */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="classFilter">Class</Label>
                      <Select
                        value={filters.class || "all"}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "class",
                            value === "all" ? "" : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {getUniqueValues("class").map((cls) => (
                            <SelectItem key={cls} value={cls.toString()}>
                              Class {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sectionFilter">Section</Label>
                      <Select
                        value={filters.section || "all"}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "section",
                            value === "all" ? "" : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sections</SelectItem>
                          {getUniqueValues("section").map((section) => (
                            <SelectItem key={section} value={section}>
                              Section {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fatherOccupationFilter">
                        Father Occupation
                      </Label>
                      <Select
                        value={filters.fatherOccupation || "all"}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "fatherOccupation",
                            value === "all" ? "" : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Occupations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Occupations</SelectItem>
                          {getUniqueValues("fatherOccupation").map(
                            (occupation) => (
                              <SelectItem key={occupation} value={occupation}>
                                {occupation}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motherOccupationFilter">
                        Mother Occupation
                      </Label>
                      <Select
                        value={filters.motherOccupation || "all"}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "motherOccupation",
                            value === "all" ? "" : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Occupations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Occupations</SelectItem>
                          {getUniqueValues("motherOccupation").map(
                            (occupation) => (
                              <SelectItem key={occupation} value={occupation}>
                                {occupation}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Filters Display */}
                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.class && (
                      <Badge variant="secondary">
                        Class: {filters.class}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleFilterChange("class", "")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.section && (
                      <Badge variant="secondary">
                        Section: {filters.section}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleFilterChange("section", "")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.fatherOccupation && (
                      <Badge variant="secondary">
                        Father Occupation: {filters.fatherOccupation}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() =>
                            handleFilterChange("fatherOccupation", "")
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.motherOccupation && (
                      <Badge variant="secondary">
                        Mother Occupation: {filters.motherOccupation}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() =>
                            handleFilterChange("motherOccupation", "")
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnVisibility.rollNumber && (
                        <TableHead>Roll Number</TableHead>
                      )}
                      {columnVisibility.studentName && (
                        <TableHead>Student Name</TableHead>
                      )}
                      {columnVisibility.class && <TableHead>Class</TableHead>}
                      {columnVisibility.section && (
                        <TableHead>Section</TableHead>
                      )}
                      {columnVisibility.fatherName && (
                        <TableHead>Father Name</TableHead>
                      )}
                      {columnVisibility.fatherCnic && (
                        <TableHead>Father CNIC</TableHead>
                      )}
                      {columnVisibility.bform && <TableHead>B-Form</TableHead>}
                      {columnVisibility.dob && (
                        <TableHead>Date of Birth</TableHead>
                      )}
                      {columnVisibility.fPhoneNumber && (
                        <TableHead>Father Phone</TableHead>
                      )}
                      {columnVisibility.fatherOccupation && (
                        <TableHead>Father Occupation</TableHead>
                      )}
                      {columnVisibility.motherName && (
                        <TableHead>Mother Name</TableHead>
                      )}
                      {columnVisibility.motherOccupation && (
                        <TableHead>Mother Occupation</TableHead>
                      )}
                      {columnVisibility.mPhoneNumber && (
                        <TableHead>Mother Phone</TableHead>
                      )}
                      {columnVisibility.address && (
                        <TableHead>Address</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={
                            Object.values(columnVisibility).filter(Boolean)
                              .length
                          }
                          className="text-center text-muted-foreground"
                        >
                          {students.length === 0
                            ? "No students found"
                            : "No students match the current filters"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student._id}>
                          {columnVisibility.rollNumber && (
                            <TableCell className="font-medium">
                              {student.rollNumber}
                            </TableCell>
                          )}
                          {columnVisibility.studentName && (
                            <TableCell className="font-medium">
                              {student.studentName}
                            </TableCell>
                          )}
                          {columnVisibility.class && (
                            <TableCell>
                              <Badge variant="outline">
                                Class {student.class}
                              </Badge>
                            </TableCell>
                          )}
                          {columnVisibility.section && (
                            <TableCell>
                              <Badge variant="outline">{student.section}</Badge>
                            </TableCell>
                          )}
                          {columnVisibility.fatherName && (
                            <TableCell>{student.fatherName}</TableCell>
                          )}
                          {columnVisibility.fatherCnic && (
                            <TableCell>{student.fatherCnic}</TableCell>
                          )}
                          {columnVisibility.bform && (
                            <TableCell>{student.bform}</TableCell>
                          )}
                          {columnVisibility.dob && (
                            <TableCell>
                              {new Date(student.dob).toLocaleDateString()}
                            </TableCell>
                          )}
                          {columnVisibility.fPhoneNumber && (
                            <TableCell>{student.fPhoneNumber}</TableCell>
                          )}
                          {columnVisibility.fatherOccupation && (
                            <TableCell>
                              <Badge variant="secondary">
                                {student.fatherOccupation}
                              </Badge>
                            </TableCell>
                          )}
                          {columnVisibility.motherName && (
                            <TableCell>{student.motherName}</TableCell>
                          )}
                          {columnVisibility.motherOccupation && (
                            <TableCell>
                              {student.motherOccupation && (
                                <Badge variant="secondary">
                                  {student.motherOccupation}
                                </Badge>
                              )}
                            </TableCell>
                          )}
                          {columnVisibility.mPhoneNumber && (
                            <TableCell>{student.mPhoneNumber}</TableCell>
                          )}
                          {columnVisibility.address && (
                            <TableCell>{student.address}</TableCell>
                          )}
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
