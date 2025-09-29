"use client";

import { useState } from "react";
import { Button } from "../ui/button";
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
  Download,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Loader2,
  CalendarDays,
  Printer,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export default function DailyReports() {
  const [loading, setLoading] = useState(false);
  const [dailyReportData, setDailyReportData] =
    useState<DailyReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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

  const generatePDF = (action: "download" | "print") => {
    if (!dailyReportData || dailyReportData.students.length === 0) {
      toast.error("No data to export");
      return;
    }

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Fee Collection Report", 14, 20);

    // Add date
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const reportDate = new Date(dailyReportData.date).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    doc.text(`Date: ${reportDate}`, 14, 30);

    // Add summary information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 45);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total Collected: Rs. ${dailyReportData.totalCollected.toLocaleString()}`,
      14,
      55
    );
    doc.text(
      `Total Transactions: ${dailyReportData.totalTransactions}`,
      14,
      62
    );
    doc.text(
      `Average Payment: Rs. ${
        dailyReportData.totalTransactions > 0
          ? Math.round(
              dailyReportData.totalCollected / dailyReportData.totalTransactions
            ).toLocaleString()
          : 0
      }`,
      14,
      69
    );

    // Prepare table data
    const tableData = dailyReportData.students.map((student, index) => [
      (index + 1).toString(),
      new Date(student.paymentTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      student.rollNumber || "N/A",
      student.studentName || "N/A",
      `${student.class}-${student.section}`,
      `Rs. ${student.amount.toLocaleString()}`,
      student.challanId || "N/A",
    ]);

    // Add table
    autoTable(doc, {
      head: [
        [
          "S.No",
          "Time",
          "Roll No.",
          "Student Name",
          "Class-Sec",
          "Amount",
          "Challan ID",
        ],
      ],
      body: tableData,
      startY: 80,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 50 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 },
      },
      didDrawPage: function (data) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    // Add total at the end
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.line(14, finalY + 5, 196, finalY + 5);
    doc.text(
      `Total Amount Collected: Rs. ${dailyReportData.totalCollected.toLocaleString()}`,
      14,
      finalY + 12
    );
    doc.text(
      `Total Transactions: ${dailyReportData.totalTransactions}`,
      14,
      finalY + 19
    );

    // Add generation timestamp
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Report generated on: ${new Date().toLocaleString()}`,
      14,
      doc.internal.pageSize.height - 20
    );

    if (action === "download") {
      doc.save(`daily-fee-report-${selectedDate}.pdf`);
      toast.success("PDF report downloaded successfully");
    } else {
      try {
        const pdfData = doc.output("bloburl");
        const printWindow = window.open(pdfData as string);

        if (printWindow) {
          printWindow.onload = () => {
            try {
              printWindow.print();
              toast.success("Print dialog opened successfully");
            } catch (error) {
              console.error("Print error:", error);
              toast.error("Failed to open print dialog");
            }
          };
        } else {
          toast.error("Please allow popups to print the report");
        }
      } catch (error) {
        console.error("Print error:", error);
        toast.error("Failed to print report");
      }
    }
  };

  return (
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
              className="flex items-center bg-blue-600 hover:bg-blue-500 justify-center gap-2 w-full sm:w-auto"
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
              onClick={() => generatePDF("download")}
              className="flex items-center justify-center gap-2 bg-transparent w-full sm:w-auto"
              disabled={
                !dailyReportData || dailyReportData.students.length === 0
              }
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => generatePDF("print")}
              className="flex items-center justify-center gap-2 bg-transparent w-full sm:w-auto"
              disabled={
                !dailyReportData || dailyReportData.students.length === 0
              }
            >
              <Printer className="w-4 h-4" />
              Print Report
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
                        Rs. {dailyReportData.totalCollected.toLocaleString()}
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
                        {new Date(dailyReportData.date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
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
                              {new Date(student.paymentTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
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
            Select a date and click "Load Report" to view daily collections
          </div>
        )}
      </CardContent>
    </Card>
  );
}
