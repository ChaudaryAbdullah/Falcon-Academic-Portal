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
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
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
  GraduationCap,
  UserX,
  MoreHorizontal,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Users,
  CheckCircle,
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
  discountCode: string;
  status: "active" | "passedOut" | "struckOff";
  statusDate?: string;
  statusReason?: string;
  passOutYear?: string;
  passOutClass?: string;
  img?: {
    data: string;
    contentType: string;
  };
}

interface StudentManagementProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

interface Filters {
  class: string;
  section: string;
  gender: string;
  fatherOccupation: string;
  motherOccupation: string;
  status: string;
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
  status: boolean;
  actions: boolean;
  discountCode: boolean;
}

// Class order for promotion/demotion
const CLASS_ORDER = [
  "Play",
  "Nursery",
  "Prep",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];

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
    discountCode: "",
    status: "active",
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
    status: "",
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
    status: true,
    actions: true,
    discountCode: false,
  });

  // Pass Out Dialog State
  const [passOutDialogOpen, setPassOutDialogOpen] = useState(false);
  const [selectedStudentForPassOut, setSelectedStudentForPassOut] =
    useState<Student | null>(null);
  const [passOutData, setPassOutData] = useState({
    passOutYear: new Date().getFullYear().toString(),
    passOutClass: "",
    reason: "Completed education",
  });

  // Strike Off Dialog State
  const [strikeOffDialogOpen, setStrikeOffDialogOpen] = useState(false);
  const [selectedStudentForStrikeOff, setSelectedStudentForStrikeOff] =
    useState<Student | null>(null);
  const [strikeOffReason, setStrikeOffReason] = useState("");

  // Reactivate Confirmation Dialog
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [selectedStudentForReactivate, setSelectedStudentForReactivate] =
    useState<Student | null>(null);

  // Track which dropdown is open (to close it before opening dialog)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Promotion Tab State
  const [promotionClassFilter, setPromotionClassFilter] = useState("");
  const [promotionSectionFilter, setPromotionSectionFilter] = useState("");
  const [selectedStudentsForPromotion, setSelectedStudentsForPromotion] =
    useState<Set<string>>(new Set());
  const [promotionSearchTerm, setPromotionSearchTerm] = useState("");
  const [promotionCurrentPage, setPromotionCurrentPage] = useState(1);
  const promotionStudentsPerPage = 20;

  // Bulk Action Dialog State
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    "promote" | "demote" | "passout"
  >("promote");
  const [bulkPassOutData, setBulkPassOutData] = useState({
    passOutYear: new Date().getFullYear().toString(),
    reason: "Completed education",
  });
  const [isProcessingBulkAction, setIsProcessingBulkAction] = useState(false);

  // Helper functions for class promotion/demotion
  const getNextClass = (currentClass: string): string | null => {
    const index = CLASS_ORDER.indexOf(currentClass);
    if (index === -1 || index === CLASS_ORDER.length - 1) return null;
    return CLASS_ORDER[index + 1];
  };

  const getPreviousClass = (currentClass: string): string | null => {
    const index = CLASS_ORDER.indexOf(currentClass);
    if (index === -1 || index === 0) return null;
    return CLASS_ORDER[index - 1];
  };

  const isLastClass = (currentClass: string): boolean => {
    return currentClass === CLASS_ORDER[CLASS_ORDER.length - 1];
  };

  // Filter students for promotion tab (only active students)
  const studentsForPromotion = students.filter((s) => {
    const isActive = s.status === "active" || !s.status;
    const matchesClass =
      !promotionClassFilter || s.class === promotionClassFilter;
    const matchesSection =
      !promotionSectionFilter || s.section === promotionSectionFilter;
    const matchesSearch =
      !promotionSearchTerm ||
      s.studentName.toLowerCase().includes(promotionSearchTerm.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(promotionSearchTerm.toLowerCase()) ||
      s.fatherName?.toLowerCase().includes(promotionSearchTerm.toLowerCase());

    return isActive && matchesClass && matchesSection && matchesSearch;
  });

  // Pagination for promotion tab
  const promotionIndexOfLastStudent =
    promotionCurrentPage * promotionStudentsPerPage;
  const promotionIndexOfFirstStudent =
    promotionIndexOfLastStudent - promotionStudentsPerPage;
  const currentPromotionStudents = studentsForPromotion.slice(
    promotionIndexOfFirstStudent,
    promotionIndexOfLastStudent
  );
  const promotionTotalPages = Math.max(
    1,
    Math.ceil(studentsForPromotion.length / promotionStudentsPerPage)
  );

  // Handle select all for promotion
  const handleSelectAllForPromotion = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(studentsForPromotion.map((s) => s._id));
      setSelectedStudentsForPromotion(allIds);
    } else {
      setSelectedStudentsForPromotion(new Set());
    }
  };

  // Handle individual selection for promotion
  const handleSelectStudentForPromotion = (
    studentId: string,
    checked: boolean
  ) => {
    const newSelected = new Set(selectedStudentsForPromotion);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudentsForPromotion(newSelected);
  };

  // Check if all visible students are selected
  const areAllVisibleSelected =
    studentsForPromotion.length > 0 &&
    studentsForPromotion.every((s) => selectedStudentsForPromotion.has(s._id));

  // Open bulk action dialog
  const openBulkActionDialog = (
    actionType: "promote" | "demote" | "passout"
  ) => {
    if (selectedStudentsForPromotion.size === 0) {
      toast.error("Please select at least one student");
      return;
    }
    setBulkActionType(actionType);
    setBulkActionDialogOpen(true);
  };

  // Handle bulk promotion
  const handleBulkPromotion = async () => {
    setIsProcessingBulkAction(true);
    const selectedStudentIds = Array.from(selectedStudentsForPromotion);
    const selectedStudentsList = students.filter((s) =>
      selectedStudentIds.includes(s._id)
    );

    let successCount = 0;
    let failCount = 0;

    for (const student of selectedStudentsList) {
      const nextClass = getNextClass(student.class);
      if (!nextClass) {
        failCount++;
        continue;
      }

      try {
        const response = await axios.put(
          `${BACKEND}/api/students/${student._id}`,
          { class: nextClass },
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.data.success) {
          setStudents((prev: Student[]) =>
            prev.map((s) =>
              s._id === student._id ? { ...s, class: nextClass } : s
            )
          );
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error promoting student ${student.studentName}:`, error);
        failCount++;
      }
    }

    setIsProcessingBulkAction(false);
    setBulkActionDialogOpen(false);
    setSelectedStudentsForPromotion(new Set());

    if (successCount > 0) {
      toast.success(`Successfully promoted ${successCount} student(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to promote ${failCount} student(s)`);
    }
  };

  // Handle bulk demotion
  const handleBulkDemotion = async () => {
    setIsProcessingBulkAction(true);
    const selectedStudentIds = Array.from(selectedStudentsForPromotion);
    const selectedStudentsList = students.filter((s) =>
      selectedStudentIds.includes(s._id)
    );

    let successCount = 0;
    let failCount = 0;

    for (const student of selectedStudentsList) {
      const prevClass = getPreviousClass(student.class);
      if (!prevClass) {
        failCount++;
        continue;
      }

      try {
        const response = await axios.put(
          `${BACKEND}/api/students/${student._id}`,
          { class: prevClass },
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.data.success) {
          setStudents((prev: Student[]) =>
            prev.map((s) =>
              s._id === student._id ? { ...s, class: prevClass } : s
            )
          );
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error demoting student ${student.studentName}:`, error);
        failCount++;
      }
    }

    setIsProcessingBulkAction(false);
    setBulkActionDialogOpen(false);
    setSelectedStudentsForPromotion(new Set());

    if (successCount > 0) {
      toast.success(`Successfully demoted ${successCount} student(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to demote ${failCount} student(s)`);
    }
  };

  // Handle bulk pass out
  const handleBulkPassOut = async () => {
    setIsProcessingBulkAction(true);
    const selectedStudentIds = Array.from(selectedStudentsForPromotion);
    const selectedStudentsList = students.filter((s) =>
      selectedStudentIds.includes(s._id)
    );

    let successCount = 0;
    let failCount = 0;

    for (const student of selectedStudentsList) {
      try {
        const response = await axios.put(
          `${BACKEND}/api/students/${student._id}/pass-out`,
          {
            passOutYear: bulkPassOutData.passOutYear,
            passOutClass: student.class,
            reason: bulkPassOutData.reason,
          }
        );

        if (response.data.success) {
          setStudents((prev: Student[]) =>
            prev.map((s) => (s._id === student._id ? response.data.data : s))
          );
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(
          `Error passing out student ${student.studentName}:`,
          error
        );
        failCount++;
      }
    }

    setIsProcessingBulkAction(false);
    setBulkActionDialogOpen(false);
    setSelectedStudentsForPromotion(new Set());
    setBulkPassOutData({
      passOutYear: new Date().getFullYear().toString(),
      reason: "Completed education",
    });

    if (successCount > 0) {
      toast.success(`Successfully passed out ${successCount} student(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to pass out ${failCount} student(s)`);
    }
  };

  // Execute bulk action based on type
  const executeBulkAction = () => {
    switch (bulkActionType) {
      case "promote":
        handleBulkPromotion();
        break;
      case "demote":
        handleBulkDemotion();
        break;
      case "passout":
        handleBulkPassOut();
        break;
    }
  };

  // Get selected students info for dialog
  const getSelectedStudentsInfo = () => {
    const selectedStudentIds = Array.from(selectedStudentsForPromotion);
    return students.filter((s) => selectedStudentIds.includes(s._id));
  };

  // Get class-wise count of selected students
  const getSelectedStudentsClassCount = () => {
    const selectedStudents = getSelectedStudentsInfo();
    const classCount: Record<string, number> = {};
    selectedStudents.forEach((s) => {
      classCount[s.class] = (classCount[s.class] || 0) + 1;
    });
    return classCount;
  };

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
      discountCode: "",
      status: "active",
    });
    clearImage();
    setEditingStudentId(null);
  };

  const handleEdit = (student: Student) => {
    setOpenDropdownId(null);

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
      discountCode: student.discountCode || "",
      password: "",
      status: student.status || "active",
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

  const openPassOutDialog = (student: Student) => {
    setOpenDropdownId(null);

    setTimeout(() => {
      setSelectedStudentForPassOut(student);
      setPassOutData({
        passOutYear: new Date().getFullYear().toString(),
        passOutClass: student.class,
        reason: "Completed education",
      });
      setPassOutDialogOpen(true);
    }, 100);
  };

  const handlePassOut = async () => {
    if (!selectedStudentForPassOut) return;

    try {
      const response = await axios.put(
        `${BACKEND}/api/students/${selectedStudentForPassOut._id}/pass-out`,
        passOutData
      );

      if (response.data.success) {
        toast.success(
          `${selectedStudentForPassOut.studentName} has been marked as passed out`
        );

        setStudents(
          students.map((s) =>
            s._id === selectedStudentForPassOut._id ? response.data.data : s
          )
        );

        setPassOutDialogOpen(false);
        setSelectedStudentForPassOut(null);
      }
    } catch (error) {
      console.error("Error passing out student:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data.message || "Failed to pass out student"
        );
      } else {
        toast.error("Failed to pass out student. Please try again.");
      }
    }
  };

  const handlePassOutDialogClose = (open: boolean) => {
    if (!open) {
      setPassOutDialogOpen(false);
      setSelectedStudentForPassOut(null);
      setPassOutData({
        passOutYear: new Date().getFullYear().toString(),
        passOutClass: "",
        reason: "Completed education",
      });
    }
  };

  const openStrikeOffDialog = (student: Student) => {
    setOpenDropdownId(null);

    setTimeout(() => {
      setSelectedStudentForStrikeOff(student);
      setStrikeOffReason("");
      setStrikeOffDialogOpen(true);
    }, 100);
  };

  const handleStrikeOff = async () => {
    if (!selectedStudentForStrikeOff) return;

    if (!strikeOffReason.trim()) {
      toast.error("Please provide a reason for striking off the student");
      return;
    }

    try {
      const response = await axios.put(
        `${BACKEND}/api/students/${selectedStudentForStrikeOff._id}/strike-off`,
        { reason: strikeOffReason }
      );

      if (response.data.success) {
        toast.success(
          `${selectedStudentForStrikeOff.studentName} has been struck off`
        );

        setStudents(
          students.map((s) =>
            s._id === selectedStudentForStrikeOff._id ? response.data.data : s
          )
        );

        setStrikeOffDialogOpen(false);
        setSelectedStudentForStrikeOff(null);
        setStrikeOffReason("");
      }
    } catch (error) {
      console.error("Error striking off student:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data.message || "Failed to strike off student"
        );
      } else {
        toast.error("Failed to strike off student. Please try again.");
      }
    }
  };

  const handleStrikeOffDialogClose = (open: boolean) => {
    if (!open) {
      setStrikeOffDialogOpen(false);
      setSelectedStudentForStrikeOff(null);
      setStrikeOffReason("");
    }
  };

  const openReactivateDialog = (student: Student) => {
    setOpenDropdownId(null);

    setTimeout(() => {
      setSelectedStudentForReactivate(student);
      setReactivateDialogOpen(true);
    }, 100);
  };

  const handleReactivate = async () => {
    if (!selectedStudentForReactivate) return;

    try {
      const response = await axios.put(
        `${BACKEND}/api/students/${selectedStudentForReactivate._id}/reactivate`
      );

      if (response.data.success) {
        toast.success(
          `${selectedStudentForReactivate.studentName} has been reactivated`
        );

        setStudents(
          students.map((s) =>
            s._id === selectedStudentForReactivate._id ? response.data.data : s
          )
        );

        setReactivateDialogOpen(false);
        setSelectedStudentForReactivate(null);
      }
    } catch (error) {
      console.error("Error reactivating student:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data.message || "Failed to reactivate student"
        );
      } else {
        toast.error("Failed to reactivate student. Please try again.");
      }
    }
  };

  const handleReactivateDialogClose = (open: boolean) => {
    if (!open) {
      setReactivateDialogOpen(false);
      setSelectedStudentForReactivate(null);
    }
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
      status: "",
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
    status: "Status",
    actions: "Actions",
    discountCode: "Discount Code",
  };

  const getImageUrl = (student: Student) => {
    if (student.img?.data) {
      return `data:${student.img.contentType};base64,${student.img.data}`;
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "passedOut":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Passed Out
          </Badge>
        );
      case "struckOff":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Struck Off
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
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
      const matchesStatus =
        !filters.status || safeToString(student.status) === filters.status;

      return (
        matchesSearch &&
        matchesClass &&
        matchesSection &&
        matchesGender &&
        matchesFatherOccupation &&
        matchesMotherOccupation &&
        matchesStatus
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

  const statusCounts = {
    active: students.filter((s) => s.status === "active" || !s.status).length,
    passedOut: students.filter((s) => s.status === "passedOut").length,
    struckOff: students.filter((s) => s.status === "struckOff").length,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Student Management
        </h1>
        <p className="text-muted-foreground">Add and manage student records</p>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Active</p>
                  <p className="text-2xl font-bold text-green-700">
                    {statusCounts.active}
                  </p>
                </div>
                <User className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Passed Out</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {statusCounts.passedOut}
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Struck Off</p>
                  <p className="text-2xl font-bold text-red-700">
                    {statusCounts.struckOff}
                  </p>
                </div>
                <UserX className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add">
            {editingStudentId ? "Edit Student" : "Add Student"}
          </TabsTrigger>
          <TabsTrigger value="list">View Students</TabsTrigger>
          <TabsTrigger value="promote">Promote/Demote</TabsTrigger>
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
                      {CLASS_ORDER.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
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
                      <option value="Purple">Purple</option>
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
                  <div className="space-y-2">
                    <Label htmlFor="discountCode">Discount Code</Label>
                    <Input
                      id="discountCode"
                      value={formData.discountCode || ""}
                      onChange={(e: { target: { value: string } }) =>
                        handleInputChange("discountCode", e.target.value)
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-4 bg-muted rounded-lg">
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
                      <Label htmlFor="statusFilter">Status</Label>
                      <Select
                        value={filters.status || "all"}
                        onValueChange={(value: string) =>
                          handleFilterChange(
                            "status",
                            value === "all" ? "" : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="passedOut">Passed Out</SelectItem>
                          <SelectItem value="struckOff">Struck Off</SelectItem>
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

                    <div className="flex items-end">
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
                    {filters.status && (
                      <Badge variant="secondary" className="text-xs">
                        Status:{" "}
                        {filters.status === "passedOut"
                          ? "Passed Out"
                          : filters.status === "struckOff"
                          ? "Struck Off"
                          : "Active"}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleFilterChange("status", "")}
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
                      {columnVisibility.status && (
                        <TableHead className="min-w-[100px]">Status</TableHead>
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
                      {columnVisibility.discountCode && (
                        <TableHead className="min-w-[100px]">
                          Discount Code
                        </TableHead>
                      )}
                      {columnVisibility.actions && (
                        <TableHead className="min-w-[150px]">Actions</TableHead>
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
                        <TableRow
                          key={student._id}
                          className={
                            student.status === "struckOff"
                              ? "bg-red-50"
                              : student.status === "passedOut"
                              ? "bg-blue-50"
                              : ""
                          }
                        >
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
                          {columnVisibility.status && (
                            <TableCell>
                              {getStatusBadge(student.status || "active")}
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
                          {columnVisibility.discountCode && (
                            <TableCell>
                              {safeToString(student.discountCode)}
                            </TableCell>
                          )}
                          {columnVisibility.actions && (
                            <TableCell>
                              <DropdownMenu
                                open={openDropdownId === student._id}
                                onOpenChange={(open) => {
                                  setOpenDropdownId(open ? student._id : null);
                                }}
                                modal={false}
                              >
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleEdit(student);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>

                                  {(student.status === "active" ||
                                    !student.status) && (
                                    <>
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          openPassOutDialog(student);
                                        }}
                                        className="text-blue-600"
                                      >
                                        <GraduationCap className="h-4 w-4 mr-2" />
                                        Pass Out
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          openStrikeOffDialog(student);
                                        }}
                                        className="text-red-600"
                                      >
                                        <UserX className="h-4 w-4 mr-2" />
                                        Strike Off
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {(student.status === "passedOut" ||
                                    student.status === "struckOff") && (
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        openReactivateDialog(student);
                                      }}
                                      className="text-green-600"
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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

        {/* New Promote/Demote Tab */}
        <TabsContent value="promote">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Promote / Demote Students
              </CardTitle>
              <CardDescription>
                Select students to promote to the next class, demote to the
                previous class, or mark as passed out. Only active students are
                shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters and Actions */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Class Filter */}
                    <div className="space-y-2">
                      <Label>Filter by Class</Label>
                      <Select
                        value={promotionClassFilter || "all"}
                        onValueChange={(value) => {
                          setPromotionClassFilter(value === "all" ? "" : value);
                          setSelectedStudentsForPromotion(new Set());
                          setPromotionCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {CLASS_ORDER.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              Class {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Section Filter */}
                    <div className="space-y-2">
                      <Label>Filter by Section</Label>
                      <Select
                        value={promotionSectionFilter || "all"}
                        onValueChange={(value) => {
                          setPromotionSectionFilter(
                            value === "all" ? "" : value
                          );
                          setSelectedStudentsForPromotion(new Set());
                          setPromotionCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
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

                    {/* Search */}
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name..."
                          value={promotionSearchTerm}
                          onChange={(e) => {
                            setPromotionSearchTerm(e.target.value);
                            setPromotionCurrentPage(1);
                          }}
                          className="w-[200px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => openBulkActionDialog("promote")}
                      disabled={selectedStudentsForPromotion.size === 0}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Promote ({selectedStudentsForPromotion.size})
                    </Button>
                    <Button
                      variant="default"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => openBulkActionDialog("demote")}
                      disabled={selectedStudentsForPromotion.size === 0}
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Demote ({selectedStudentsForPromotion.size})
                    </Button>
                    <Button
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => openBulkActionDialog("passout")}
                      disabled={selectedStudentsForPromotion.size === 0}
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Pass Out ({selectedStudentsForPromotion.size})
                    </Button>
                  </div>
                </div>

                {/* Selected Count Info */}
                {selectedStudentsForPromotion.size > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800">
                      {selectedStudentsForPromotion.size} student(s) selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudentsForPromotion(new Set())}
                      className="ml-auto text-blue-600 hover:text-blue-800"
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}

                {/* Students Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={areAllVisibleSelected}
                            onCheckedChange={handleSelectAllForPromotion}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="w-16">Photo</TableHead>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Father Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Next Class</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPromotionStudents.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center text-muted-foreground py-8"
                          >
                            No active students found matching the criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentPromotionStudents.map((student) => (
                          <TableRow
                            key={student._id}
                            className={
                              selectedStudentsForPromotion.has(student._id)
                                ? "bg-blue-50"
                                : ""
                            }
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedStudentsForPromotion.has(
                                  student._id
                                )}
                                onCheckedChange={(checked) =>
                                  handleSelectStudentForPromotion(
                                    student._id,
                                    checked as boolean
                                  )
                                }
                                aria-label={`Select ${student.studentName}`}
                              />
                            </TableCell>
                            <TableCell>
                              {getImageUrl(student) ? (
                                <img
                                  src={getImageUrl(student)!}
                                  alt={`${student.studentName}'s photo`}
                                  className="w-10 h-10 object-cover rounded-lg border"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.rollNumber}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.studentName}
                            </TableCell>
                            <TableCell>{student.fatherName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                Class {student.class}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {student.section}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isLastClass(student.class) ? (
                                <Badge className="bg-blue-100 text-blue-800">
                                  Pass Out
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">
                                  Class {getNextClass(student.class)}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {promotionTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPromotionCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={promotionCurrentPage === 1}
                    >
                      Prev
                    </Button>
                    <span className="text-sm">
                      Page {promotionCurrentPage} of {promotionTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPromotionCurrentPage((p) =>
                          Math.min(promotionTotalPages, p + 1)
                        )
                      }
                      disabled={promotionCurrentPage === promotionTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Total Active Students
                    </p>
                    <p className="text-2xl font-bold">
                      {
                        students.filter(
                          (s) => s.status === "active" || !s.status
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Filtered Students</p>
                    <p className="text-2xl font-bold">
                      {studentsForPromotion.length}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Selected</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {selectedStudentsForPromotion.size}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">
                      In Final Class (10)
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {
                        students.filter(
                          (s) =>
                            (s.status === "active" || !s.status) &&
                            s.class === "10"
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pass Out Dialog */}
      <Dialog open={passOutDialogOpen} onOpenChange={handlePassOutDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Pass Out Student
            </DialogTitle>
            <DialogDescription>
              Mark {selectedStudentForPassOut?.studentName} as passed out. This
              action can be reversed later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="passOutYear">Pass Out Year</Label>
              <Input
                id="passOutYear"
                value={passOutData.passOutYear}
                onChange={(e) =>
                  setPassOutData((prev) => ({
                    ...prev,
                    passOutYear: e.target.value,
                  }))
                }
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passOutClass">Final Class</Label>
              <select
                id="passOutClass"
                value={passOutData.passOutClass}
                onChange={(e) =>
                  setPassOutData((prev) => ({
                    ...prev,
                    passOutClass: e.target.value,
                  }))
                }
                className="border border-gray-250 shadow-xs rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Class --</option>
                {CLASS_ORDER.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passOutReason">Reason (Optional)</Label>
              <Textarea
                id="passOutReason"
                value={passOutData.reason}
                onChange={(e) =>
                  setPassOutData((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Completed education"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handlePassOutDialogClose(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePassOut}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Confirm Pass Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Strike Off Dialog */}
      <Dialog
        open={strikeOffDialogOpen}
        onOpenChange={handleStrikeOffDialogClose}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserX className="h-5 w-5" />
              Strike Off Student
            </DialogTitle>
            <DialogDescription>
              Strike off {selectedStudentForStrikeOff?.studentName} from the
              school records. A reason is required for this action.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="strikeOffReason">Reason *</Label>
              <Textarea
                id="strikeOffReason"
                value={strikeOffReason}
                onChange={(e) => setStrikeOffReason(e.target.value)}
                placeholder="Enter the reason for striking off this student..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleStrikeOffDialogClose(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStrikeOff}
              variant="destructive"
              disabled={!strikeOffReason.trim()}
            >
              <UserX className="h-4 w-4 mr-2" />
              Confirm Strike Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog
        open={reactivateDialogOpen}
        onOpenChange={handleReactivateDialogClose}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600" />
              Reactivate Student
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate{" "}
              {selectedStudentForReactivate?.studentName}? This will change
              their status back to active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => handleReactivateDialogClose(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              className="bg-green-600 hover:bg-green-700"
            >
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog
        open={bulkActionDialogOpen}
        onOpenChange={setBulkActionDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bulkActionType === "promote" && (
                <>
                  <ArrowUp className="h-5 w-5 text-green-600" />
                  Confirm Promotion
                </>
              )}
              {bulkActionType === "demote" && (
                <>
                  <ArrowDown className="h-5 w-5 text-orange-600" />
                  Confirm Demotion
                </>
              )}
              {bulkActionType === "passout" && (
                <>
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Confirm Pass Out
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {bulkActionType === "promote" && (
                <>
                  You are about to promote {selectedStudentsForPromotion.size}{" "}
                  student(s) to their next class.
                </>
              )}
              {bulkActionType === "demote" && (
                <>
                  You are about to demote {selectedStudentsForPromotion.size}{" "}
                  student(s) to their previous class.
                </>
              )}
              {bulkActionType === "passout" && (
                <>
                  You are about to mark {selectedStudentsForPromotion.size}{" "}
                  student(s) as passed out.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Summary of changes */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Summary of Changes:</Label>
              <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                {Object.entries(getSelectedStudentsClassCount()).map(
                  ([cls, count]) => (
                    <div
                      key={cls}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>Class {cls}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{count} student(s)</Badge>
                        {bulkActionType === "promote" && getNextClass(cls) && (
                          <>
                            <ArrowUp className="h-4 w-4 text-green-600" />
                            <Badge className="bg-green-100 text-green-800">
                              Class {getNextClass(cls)}
                            </Badge>
                          </>
                        )}
                        {bulkActionType === "promote" && !getNextClass(cls) && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Already in final class
                          </Badge>
                        )}
                        {bulkActionType === "demote" &&
                          getPreviousClass(cls) && (
                            <>
                              <ArrowDown className="h-4 w-4 text-orange-600" />
                              <Badge className="bg-orange-100 text-orange-800">
                                Class {getPreviousClass(cls)}
                              </Badge>
                            </>
                          )}
                        {bulkActionType === "demote" &&
                          !getPreviousClass(cls) && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Already in first class
                            </Badge>
                          )}
                        {bulkActionType === "passout" && (
                          <>
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                            <Badge className="bg-blue-100 text-blue-800">
                              Passed Out
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Pass Out Year Input for Pass Out action */}
            {bulkActionType === "passout" && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkPassOutYear">Pass Out Year</Label>
                  <Input
                    id="bulkPassOutYear"
                    value={bulkPassOutData.passOutYear}
                    onChange={(e) =>
                      setBulkPassOutData((prev) => ({
                        ...prev,
                        passOutYear: e.target.value,
                      }))
                    }
                    placeholder="2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkPassOutReason">Reason (Optional)</Label>
                  <Textarea
                    id="bulkPassOutReason"
                    value={bulkPassOutData.reason}
                    onChange={(e) =>
                      setBulkPassOutData((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="Completed education"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialogOpen(false)}
              disabled={isProcessingBulkAction}
            >
              Cancel
            </Button>
            <Button
              onClick={executeBulkAction}
              disabled={isProcessingBulkAction}
              className={
                bulkActionType === "promote"
                  ? "bg-green-600 hover:bg-green-700"
                  : bulkActionType === "demote"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {isProcessingBulkAction ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  {bulkActionType === "promote" && (
                    <ArrowUp className="h-4 w-4 mr-2" />
                  )}
                  {bulkActionType === "demote" && (
                    <ArrowDown className="h-4 w-4 mr-2" />
                  )}
                  {bulkActionType === "passout" && (
                    <GraduationCap className="h-4 w-4 mr-2" />
                  )}
                  Confirm{" "}
                  {bulkActionType === "promote"
                    ? "Promotion"
                    : bulkActionType === "demote"
                    ? "Demotion"
                    : "Pass Out"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
