"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  Users,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useDebouncedValue } from "../hooks/useDebounce";
import { cacheManager } from "../utils/cacheManager";

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

// Pagination configuration
const ITEMS_PER_PAGE = 30;
const SEARCH_RESULTS_LIMIT = 10;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export default function StudentDiscountPage({
  students,
}: DiscountManagementProps) {
  // Search and selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [editingDiscount, setEditingDiscount] =
    useState<StudentDiscount | null>(null);

  // Data state
  const [discounts, setDiscounts] = useState<StudentDiscount[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI state
  const [tabValue, setTabValue] = useState("add-discount");
  const [discountSearch, setDiscountSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search values
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const debouncedDiscountSearch = useDebouncedValue(discountSearch, 300);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasFetchedDiscounts = useRef(false);

  // ============ DATA FETCHING ============

  // Fetch discounts with caching
  const fetchDiscounts = useCallback(async (forceRefresh = false) => {
    const cacheKey = "student_discounts";

    // Check cache first
    if (!forceRefresh) {
      const cached = cacheManager.get<StudentDiscount[]>(cacheKey);
      if (cached) {
        console.log("✅ Using cached discounts");
        setDiscounts(cached);
        setIsLoadingDiscounts(false);
        return;
      }
    }

    try {
      setIsLoadingDiscounts(true);
      const res = await axios.get(`${BACKEND}/api/student-discounts`, {
        withCredentials: true,
      });

      const data = res.data || [];
      setDiscounts(data);

      // Cache the results
      cacheManager.set(cacheKey, data, CACHE_TTL);

      console.log(`📊 Loaded ${data.length} discounts`);
    } catch (error: any) {
      console.error("Error fetching discounts:", error);
      toast.error(
        error.response?.data?.message || "Failed to load discounts"
      );
    } finally {
      setIsLoadingDiscounts(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!hasFetchedDiscounts.current) {
      hasFetchedDiscounts.current = true;
      fetchDiscounts();
    }
  }, [fetchDiscounts]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    cacheManager.delete("student_discounts");
    fetchDiscounts(true);
  }, [fetchDiscounts]);

  // ============ SEARCH & FILTERING ============

  // Memoized filtered students (for student search dropdown)
  const filteredStudents = useMemo(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
      return [];
    }

    const query = debouncedSearchQuery.toLowerCase();

    return students
      .filter(
        (student) =>
          student.studentName.toLowerCase().includes(query) ||
          student.rollNumber.toLowerCase().includes(query) ||
          student._id.includes(query)
      )
      .slice(0, SEARCH_RESULTS_LIMIT);
  }, [students, debouncedSearchQuery]);

  // Memoized filtered discounts (for discount list)
  const filteredDiscounts = useMemo(() => {
    // Filter out discounts with null studentId (deleted students)
    const validDiscounts = discounts.filter((d) => d.studentId);

    if (!debouncedDiscountSearch || debouncedDiscountSearch.length < 2) {
      return validDiscounts;
    }

    const query = debouncedDiscountSearch.toLowerCase();

    return validDiscounts.filter(
      (d) =>
        d.studentId?.studentName?.toLowerCase().includes(query) ||
        d.studentId?.fatherName?.toLowerCase().includes(query) ||
        d.studentId?.rollNumber?.toLowerCase().includes(query) ||
        d.studentId?._id?.includes(query) ||
        d.discount.toString().includes(query)
    );
  }, [discounts, debouncedDiscountSearch]);

  // ============ PAGINATION ============

  // Pagination calculations
  const totalPages = Math.ceil(filteredDiscounts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDiscounts = useMemo(
    () => filteredDiscounts.slice(startIndex, endIndex),
    [filteredDiscounts, startIndex, endIndex]
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedDiscountSearch]);

  // Page navigation
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const delta = 1; // Pages to show around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  }, [totalPages, currentPage]);

  // ============ STUDENT SELECTION ============

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(student.studentName);
    setShowSearchResults(false);
  }, []);

  const clearStudentSelection = useCallback(() => {
    setSelectedStudent(null);
    setSearchQuery("");
    setShowSearchResults(false);
  }, []);

  // ============ CRUD OPERATIONS ============

  // Add or Update Discount
  const handleSaveDiscount = useCallback(async () => {
    if (!selectedStudent || !discountAmount) {
      toast.error("Please select a student and enter discount amount");
      return;
    }

    const amount = Number.parseFloat(discountAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    try {
      const payload = {
        studentId: selectedStudent._id,
        discount: amount,
      };

      const res = await axios.post(`${BACKEND}/api/student-discounts`, payload, {
        withCredentials: true,
      });

      if (editingDiscount) {
        // Update existing discount
        setDiscounts((prev) =>
          prev.map((d) => (d._id === editingDiscount._id ? res.data : d))
        );
        toast.success("Discount updated successfully");
      } else {
        // Add new discount
        setDiscounts((prev) => [res.data, ...prev]);
        toast.success("Discount added successfully");
      }

      // Clear cache
      cacheManager.delete("student_discounts");

      // Reset form
      setEditingDiscount(null);
      clearStudentSelection();
      setDiscountAmount("");
      setTabValue("view-discounts");
    } catch (error: any) {
      console.error("Error saving discount:", error);
      toast.error(error.response?.data?.message || "Failed to save discount");
    }
  }, [selectedStudent, discountAmount, editingDiscount, clearStudentSelection]);

  // Delete Discount
  const handleDeleteDiscount = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) {
      return;
    }

    try {
      await axios.delete(`${BACKEND}/api/student-discounts/${id}`, {
        withCredentials: true,
      });

      setDiscounts((prev) => prev.filter((d) => d._id !== id));
      cacheManager.delete("student_discounts");
      toast.success("Discount removed successfully");
    } catch (error: any) {
      console.error("Error deleting discount:", error);
      toast.error(error.response?.data?.message || "Failed to delete discount");
    }
  }, []);

  // Edit Discount
  const handleEditDiscount = useCallback(
    (discount: StudentDiscount) => {
      setEditingDiscount(discount);
      setSelectedStudent(discount.studentId);
      setSearchQuery(discount.studentId.studentName);
      setDiscountAmount(discount.discount.toString());
      setTabValue("add-discount");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  // Cancel Edit
  const handleCancelEdit = useCallback(() => {
    setEditingDiscount(null);
    clearStudentSelection();
    setDiscountAmount("");
  }, [clearStudentSelection]);

  // ============ KEYBOARD SHORTCUTS ============

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape to clear search/selection
      if (e.key === "Escape") {
        if (showSearchResults) {
          setShowSearchResults(false);
        } else if (selectedStudent) {
          clearStudentSelection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showSearchResults, selectedStudent, clearStudentSelection]);

  // ============ RENDER ============

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 pt-20 md:pt-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Student Discount Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Add and manage discounts for students
          </p>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
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

        {/* ========== ADD / UPDATE DISCOUNT TAB ========== */}
        <TabsContent value="add-discount">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingDiscount ? (
                  <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="text-base sm:text-lg">
                  {editingDiscount
                    ? "Update Student Discount"
                    : "Add Student Discount"}
                </span>
              </CardTitle>
              <CardDescription>
                Search for a student and {editingDiscount ? "update" : "add"} a
                discount amount in rupees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Student Search */}
              <div className="space-y-2">
                <Label htmlFor="student-search">
                  Search Student
                  <span className="text-xs text-gray-500 ml-2">
                    (Press Ctrl+K to focus)
                  </span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    id="student-search"
                    placeholder="Type student name, roll number, or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(e.target.value.length > 0);
                      if (e.target.value.length === 0) {
                        setSelectedStudent(null);
                      }
                    }}
                    onFocus={() =>
                      searchQuery.length > 0 && setShowSearchResults(true)
                    }
                    className="pl-10"
                  />

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchQuery.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <div
                            key={student._id}
                            className="p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
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
                          {debouncedSearchQuery !== searchQuery ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Searching...</span>
                            </div>
                          ) : (
                            "No students found"
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Student Badge */}
                  {selectedStudent && !showSearchResults && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          {selectedStudent.studentName}
                        </p>
                        <p className="text-xs text-green-700">
                          Roll: {selectedStudent.rollNumber} | Class:{" "}
                          {selectedStudent.class}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearStudentSelection}
                      >
                        Clear
                      </Button>
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
                  min="0"
                  step="0.01"
                  placeholder="Enter discount amount in rupees"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSaveDiscount();
                    }
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveDiscount}
                  className="flex-1"
                  disabled={!selectedStudent || !discountAmount}
                >
                  {editingDiscount ? "Update Discount" : "Add Discount"}
                </Button>

                {editingDiscount && (
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== VIEW DISCOUNTS TAB ========== */}
        <TabsContent value="view-discounts">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-base sm:text-lg">
                      All Student Discounts
                    </span>
                  </CardTitle>
                  <CardDescription>
                    View and manage all student discounts (
                    {filteredDiscounts.length} total)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, roll number, or discount amount..."
                  value={discountSearch}
                  onChange={(e) => setDiscountSearch(e.target.value)}
                  className="pl-10"
                />
                {discountSearch && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-2"
                    onClick={() => setDiscountSearch("")}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Loading State */}
              {isLoadingDiscounts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Loading discounts...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Discount List */}
                  <div className="space-y-3 sm:space-y-4">
                    {paginatedDiscounts.length > 0 ? (
                      paginatedDiscounts.map((discount) => (
                        <Card
                          key={discount._id}
                          className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                    {discount.studentId?.studentName || "Student (Deleted)"}
                                  </h3>
                                  <div className="space-y-0.5 mt-1">
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      Roll: {discount.studentId?.rollNumber || "N/A"}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                                      Father: {discount.studentId?.fatherName || "N/A"}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      Class: {discount.studentId?.class || "N/A"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                      <span className="text-xs text-gray-500">
                                        {discount.studentId?.mPhoneNumber || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right">
                                <div>
                                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                                    Rs. {discount.discount.toLocaleString()}
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
                                    onClick={() => handleEditDiscount(discount)}
                                    title="Edit discount"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleDeleteDiscount(discount._id)
                                    }
                                    title="Delete discount"
                                    className="hover:bg-red-50 hover:border-red-300"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm sm:text-base text-gray-500">
                          {discountSearch
                            ? "No discounts match your search"
                            : "No discounts found"}
                        </p>
                        {discountSearch && (
                          <Button
                            variant="link"
                            onClick={() => setDiscountSearch("")}
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {filteredDiscounts.length > 0 && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-4 border-t">
                      <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, filteredDiscounts.length)} of{" "}
                        {filteredDiscounts.length} discounts
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        {/* Previous Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevPage}
                          disabled={currentPage === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {pageNumbers.map((page, index) =>
                            page === "..." ? (
                              <span
                                key={`ellipsis-${index}`}
                                className="px-2 text-gray-400"
                              >
                                ...
                              </span>
                            ) : (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => goToPage(page as number)}
                                className={`min-w-[2rem] ${
                                  currentPage === page
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : ""
                                }`}
                              >
                                {page}
                              </Button>
                            )
                          )}
                        </div>

                        {/* Next Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextPage}
                          disabled={currentPage === totalPages}
                          className="gap-1"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}