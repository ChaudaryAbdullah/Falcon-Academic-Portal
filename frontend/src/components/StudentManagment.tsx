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
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  X,
  Settings,
  Upload,
  User,
  Edit,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

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
  gender: string;
  fatherOccupation: string;
  motherOccupation: string;
}

interface ColumnVisibility {
  image: boolean;
  rollNumber: boolean;
  studentName: boolean;
  class: boolean;
  section: boolean;
  gender: boolean;
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
  actions: boolean;
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
    gender: "",
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

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("add");

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 30;
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>({
    class: "",
    section: "",
    gender: "",
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
    gender: true,
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
    actions: true,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setFormData({
      rollNumber: "",
      studentName: "",
      fatherName: "",
      fatherCnic: "",
      bform: "",
      dob: "",
      section: "",
      gender: "",
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
    setEditingStudentId(null);
  };

  const handleEdit = (student: Student) => {
    const dobFormatted = student.dob
      ? new Date(student.dob).toISOString().split("T")[0]
      : "";

    setFormData({
      rollNumber: student.rollNumber,
      studentName: student.studentName,
      fatherName: student.fatherName,
      fatherCnic: student.fatherCnic,
      bform: student.bform,
      dob: dobFormatted,
      section: student.section,
      gender: student.gender,
      fPhoneNumber: student.fPhoneNumber,
      mPhoneNumber: student.mPhoneNumber,
      motherCnic: student.motherCnic || "",
      fatherOccupation: student.fatherOccupation,
      motherName: student.motherName || "",
      motherOccupation: student.motherOccupation || "",
      class: student.class,
      address: student.address,
      email: student.email || "",
      password: "",
    });

    if (student.img?.data) {
      setImagePreview(
        `data:${student.img.contentType};base64,${student.img.data}`
      );
    }

    setEditingStudentId(student._id);
    setActiveTab("add");
  };

  const handleCancelEdit = () => {
    resetForm();
    toast.info("Edit cancelled");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formDataObj = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "class") {
          formDataObj.append(key, String(value));
        } else if (key === "dob") {
          formDataObj.append(key, new Date(String(value)).toISOString());
        } else if (value !== "" && value !== null && value !== undefined) {
          formDataObj.append(key, String(value));
        }
      });

      if (selectedImage) {
        formDataObj.append("image", selectedImage);
      }

      let response;
      if (editingStudentId) {
        response = await axios.put(
          `${BACKEND}/api/students/${editingStudentId}`,
          formDataObj,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Student updated successfully!");

        const updatedStudent = response.data.data;
        setStudents(
          students.map((s) => (s._id === editingStudentId ? updatedStudent : s))
        );
      } else {
        response = await axios.post(`${BACKEND}/api/students`, formDataObj, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Student added successfully!");

        const createdStudent = response.data.data;
        setStudents([...students, createdStudent]);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving student:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          `Failed to save student: ${
            error.response.data.message || "Please try again."
          }`
        );
      } else {
        toast.error("Failed to save student. Please try again.");
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
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      class: "",
      section: "",
      gender: "",
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
    gender: "Gender",
    fatherName: "Father Name",
    fatherCnic: "Father CNIC",
    bform: "B-Form",
    dob: "Date of Birth",
    fPhoneNumber: "Father Phone",
    fatherOccupation: "Father Occupation",
    motherName: "Mother Name",
    motherOccupation: "Mother Occupation",
    mPhoneNumber: "Whatsapp Number",
    address: "Address",
    actions: "Actions",
  };

  const getImageUrl = (student: Student) => {
    if (student.img?.data) {
      return `data:${student.img.contentType};base64,${student.img.data}`;
    }
    return null;
  };

  const getUniqueValues = (field: keyof Student) => {
    const values = students
      .map((student) => student[field])
      .filter((value) => value != null && value !== "")
      .map(String);
    return [...new Set(values)].sort();
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const safeToString = (value: any): string => {
    if (value == null) return "";
    return String(value);
  };

  const filteredStudents = students.filter((student) => {
    try {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        [
          student.rollNumber,
          student.studentName,
          student.fatherName,
          student.motherName,
          student.gender,
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

      const matchesClass =
        !filters.class || safeToString(student.class) === filters.class;
      const matchesSection =
        !filters.section || safeToString(student.section) === filters.section;
      const matchesGender =
        !filters.gender || safeToString(student.gender) === filters.gender;
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
        matchesGender &&
        matchesFatherOccupation &&
        matchesMotherOccupation
      );
    } catch (error) {
      console.error("Error filtering student:", error, student);
      return false;
    }
  });

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage)
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Student Management
        </h1>
        <p className="text-muted-foreground">Add and manage student records</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">
            {editingStudentId ? "Edit Student" : "Add Student"}
          </TabsTrigger>
          <TabsTrigger value="list">View Students</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingStudentId ? "Edit Student" : "Add New Student"}
              </CardTitle>
              <CardDescription>
                {editingStudentId
                  ? "Update student information below"
                  : "Enter student information below"}
              </CardDescription>
              {editingStudentId && (
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4 border border-dashed border-gray-300 rounded-lg p-4">
                  <Label>Student Photo</Label>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
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

                    <div className="flex-1 text-center sm:text-left">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
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

                  <div className="space-y-2 mb-5">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      required
                      className="border border-gray-250 shadow-xs rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select a gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mPhoneNumber1">Whatsapp Number</Label>
                    <Input
                      id="mPhoneNumber"
                      value={formData.mPhoneNumber}
                      onChange={(e) =>
                        handleInputChange("mPhoneNumber", e.target.value)
                      }
                      placeholder="03XXXXXXXXX"
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
                      onChange={(e: { target: { value: string } }) =>
                        handleInputChange("fatherOccupation", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2 mt-5">
                    <Label htmlFor="motherName">Mother Name</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e: { target: { value: string } }) =>
                        handleInputChange("motherName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 mt-5">
                    <Label htmlFor="motherCnic">Mother CNIC</Label>
                    <Input
                      id="motherCnic"
                      value={formData.motherCnic}
                      onChange={(e: { target: { value: string } }) =>
                        handleInputChange("motherCnic", e.target.value)
                      }
                      placeholder="12345-1234567-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherOccupation">Mother Occupation</Label>
                    <Input
                      id="motherOccupation"
                      value={formData.motherOccupation}
                      onChange={(e: { target: { value: string } }) =>
                        handleInputChange("motherOccupation", e.target.value)
                      }
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600">
                  {editingStudentId ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Student
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Students List ({indexOfFirstStudent + 1} -{" "}
                {indexOfLastStudent > filteredStudents.length
                  ? filteredStudents.length
                  : indexOfLastStudent}{" "}
                of {filteredStudents.length})
              </CardTitle>
              <CardDescription>
                View and search all registered students
              </CardDescription>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 flex-1 w-full sm:w-auto">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e: { target: { value: string } }) =>
                        handleSearchChange(e.target.value)
                      }
                      className="w-full sm:max-w-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
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

                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full sm:w-auto"
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

                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="classFilter">Class</Label>
                      <Select
                        value={filters.class || "all"}
                        onValueChange={(value: string) =>
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
                        onValueChange={(value: string) =>
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
                      <Label htmlFor="GenderFilter">Gender</Label>
                      <Select
                        value={filters.gender || "all"}
                        onValueChange={(value: string) =>
                          handleFilterChange(
                            "gender",
                            value === "all" ? "" : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Genders" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          {getUniqueValues("gender").map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
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
                        onValueChange={(value: string) =>
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
                        onValueChange={(value: string) =>
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

                    <div className="flex items-end sm:col-span-2 lg:col-span-4 xl:col-span-1">
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.class && (
                      <Badge variant="secondary" className="text-xs">
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
                      <Badge variant="secondary" className="text-xs">
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
                    {filters.gender && (
                      <Badge variant="secondary" className="text-xs">
                        Gender: {filters.gender}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleFilterChange("gender", "")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.fatherOccupation && (
                      <Badge variant="secondary" className="text-xs">
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
                      <Badge variant="secondary" className="text-xs">
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
                      {columnVisibility.image && (
                        <TableHead className="w-16">Photo</TableHead>
                      )}
                      {columnVisibility.rollNumber && (
                        <TableHead className="min-w-[100px]">
                          Roll Number
                        </TableHead>
                      )}
                      {columnVisibility.studentName && (
                        <TableHead className="min-w-[150px]">
                          Student Name
                        </TableHead>
                      )}
                      {columnVisibility.class && (
                        <TableHead className="min-w-[80px]">Class</TableHead>
                      )}
                      {columnVisibility.section && (
                        <TableHead className="min-w-[80px]">Section</TableHead>
                      )}
                      {columnVisibility.gender && (
                        <TableHead className="min-w-[80px]">Gender</TableHead>
                      )}
                      {columnVisibility.fatherName && (
                        <TableHead className="min-w-[150px]">
                          Father Name
                        </TableHead>
                      )}
                      {columnVisibility.fatherCnic && (
                        <TableHead className="min-w-[140px]">
                          Father CNIC
                        </TableHead>
                      )}
                      {columnVisibility.bform && (
                        <TableHead className="min-w-[120px]">B-Form</TableHead>
                      )}
                      {columnVisibility.dob && (
                        <TableHead className="min-w-[120px]">
                          Date of Birth
                        </TableHead>
                      )}
                      {columnVisibility.fPhoneNumber && (
                        <TableHead className="min-w-[130px]">
                          Father Phone
                        </TableHead>
                      )}
                      {columnVisibility.fatherOccupation && (
                        <TableHead className="min-w-[140px]">
                          Father Occupation
                        </TableHead>
                      )}
                      {columnVisibility.motherName && (
                        <TableHead className="min-w-[150px]">
                          Mother Name
                        </TableHead>
                      )}
                      {columnVisibility.motherOccupation && (
                        <TableHead className="min-w-[140px]">
                          Mother Occupation
                        </TableHead>
                      )}
                      {columnVisibility.mPhoneNumber && (
                        <TableHead className="min-w-[130px]">
                          Whatsapp Number
                        </TableHead>
                      )}
                      {columnVisibility.address && (
                        <TableHead className="min-w-[200px]">Address</TableHead>
                      )}
                      {columnVisibility.actions && (
                        <TableHead className="min-w-[100px]">Actions</TableHead>
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
                          className="text-center text-muted-foreground py-8"
                        >
                          {students.length === 0
                            ? "No students found"
                            : "No students match the current filters"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentStudents.map((student) => (
                        <TableRow key={student._id}>
                          {columnVisibility.image && (
                            <TableCell>
                              {getImageUrl(student) ? (
                                <img
                                  src={getImageUrl(student)!}
                                  alt={`${student.studentName}'s photo`}
                                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border"
                                />
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                  <User className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                          )}
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
                              <Badge variant="outline" className="text-xs">
                                Class {safeToString(student.class)}
                              </Badge>
                            </TableCell>
                          )}
                          {columnVisibility.section && (
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {safeToString(student.section)}
                              </Badge>
                            </TableCell>
                          )}
                          {columnVisibility.gender && (
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {safeToString(student.gender)}
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
                                <Badge variant="secondary" className="text-xs">
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
                                <Badge variant="secondary" className="text-xs">
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
                          {columnVisibility.actions && (
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(student)}
                                className="w-full sm:w-auto"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-full sm:w-auto"
                    >
                      Prev
                    </Button>

                    <span className="text-sm order-first sm:order-none">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-full sm:w-auto"
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
