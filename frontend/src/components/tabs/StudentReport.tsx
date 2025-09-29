"use client";

import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Student {
  _id: string;
  studentName: string;
  fatherName: string;
  class: string;
  section: string;
  rollNumber: string;
}

interface StudentReportData {
  student: Student;
  summary: {
    totalFee: number;
    paidAmount: number;
    pendingAmount: number;
    totalRecords: number;
    paidRecords: number;
    pendingRecords: number;
  };
  paymentHistory: {
    month: string;
    year: number;
    amount: number;
    dueDate: string;
    paidDate: string;
    status: string;
    challanId: string;
  }[];
}

const BACKEND = import.meta.env.VITE_BACKEND;

interface StudentReportProps {
  students: Student[];
}

export default function StudentReport({ students }: StudentReportProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentReportData, setStudentReportData] =
    useState<StudentReportData | null>(null);

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(student.studentName);
    setShowStudentResults(false);
    loadStudentReport(student._id);
  };

  const loadStudentReport = async (studentId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND}/api/fees/reports/student/${studentId}`,
        {
          withCredentials: true,
        }
      );
      setStudentReportData(response.data.data);
    } catch (error) {
      console.error("Error loading student report:", error);
      toast.error("Failed to load student report");
      setStudentReportData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Individual Student Report
        </CardTitle>
        <CardDescription>
          View detailed payment history for a specific student
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Label htmlFor="studentSearch">Search Student</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="studentSearch"
              placeholder="Type student name or roll number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowStudentResults(e.target.value.length > 0);
                if (e.target.value.length === 0) {
                  setSelectedStudent(null);
                  setStudentReportData(null);
                }
              }}
              className="pl-10"
            />
          </div>

          {showStudentResults && searchQuery && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.slice(0, 10).map((student) => (
                  <div
                    key={student._id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="font-medium">{student.studentName}</div>
                    <div className="text-sm text-gray-500">
                      Roll No: {student.rollNumber} | Father:{" "}
                      {student.fatherName} | Class: {student.class}-
                      {student.section}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-500">No students found</div>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading student report...</span>
          </div>
        )}

        {studentReportData && !loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Paid
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        Rs.{" "}
                        {studentReportData.summary.paidAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">
                        Rs.{" "}
                        {studentReportData.summary.pendingAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fee</p>
                      <p className="text-2xl font-bold text-blue-600">
                        Rs.{" "}
                        {studentReportData.summary.totalFee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  Payment History - {studentReportData.student.studentName}
                </CardTitle>
                <CardDescription>
                  Class {studentReportData.student.class}-
                  {studentReportData.student.section} | Roll No:{" "}
                  {studentReportData.student.rollNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentReportData.paymentHistory.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {payment.month}
                        </TableCell>
                        <TableCell>{payment.year}</TableCell>
                        <TableCell>
                          Rs. {payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{payment.dueDate || "N/A"}</TableCell>
                        <TableCell>{payment.paidDate || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "paid"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedStudent && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Search and select a student to view their payment report
          </div>
        )}
      </CardContent>
    </Card>
  );
}
