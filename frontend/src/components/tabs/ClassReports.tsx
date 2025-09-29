"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
  Download,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

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

export const BACKEND = import.meta.env.VITE_BACKEND;

export const months = [
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

export const classes = [
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

export const sections = [
  { value: "Red", label: "Red" },
  { value: "Blue", label: "Blue" },
  { value: "Pink", label: "Pink" },
  { value: "Green", label: "Green" },
  { value: "Yellow", label: "Yellow" },
  { value: "White", label: "White" },
];

export const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 3; i++) {
    const year = currentYear - i;
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};

export default function ClassReports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [reportFilters, setReportFilters] = useState({
    reportType: "all-students",
    class: "",
    section: "",
    month: "all",
    year: new Date().getFullYear().toString(),
  });

  const years = generateYears();

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

  return (
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
                <SelectItem value="class-all">Class (All Sections)</SelectItem>
                <SelectItem value="class-section">Class & Section</SelectItem>
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
                  {Math.min(endIndex, reportData.length)} of {reportData.length}{" "}
                  entries
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
                              currentPage === pageNumber ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className="w-8 h-8 p-0"
                            style={
                              currentPage === pageNumber
                                ? {
                                    backgroundColor: "rgba(17, 107, 251, 1)",
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
                      <p className="text-sm text-muted-foreground">Total Fee</p>
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
                        Rs. {getReportSummary().totalCollected.toLocaleString()}
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
                        Rs. {getReportSummary().totalRemaining.toLocaleString()}
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
  );
}
