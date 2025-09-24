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
  CalendarDays,
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

interface DailyReportData {
  date: string;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalTransactions: number;
  students: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    class: string;
    section: string;
    amount: number;
    challanId: string;
    paymentTime: string;
  }[];
}

const BACKEND = import.meta.env.VITE_BACKEND;

interface FeeReportProps {
  students: Student[];
}

export default function FeeReports({ students }: FeeReportProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportRecord[]>([]);
  const [studentReportData, setStudentReportData] =
    useState<StudentReportData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [dailyReportData, setDailyReportData] =
    useState<DailyReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Initialize reportFilters with default values
  const [reportFilters, setReportFilters] = useState({
    reportType: "all-students",
    class: "",
    section: "",
    month: "all",
    year: new Date().getFullYear().toString(),
  });

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

  // Available classes based on your student model
  const classes = [
    { value: "Play", label: "Play" },
    { value: "Nursery", label: "Nursery" },
    { value: "Prep", label: "Prep" },
    { value: "1", label: "Class 1" },
    { value: "2", label: "Class 2" },
    { value: "3", label: "Class 3" },
    { value: "4", label: "Class 4" },
    { value: "5", label: "Class 5" },
    { value: "6", label: "Class 6" },
    { value: "7", label: "Class 7" },
    { value: "8", label: "Class 8" },
    { value: "9", label: "Class 9" },
    { value: "10", label: "Class 10" },
  ];

  // Available sections based on your student model
  const sections = [
    { value: "Red", label: "Red" },
    { value: "Blue", label: "Blue" },
    { value: "Pink", label: "Pink" },
    { value: "Green", label: "Green" },
    { value: "Yellow", label: "Yellow" },
    { value: "White", label: "White" },
  ];

  // Generate years dynamically (current year + 3 previous years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 3; i++) {
      const year = currentYear - i;
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  };

  const years = generateYears();

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

  // Calculate report summary totals
  const getReportSummary = () => {
    if (reportData.length === 0) {
      return {
        totalFee: 0,
        totalCollected: 0,
        totalRemaining: 0,
        collectionPercentage: 0,
      };
    }

    const totalFee = reportData.reduce(
      (sum, record) => sum + (record.totalFee || 0),
      0
    );
    const totalCollected = reportData.reduce(
      (sum, record) => sum + (record.paidAmount || 0),
      0
    );
    const totalRemaining = reportData.reduce(
      (sum, record) => sum + (record.pendingAmount || 0),
      0
    );
    const collectionPercentage =
      totalFee > 0 ? Math.round((totalCollected / totalFee) * 100) : 0;

    return {
      totalFee,
      totalCollected,
      totalRemaining,
      collectionPercentage,
    };
  };

  // Pagination logic
  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = reportData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const generateReport = async () => {
    // Validate required fields
    if (!reportFilters.reportType || !reportFilters.year) {
      toast.error("Please select report type and year");
      return;
    }

    if (
      reportFilters.reportType === "class-section" &&
      (!reportFilters.class || !reportFilters.section)
    ) {
      toast.error(
        "Please select both class and section for class-section report"
      );
      return;
    }

    if (reportFilters.reportType === "class-all" && !reportFilters.class) {
      toast.error("Please select a class for class report");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        reportType: reportFilters.reportType,
        year: reportFilters.year,
      });

      // Add class parameter for class-specific reports
      if (
        reportFilters.class &&
        (reportFilters.reportType === "class-section" ||
          reportFilters.reportType === "class-all")
      ) {
        params.append("class", reportFilters.class);
      }

      // Add section parameter only for class-section reports
      if (
        reportFilters.section &&
        reportFilters.reportType === "class-section"
      ) {
        params.append("section", reportFilters.section);
      }

      // Add month parameter if not "all"
      if (reportFilters.month && reportFilters.month !== "all") {
        params.append("month", reportFilters.month);
      }

      const response = await axios.get(
        `${BACKEND}/api/fees/reports/class-section?${params}`,
        {
          withCredentials: true,
        }
      );

      setReportData(response.data.data || []);
      setCurrentPage(1); // Reset to first page when new report is generated
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
        "Roll Number",
        "Student Name",
        "Father Name",
        "Class",
        "Section",
        "Total Fee",
        "Paid Amount",
        "Pending Amount",
        "Last Payment",
        "Status",
      ],
      ...reportData.map((record) => [
        record.rollNumber || "N/A",
        record.studentName || "N/A",
        record.fatherName || "N/A",
        record.class || "N/A",
        record.section || "N/A",
        record.totalFee?.toString() || "0",
        record.paidAmount?.toString() || "0",
        record.pendingAmount?.toString() || "0",
        record.lastPayment || "N/A",
        record.status || "N/A",
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

  const loadDailyReport = async (date: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND}/api/fees/reports/daily?date=${date}`,
        {
          withCredentials: true,
        }
      );
      setDailyReportData(response.data.data);
      toast.success("Daily report loaded successfully");
    } catch (error) {
      console.error("Error loading daily report:", error);
      toast.error("Failed to load daily report");
      setDailyReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportDailyReport = () => {
    if (!dailyReportData || dailyReportData.students.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvContent = [
      [
        "Date",
        "Roll Number",
        "Student Name",
        "Class",
        "Section",
        "Amount Paid",
        "Challan ID",
        "Payment Time",
      ],
      ...dailyReportData.students.map((student) => [
        dailyReportData.date,
        student.rollNumber || "N/A",
        student.studentName || "N/A",
        student.class || "N/A",
        student.section || "N/A",
        student.amount?.toString() || "0",
        student.challanId || "N/A",
        student.paymentTime || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-fee-report-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Daily report exported successfully");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Reports</h2>
          <p className="text-muted-foreground">
            Generate comprehensive fee payment reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="class-reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="class-reports">Class Reports</TabsTrigger>
          <TabsTrigger value="daily-reports">Daily Reports</TabsTrigger>
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
                      <SelectItem value="all-students">All Students</SelectItem>
                      <SelectItem value="class-all">
                        Class (All Sections)
                      </SelectItem>
                      <SelectItem value="class-section">
                        Class & Section
                      </SelectItem>
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
                      {classes.map((cls) => (
                        <SelectItem key={cls.value} value={cls.value}>
                          {cls.label}
                        </SelectItem>
                      ))}
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
                      {sections.map((section) => (
                        <SelectItem key={section.value} value={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
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
                      {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
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
                <div className="space-y-4">
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
                        {currentData.map((record) => (
                          <TableRow key={record._id}>
                            <TableCell className="font-medium">
                              {record.rollNumber || "N/A"}
                            </TableCell>
                            <TableCell>{record.studentName || "N/A"}</TableCell>
                            <TableCell>{record.fatherName || "N/A"}</TableCell>
                            <TableCell>{record.class || "N/A"}</TableCell>
                            <TableCell>{record.section || "N/A"}</TableCell>
                            <TableCell>
                              Rs. {(record.totalFee || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              Rs. {(record.paidAmount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              Rs. {(record.pendingAmount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>{record.lastPayment || "N/A"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  (record.pendingAmount || 0) === 0
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {(record.pendingAmount || 0) === 0
                                  ? "Paid"
                                  : "Pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground ">
                        Showing {startIndex + 1} to{" "}
                        {Math.min(endIndex, reportData.length)} of{" "}
                        {reportData.length} entries
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, index) => {
                              let pageNumber;
                              if (totalPages <= 5) {
                                pageNumber = index + 1;
                              } else if (currentPage <= 3) {
                                pageNumber = index + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + index;
                              } else {
                                pageNumber = currentPage - 2 + index;
                              }

                              return (
                                <Button
                                  key={pageNumber}
                                  variant={
                                    currentPage === pageNumber
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => handlePageChange(pageNumber)}
                                  className="w-8 h-8 p-0"
                                  style={
                                    currentPage === pageNumber
                                      ? {
                                          backgroundColor:
                                            "rgba(17, 107, 251, 1)",
                                        }
                                      : undefined
                                  }
                                >
                                  {pageNumber}
                                </Button>
                              );
                            }
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Report Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Fee
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              Rs. {getReportSummary().totalFee.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Amount Collected
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              Rs.{" "}
                              {getReportSummary().totalCollected.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-8 h-8 text-red-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Remaining Fee
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                              Rs.{" "}
                              {getReportSummary().totalRemaining.toLocaleString()}
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
                              {getReportSummary().collectionPercentage}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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

        <TabsContent value="daily-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Daily Fee Collection Report
              </CardTitle>
              <CardDescription>
                View fee collections for a specific date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                <div className="space-y-2 flex-1 sm:flex-initial">
                  <Label htmlFor="date">Select Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Button
                    onClick={() => loadDailyReport(selectedDate)}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Load Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportDailyReport}
                    className="flex items-center justify-center gap-2 bg-transparent w-full sm:w-auto"
                    disabled={
                      !dailyReportData || dailyReportData.students.length === 0
                    }
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Loading daily report...</span>
                </div>
              )}

              {dailyReportData && !loading && (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Total Collected
                            </p>
                            <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                              Rs.{" "}
                              {dailyReportData.totalCollected.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2">
                          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Total Transactions
                            </p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-600">
                              {dailyReportData.totalTransactions}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Average Payment
                            </p>
                            <p className="text-lg sm:text-2xl font-bold text-purple-600 truncate">
                              Rs.{" "}
                              {dailyReportData.totalTransactions > 0
                                ? Math.round(
                                    dailyReportData.totalCollected /
                                      dailyReportData.totalTransactions
                                  ).toLocaleString()
                                : 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Report Date
                            </p>
                            <p className="text-sm sm:text-xl font-bold text-orange-600 break-words">
                              {new Date(
                                dailyReportData.date
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Transactions Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">
                        Payment Transactions
                      </CardTitle>
                      <CardDescription className="text-sm">
                        All fee payments received on{" "}
                        {new Date(dailyReportData.date).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6">
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">
                                Time
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Roll No.
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Student Name
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Class
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Section
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Amount
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Challan ID
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dailyReportData.students.length > 0 ? (
                              dailyReportData.students.map((student, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium whitespace-nowrap">
                                    {new Date(
                                      student.paymentTime
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {student.rollNumber}
                                  </TableCell>
                                  <TableCell className="min-w-[150px]">
                                    {student.studentName}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {student.class}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {student.section}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    Rs. {student.amount.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="whitespace-nowrap"
                                    >
                                      {student.challanId}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No payments received on this date
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!dailyReportData && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Select a date and click "Load Report" to view daily
                  collections
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
