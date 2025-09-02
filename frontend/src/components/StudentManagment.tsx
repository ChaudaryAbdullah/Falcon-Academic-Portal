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
import { Plus, Search, Filter, X, Settings, Upload, User } from "lucide-react";

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
  img?: {
    data: string;
    contentType: string;
  };
}

interface StudentManagementProps {
  students: Student[];
  setStudents: (students: Student[]) => void | React.Dispatch<any>;
}

interface Filters {
  class: string;
  section: string;
  fatherOccupation: string;
  motherOccupation: string;
}

interface ColumnVisibility {
  image: boolean;
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

  // State for image handling
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 30;
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>({
    class: "",
    section: "",
    fatherOccupation: "",
    motherOccupation: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    image: true,
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

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image selection
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create FormData for multipart form submission
      const formDataObj = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "class") {
          formDataObj.append(key, String(value)); // keep as string
        } else if (key === "dob") {
          formDataObj.append(key, new Date(String(value)).toISOString());
        } else {
          formDataObj.append(
            key,
            typeof value === "string" ? value : JSON.stringify(value)
          );
        }
      });

      // Append image if selected
      if (selectedImage) {
        formDataObj.append("image", selectedImage);
      }

      // Send formData to backend API
      const response = await axios.post(
        `${BACKEND}/api/students`,
        formDataObj,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Backend returns created student object
      const createdStudent = response.data.data;

      // Update local state with newly created student
      setStudents([...students, createdStudent]);

      // Reset form and image
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
      clearImage();
    } catch (error) {
      console.error("Error adding student:", error);
      if (axios.isAxiosError(error) && error.response) {
        alert(
          `Failed to add student: ${
            error.response.data.message || "Please try again."
          }`
        );
      } else {
        alert("Failed to add student. Please try again.");
      }
    }
  };

  const handleInputChange = (
    field: keyof Omit<Student, "_id">,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      class: "",
      section: "",
      fatherOccupation: "",
      motherOccupation: "",
    });
    setCurrentPage(1);
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const columnLabels: Record<keyof ColumnVisibility, string> = {
    image: "Photo",
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

  // Function to get image URL for display
  const getImageUrl = (student: Student) => {
    if (student.img?.data) {
      return `data:${student.img.contentType};base64,${student.img.data}`;
    }
    return null;
  };

  // Get unique values for filter dropdowns - with null safety
  const getUniqueValues = (field: keyof Student) => {
    const values = students
      .map((student) => student[field])
      .filter((value) => value != null && value !== "")
      .map(String); // Convert all to strings for consistency
    return [...new Set(values)].sort();
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Safe string conversion and null checking for search
  const safeToString = (value: any): string => {
    if (value == null) return "";
    return String(value);
  };

  const filteredStudents = students.filter((student) => {
    try {
      // Search filter with null safety
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        [
          student.rollNumber,
          student.studentName,
          student.fatherName,
          student.motherName,
          student.fPhoneNumber,
          student.mPhoneNumber,
          student.fatherCnic,
          student.motherCnic,
          student.bform,
          student.address,
          student.email,
          student.fatherOccupation,
          student.motherOccupation,
        ].some((field) =>
          safeToString(field).toLowerCase().includes(searchLower)
        );

      // Field filters with type-safe comparisons
      const matchesClass =
        !filters.class || safeToString(student.class) === filters.class;
      const matchesSection =
        !filters.section || safeToString(student.section) === filters.section;
      const matchesFatherOccupation =
        !filters.fatherOccupation ||
        safeToString(student.fatherOccupation) === filters.fatherOccupation;
      const matchesMotherOccupation =
        !filters.motherOccupation ||
        safeToString(student.motherOccupation) === filters.motherOccupation;

      return (
        matchesSearch &&
        matchesClass &&
        matchesSection &&
        matchesFatherOccupation &&
        matchesMotherOccupation
      );
    } catch (error) {
      console.error("Error filtering student:", error, student);
      return false;
    }
  });

  // Get current students with pagination bounds checking
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  // Total pages calculation with safety check
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage)
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle search term change with page reset
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

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
                {/* Image Upload Section */}
                <div className="space-y-4 border border-dashed border-gray-300 rounded-lg p-4">
                  <Label>Student Photo</Label>
                  <div className="flex items-center space-x-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Student preview"
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={clearImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="imageUpload"
                      />
                      <Label htmlFor="imageUpload" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Photo
                          </span>
                        </Button>
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>

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
                    <select
                      id="class"
                      value={formData.class}
                      onChange={(e) =>
                        handleInputChange("class", e.target.value)
                      }
                      required
                      className="border border-gray-250 shadow-xs rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Class --</option>
                      <option value="Play">Play</option>
                      <option value="Nursery">Nursery</option>
                      <option value="Prep">Prep</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                    </select>
                  </div>

                  <div className="space-y-2 mb-5">
                    <Label htmlFor="section">Section</Label>
                    <select
                      id="section"
                      value={formData.section}
                      onChange={(e) =>
                        handleInputChange("section", e.target.value)
                      }
                      required
                      className="border border-gray-250 shadow-xs rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select a section --</option>
                      <option value="Red">Red</option>
                      <option value="Blue">Blue</option>
                      <option value="Pink">Pink</option>
                      <option value="Green">Green</option>
                      <option value="Yellow">Yellow</option>
                      <option value="White">White</option>
                    </select>
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
                Students List ({indexOfFirstStudent + 1} -{" "}
                {indexOfLastStudent > filteredStudents.length
                  ? filteredStudents.length
                  : indexOfLastStudent}{" "}
                of {filteredStudents.length})
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
                      onChange={(e) => handleSearchChange(e.target.value)}
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
                            <SelectItem key={cls} value={cls}>
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
                    {currentStudents.length === 0 ? (
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
                      currentStudents.map((student) => (
                        <TableRow key={student._id}>
                          {columnVisibility.rollNumber && (
                            <TableCell className="font-medium">
                              {safeToString(student.rollNumber)}
                            </TableCell>
                          )}
                          {columnVisibility.studentName && (
                            <TableCell className="font-medium">
                              {safeToString(student.studentName)}
                            </TableCell>
                          )}
                          {columnVisibility.class && (
                            <TableCell>
                              <Badge variant="outline">
                                Class {safeToString(student.class)}
                              </Badge>
                            </TableCell>
                          )}
                          {columnVisibility.section && (
                            <TableCell>
                              <Badge variant="outline">
                                {safeToString(student.section)}
                              </Badge>
                            </TableCell>
                          )}
                          {columnVisibility.fatherName && (
                            <TableCell>
                              {safeToString(student.fatherName)}
                            </TableCell>
                          )}
                          {columnVisibility.fatherCnic && (
                            <TableCell>
                              {safeToString(student.fatherCnic)}
                            </TableCell>
                          )}
                          {columnVisibility.bform && (
                            <TableCell>{safeToString(student.bform)}</TableCell>
                          )}
                          {columnVisibility.dob && (
                            <TableCell>
                              {student.dob
                                ? new Date(student.dob).toLocaleDateString()
                                : ""}
                            </TableCell>
                          )}
                          {columnVisibility.fPhoneNumber && (
                            <TableCell>
                              {safeToString(student.fPhoneNumber)}
                            </TableCell>
                          )}
                          {columnVisibility.fatherOccupation && (
                            <TableCell>
                              {student.fatherOccupation && (
                                <Badge variant="secondary">
                                  {safeToString(student.fatherOccupation)}
                                </Badge>
                              )}
                            </TableCell>
                          )}
                          {columnVisibility.motherName && (
                            <TableCell>
                              {safeToString(student.motherName)}
                            </TableCell>
                          )}
                          {columnVisibility.motherOccupation && (
                            <TableCell>
                              {student.motherOccupation && (
                                <Badge variant="secondary">
                                  {safeToString(student.motherOccupation)}
                                </Badge>
                              )}
                            </TableCell>
                          )}
                          {columnVisibility.mPhoneNumber && (
                            <TableCell>
                              {safeToString(student.mPhoneNumber)}
                            </TableCell>
                          )}
                          {columnVisibility.address && (
                            <TableCell>
                              {safeToString(student.address)}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-4 space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </Button>

                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
