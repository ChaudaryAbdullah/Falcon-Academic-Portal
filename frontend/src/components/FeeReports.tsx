"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  Search,
  Download,
  Calendar,
  Users,
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

interface ReportRecord {
  _id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  class: string;
  section: string;
  rollNumber: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  lastPayment: string;
  status: string;
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

interface SummaryData {
  summary: {
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    totalStudents: number;
    paidStudents: number;
    collectionPercentage: number;
  };
  monthlyBreakdown: {
    month: string;
    year: number;
    expected: number;
    collected: number;
    pending: number;
    collectionPercentage: number;
  }[];
}

const BACKEND = import.meta.env.VITE_BACKEND;

export default function FeeReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportRecord[]>([]);
  const [studentReportData, setStudentReportData] =
    useState<StudentReportData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const [reportFilters, setReportFilters] = useState({});

  const months = [
    { value: "all", label: "All Months" },
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "April", label: "April" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "July", label: "July" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "October", label: "October" },
    { value: "November", label: "November" },
    { value: "December", label: "December" },
  ];

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${BACKEND}/api/students`, {
          withCredentials: true,
        });
        setStudents(response.data.data || []);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Failed to load students");
      }
    };
    fetchStudents();
  }, []);

  // Load summary data on component mount
  useEffect(() => {
    loadSummaryReport();
  }, []);

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

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reportType: reportFilters.reportType,
        year: reportFilters.year,
      });

      if (reportFilters.class) params.append("class", reportFilters.class);
      if (
        reportFilters.section &&
        reportFilters.reportType === "class-section"
      ) {
        params.append("section", reportFilters.section);
      }
      if (reportFilters.month !== "all")
        params.append("month", reportFilters.month);

      const response = await axios.get(
        `${BACKEND}/api/fees/reports/class-section?${params}`,
        {
          withCredentials: true,
        }
      );

      setReportData(response.data.data || []);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
      setReportData([]);
    } finally {
      setLoading(false);
    }
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

  const loadSummaryReport = async () => {
    try {
      const response = await axios.get(`${BACKEND}/api/fees/reports/summary`, {
        withCredentials: true,
      });
      setSummaryData(response.data.data);
    } catch (error) {
      console.error("Error loading summary report:", error);
      toast.error("Failed to load summary report");
    }
  };

  const exportReport = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvContent = [
      [
        "Student ID",
        "Name",
        "Father Name",
        "Class",
        "Section",
        "Total Fee",
        "Paid Amount",
        "Pending",
        "Last Payment",
        "Status",
      ],
      ...reportData.map((record) => [
        record.rollNumber,
        record.studentName,
        record.fatherName,
        record.class,
        record.section,
        record.totalFee.toString(),
        record.paidAmount.toString(),
        record.pendingAmount.toString(),
        record.lastPayment || "N/A",
        record.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fee-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  const getMonthName = (monthNum: string | number) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[parseInt(monthNum.toString()) - 1] || monthNum;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Reports</h2>
          <p className="text-muted-foreground">
            Generate comprehensive fee payment reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="class-reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="class-reports">Class Reports</TabsTrigger>
          <TabsTrigger value="student-report">Individual Student</TabsTrigger>
          <TabsTrigger value="summary">Summary Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="class-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Class & Section Reports
              </CardTitle>
              <CardDescription>
                Generate fee reports by class, section, and time period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportFilters.reportType}
                    onValueChange={(value) =>
                      setReportFilters({ ...reportFilters, reportType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class-section">
                        Class & Section
                      </SelectItem>
                      <SelectItem value="class-all">
                        Class (All Sections)
                      </SelectItem>
                      <SelectItem value="all-students">All Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    value={reportFilters.class}
                    onValueChange={(value) =>
                      setReportFilters({ ...reportFilters, class: value })
                    }
                    disabled={reportFilters.reportType === "all-students"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">Class 9</SelectItem>
                      <SelectItem value="10">Class 10</SelectItem>
                      <SelectItem value="11">Class 11</SelectItem>
                      <SelectItem value="12">Class 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Select
                    value={reportFilters.section}
                    onValueChange={(value) =>
                      setReportFilters({ ...reportFilters, section: value })
                    }
                    disabled={reportFilters.reportType !== "class-section"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Section A</SelectItem>
                      <SelectItem value="B">Section B</SelectItem>
                      <SelectItem value="C">Section C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select
                    value={reportFilters.month}
                    onValueChange={(value) =>
                      setReportFilters({ ...reportFilters, month: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={reportFilters.year}
                    onValueChange={(value) =>
                      setReportFilters({ ...reportFilters, year: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateReport}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  onClick={exportReport}
                  className="flex items-center gap-2 bg-transparent"
                  disabled={reportData.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>

              {/* Report Results Table */}
              {reportData.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Father Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Total Fee</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Last Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {record.rollNumber}
                          </TableCell>
                          <TableCell>{record.studentName}</TableCell>
                          <TableCell>{record.fatherName}</TableCell>
                          <TableCell>{record.class}</TableCell>
                          <TableCell>{record.section}</TableCell>
                          <TableCell>
                            Rs. {record.totalFee.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            Rs. {record.paidAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            Rs. {record.pendingAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>{record.lastPayment || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.pendingAmount === 0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {record.pendingAmount === 0 ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Loading report...</span>
                </div>
              )}

              {!loading && reportData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Generate Report" to view fee data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student-report" className="space-y-4">
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
                <div className="relative">
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
                          <div className="font-medium">
                            {student.studentName}
                          </div>
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
                            <p className="text-sm text-muted-foreground">
                              Pending
                            </p>
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
                            <p className="text-sm text-muted-foreground">
                              Total Fee
                            </p>
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
                        Payment History -{" "}
                        {studentReportData.student.studentName}
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
                          {studentReportData.paymentHistory.map(
                            (payment, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {payment.month}
                                </TableCell>
                                <TableCell>{payment.year}</TableCell>
                                <TableCell>
                                  Rs. {payment.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {payment.dueDate || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {payment.paidDate || "N/A"}
                                </TableCell>
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
                            )
                          )}
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
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {summaryData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Collected
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          Rs.{" "}
                          {summaryData.summary.totalCollected.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Pending
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          Rs.{" "}
                          {summaryData.summary.totalPending.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Students Paid
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {summaryData.summary.paidStudents}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Collection Rate
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          {summaryData.summary.collectionPercentage}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Collection Summary</CardTitle>
                  <CardDescription>
                    Fee collection overview by month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Expected</TableHead>
                        <TableHead>Collected</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Collection %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryData.monthlyBreakdown.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {record.month}
                          </TableCell>
                          <TableCell>{record.year}</TableCell>
                          <TableCell>
                            Rs. {record.expected.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            Rs. {record.collected.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            Rs. {record.pending.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.collectionPercentage >= 80
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {record.collectionPercentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {summaryData.monthlyBreakdown.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground"
                          >
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!summaryData && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading summary...</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
