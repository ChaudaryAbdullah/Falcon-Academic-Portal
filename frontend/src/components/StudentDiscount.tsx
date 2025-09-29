"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Search, Plus, Edit, Trash2, User, Phone, Users } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND;

interface Student {
  _id: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  mPhoneNumber: string;
  class: string;
}

interface StudentDiscount {
  _id: string;
  studentId: Student;
  discount: number;
  createdAt: string;
}

interface DiscountManagementProps {
  students: Student[];
}

export default function StudentDiscountPage({
  students,
}: DiscountManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [editingDiscount, setEditingDiscount] =
    useState<StudentDiscount | null>(null);
  const [discounts, setDiscounts] = useState<StudentDiscount[]>([]);
  const [tabValue, setTabValue] = useState("add-discount");
  const [discountSearch, setDiscountSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Fetch all discounts
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/student-discounts`);
        setDiscounts(res.data);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to load discounts"
        );
      }
    };
    fetchDiscounts();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student._id.includes(searchQuery) ||
      student.rollNumber.includes(searchQuery)
  );

  const filteredDiscounts = discounts.filter(
    (d) =>
      d.studentId?.studentName
        ?.toLowerCase()
        .includes(discountSearch.toLowerCase()) ||
      d.studentId?.fatherName
        ?.toLowerCase()
        .includes(discountSearch.toLowerCase()) ||
      d.studentId?.rollNumber?.includes(discountSearch) ||
      d.studentId?._id?.includes(discountSearch) ||
      d.discount.toString().includes(discountSearch)
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredDiscounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDiscounts = filteredDiscounts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [discountSearch]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(student.studentName);
    setShowSearchResults(false);
  };

  // 🔹 Add or Update Discount
  const handleSaveDiscount = async () => {
    if (!selectedStudent || !discountAmount) {
      toast.error("Please select a student and enter discount amount");
      return;
    }

    try {
      const payload = {
        studentId: selectedStudent._id,
        discount: Number.parseFloat(discountAmount),
      };

      const res = await axios.post(`${BACKEND}/api/student-discounts`, payload);

      if (editingDiscount) {
        // Update in state
        setDiscounts((prev) =>
          prev.map((d) => (d._id === editingDiscount._id ? res.data : d))
        );
        toast.success("Discount updated successfully");
      } else {
        // Add new discount
        setDiscounts((prev) => [res.data, ...prev]);
        toast.success("Discount added successfully");
      }

      // Reset form
      setEditingDiscount(null);
      setSelectedStudent(null);
      setSearchQuery("");
      setDiscountAmount("");
      setTabValue("view-discounts");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save discount");
    }
  };

  // 🔹 Delete Discount
  const handleDeleteDiscount = async (id: string) => {
    try {
      await axios.delete(`${BACKEND}/api/student-discounts/${id}`);
      setDiscounts((prev) => prev.filter((d) => d._id !== id));
      toast.success("Discount removed successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete discount");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 pt-20 md:pt-6 relative z-10">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Student Discount Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Add and manage discounts for students
        </p>
      </div>

      <Tabs
        value={tabValue}
        onValueChange={setTabValue}
        className="space-y-4 sm:space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-discount">
            <span className="hidden sm:inline">
              {editingDiscount ? "Update Discount" : "Add Discount"}
            </span>
            <span className="sm:hidden">
              {editingDiscount ? "Update" : "Add"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="view-discounts">
            <span className="hidden sm:inline">View All Discounts</span>
            <span className="sm:hidden">View All</span>
          </TabsTrigger>
        </TabsList>

        {/* Add / Update Discount Tab */}
        <TabsContent value="add-discount">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-base sm:text-lg">
                  {editingDiscount
                    ? "Update Student Discount"
                    : "Add Student Discount"}
                </span>
              </CardTitle>
              <CardDescription>
                Search for a student and add a discount amount in rupees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Student Search */}
              <div className="space-y-2">
                <Label htmlFor="student-search">Search Student</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="student-search"
                    placeholder="Type student name or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(e.target.value.length > 0);
                      if (e.target.value.length === 0) {
                        setSelectedStudent(null);
                      }
                    }}
                    className="pl-10"
                  />
                  {showSearchResults && searchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.slice(0, 10).map((student) => (
                          <div
                            key={student._id}
                            className="p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleStudentSelect(student)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="font-medium text-sm sm:text-base text-gray-900">
                                  {student.studentName}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Father: {student.fatherName}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Class: {student.class}
                                </p>
                              </div>
                              <Badge variant="outline">
                                <span className="text-xs">
                                  Roll: {student.rollNumber}
                                </span>
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-sm text-gray-500">
                          No students found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Discount Input */}
              <div className="space-y-2">
                <Label htmlFor="discount-amount">Discount Amount (Rs.)</Label>
                <Input
                  id="discount-amount"
                  type="number"
                  placeholder="Enter discount amount in rupees"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSaveDiscount}
                className="w-full"
                disabled={!selectedStudent || !discountAmount}
              >
                {editingDiscount ? "Update Discount" : "Add Discount"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Discounts Tab */}
        <TabsContent value="view-discounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-base sm:text-lg">
                  All Student Discounts
                </span>
              </CardTitle>
              <CardDescription>
                View and manage all student discounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search discounts..."
                  value={discountSearch}
                  onChange={(e) => setDiscountSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-3 sm:space-y-4">
                {paginatedDiscounts.length > 0 ? (
                  <>
                    {paginatedDiscounts.map((discount) => (
                      <Card
                        key={discount._id}
                        className="border-l-4 border-l-green-500"
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                  {discount.studentId.studentName}
                                </h3>
                                <div className="space-y-0.5 mt-1">
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    Roll: {discount.studentId.rollNumber}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                                    Father: {discount.studentId.fatherName}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    Class: {discount.studentId.class}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-500">
                                      {discount.studentId.mPhoneNumber}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right">
                              <div>
                                <div className="text-xl sm:text-2xl font-bold text-green-600">
                                  Rs. {discount.discount}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {new Date(
                                    discount.createdAt
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingDiscount(discount);
                                    setSelectedStudent(discount.studentId);
                                    setSearchQuery(
                                      discount.studentId.studentName
                                    );
                                    setDiscountAmount(
                                      discount.discount.toString()
                                    );
                                    setTabValue("add-discount");
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteDiscount(discount._id)
                                  }
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm sm:text-base">No discounts found</p>
                  </div>
                )}

                {/* Pagination Controls */}
                {filteredDiscounts.length > 0 && totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
                    <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, filteredDiscounts.length)} of{" "}
                      {filteredDiscounts.length}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="w-full sm:w-auto"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1
                          )
                          .map((page, index, array) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-1 sm:px-2 text-gray-400 text-sm">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`${
                                  currentPage === page ? "bg-blue-500" : ""
                                } min-w-[2rem]`}
                              >
                                {page}
                              </Button>
                            </div>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="w-full sm:w-auto"
                      >
                        Next
                      </Button>
                    </div>
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
