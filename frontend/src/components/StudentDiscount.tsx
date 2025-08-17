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
  fPhoneNumber: string;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Student Discount Management
        </h1>
        <p className="text-gray-600 mt-2">
          Add and manage discounts for students
        </p>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-discount">
            {editingDiscount ? "Update Discount" : "Add Discount"}
          </TabsTrigger>
          <TabsTrigger value="view-discounts">View All Discounts</TabsTrigger>
        </TabsList>

        {/* Add / Update Discount Tab */}
        <TabsContent value="add-discount">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {editingDiscount
                  ? "Update Student Discount"
                  : "Add Student Discount"}
              </CardTitle>
              <CardDescription>
                Search for a student and add a discount amount in rupees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.slice(0, 10).map((student) => (
                          <div
                            key={student._id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleStudentSelect(student)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {student.studentName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Father: {student.fatherName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Class: {student.class}
                                </p>
                              </div>
                              <Badge variant="outline">
                                Roll Number: {student.rollNumber}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">
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
                <Users className="w-5 h-5" />
                All Student Discounts
              </CardTitle>
              <CardDescription>
                View and manage all student discounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discounts.length > 0 ? (
                  discounts.map((discount) => (
                    <Card
                      key={discount._id}
                      className="border-l-4 border-l-green-500"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {discount.studentId.studentName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Father: {discount.studentId.fatherName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Class: {discount.studentId.class}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {discount.studentId.fPhoneNumber}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              Rs. {discount.discount}
                            </div>
                            <p className="text-xs text-gray-500">
                              Added on{" "}
                              {new Date(
                                discount.createdAt
                              ).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2 mt-2">
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No discounts found</p>
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
