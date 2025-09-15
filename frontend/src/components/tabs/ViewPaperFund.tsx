"use client";
import axios from "axios";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Search, Download, MessageCircle, Filter, X } from "lucide-react";
import { toast } from "sonner";

const BACKEND = import.meta.env.VITE_BACKEND;

interface PaperFundChallan {
  id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    fPhoneNumber: string;
    class: string;
    section: string;
  };
  year: string;
  paperFund: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
  paidDate?: string;
}

interface ViewPaperFundRecordsTabProps {
  challans: PaperFundChallan[];
  setChallans: (challans: PaperFundChallan[]) => void;
  whatsappMessage: string;
}

export function ViewPaperFundRecordsTab({
  challans,
  setChallans,
  whatsappMessage,
}: ViewPaperFundRecordsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [whatsappFilter, setWhatsappFilter] = useState<string>("all");

  const sendPaperFundReminder = async (challan: PaperFundChallan) => {
    try {
      if (!challan.studentId.fPhoneNumber) {
        toast.error(
          `Phone number not available for ${challan.studentId.studentName}. Please update the student's phone number first.`
        );
        return;
      }

      let phoneNumber = challan.studentId.fPhoneNumber
        .toString()
        .replace(/[\s-]/g, "");

      phoneNumber = phoneNumber.replace(/[^\d+]/g, "");

      if (phoneNumber.startsWith("+92")) {
        phoneNumber = phoneNumber.substring(1);
      } else if (phoneNumber.startsWith("0")) {
        phoneNumber = "92" + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith("92")) {
        if (phoneNumber.startsWith("3")) {
          phoneNumber = "92" + phoneNumber;
        } else {
          toast.error(
            `Invalid phone number format for ${challan.studentId.studentName}: ${challan.studentId.fPhoneNumber}`
          );
          return;
        }
      }

      if (phoneNumber.length < 12 || phoneNumber.length > 13) {
        toast.error(
          `Invalid phone number length for ${challan.studentId.studentName}: ${challan.studentId.fPhoneNumber}`
        );
        return;
      }

      let dueDate = challan.dueDate;
      let formattedDueDate = dueDate;
      try {
        if (dueDate) {
          const dateObj = new Date(dueDate);
          formattedDueDate = dateObj.toLocaleDateString("en-GB");
        }
      } catch (error) {
        console.error("Error formatting due date:", error);
      }

      const message =
        whatsappMessage ||
        `
*Paper Fund Reminder - Falcon House School*

Dear ${challan.studentId.fatherName || "Parent"},

This is a reminder for ${challan.studentId.studentName}'s paper fund:

Student Details:
• Name: ${challan.studentId.studentName}
• Roll Number: ${challan.studentId.rollNumber || "N/A"}
• Class: ${challan.studentId.class || "N/A"}

Paper Fund Details:
• Academic Year: ${challan.year}
• Due Date: ${formattedDueDate}
• Amount: Rs. ${challan.paperFund}

${
  challan.status === "paid"
    ? "Thank you for your payment!"
    : challan.status === "overdue"
    ? "This payment is overdue. Please pay as soon as possible to avoid additional charges."
    : "Please pay before the due date to avoid late fees."
}

Best regards,
Falcon House School Administration
    `.trim();

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      window.open(whatsappUrl, "_blank");

      try {
        // Update the WhatsApp sent status (assuming similar endpoint exists)
        await axios.patch(
          `${BACKEND}/api/paperFund/${challan.id}/whatsapp`,
          { sentToWhatsApp: true },
          { withCredentials: true }
        );

        setChallans(((prevChallans: PaperFundChallan[]) =>
          prevChallans.map((c) =>
            c.id === challan.id ? { ...c, sentToWhatsApp: true } : c
          )) as unknown as PaperFundChallan[]);
      } catch (error) {
        console.error("Error updating WhatsApp status:", error);
        // Continue without blocking the process
      }
    } catch (error) {
      console.error("Error in sendPaperFundReminder:", error);
      toast.error("Error sending WhatsApp reminder. Please try again.");
    }
  };

  const downloadPaperFundChallanPDF = (challan: PaperFundChallan) => {
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Paper Fund Challan - ${challan.studentId.studentName}</title>
    <style>
        @page {
            size: 210mm 148.5mm; /* Half height of A4 (210mm x 148.5mm) */
            margin: 10mm; 
        }
        
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            width: 190mm; /* Content width allowing for margins */
            font-size: 12px; 
        }
        
        /* Force left alignment for print */
        @media print {
            html, body {
                margin: 0 !important;
                padding: 0 !important;
            }
            
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 15px; 
        }
        
        .header h1 {
            font-size: 20px;
            margin: 0 0 3px 0;
        }
        
        .header h2 {
            font-size: 18px;
            margin: 0;
        }
        
        .challan-info { 
            margin: 15px 0; 
            display: grid;
            grid-template-columns: 1fr 1fr; /* Two columns */
            grid-gap: 15px 30px; /* vertical and horizontal gap */
            font-size: 13px;
        }
        
        .challan-info p {
            margin: 1px 0;
        }
        
        .fee-details { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 15px 0; 
            font-size: 13px;
        }
        
        .fee-details th, .fee-details td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        
        .fee-details th { 
            background-color: #f2f2f2; 
            font-weight: bold;
        }
        
        .total { 
            font-weight: bold; 
            font-size: 12px; 
        }
        
        .footer { 
            margin-top: 15px; 
            text-align: center; 
            font-size: 10px; 
            line-height: 1;
        }
        
        .footer p {
            margin: 3px 0;
        }
        

    </style>
</head>
<body>
    <div class="header">
        <h1>FALCON House School</h1>
        <h2>Paper Fund Challan</h2>
    </div>
    
    <div class="challan-info">
        <p><strong>Student Name:</strong> ${challan.studentId.studentName}</p>
        <p><strong>Father Name:</strong> ${challan.studentId.fatherName}</p>
        <p><strong>Roll Number:</strong> ${challan.studentId.rollNumber}</p>
        <p><strong>Class:</strong> ${challan.studentId.class} ${
      challan.studentId.section
    }</p>
        <p><strong>Academic Year:</strong> ${challan.year}</p>
        <p><strong>Due Date:</strong> ${challan.dueDate}</p>
        ${
          challan.paidDate
            ? `<p><strong>Paid Date:</strong> ${challan.paidDate}</p>`
            : ""
        }
    </div>

    <table class="fee-details">
        <tr>
            <th>Fee Type</th>
            <th>Amount (Rs.)</th>
        </tr>
        <tr>
            <td>Paper Fund</td>
            <td>${challan.paperFund}</td>
        </tr>
        <tr class="total">
            <td>Total Amount</td>
            <td>Rs. ${challan.paperFund}</td>
        </tr>
    </table>

    <div class="footer">
        <p>Please pay before the due date to avoid late fees.</p>
        <p>For queries, contact school administration.</p>
    </div>
</body>
</html>
    `;

    const blob = new Blob([pdfContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `paper-fund-challan-${challan.studentId.studentName}-${challan.year}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Enhanced filtering logic
  const filteredChallans = challans.filter((challan) => {
    const matchesSearch =
      challan.studentId.studentName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      challan.studentId.fatherName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      challan.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.studentId.rollNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      challan.studentId.class?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || challan.status === statusFilter;
    const matchesYear = yearFilter === "all" || challan.year === yearFilter;
    const matchesWhatsApp =
      whatsappFilter === "all" ||
      (whatsappFilter === "sent" && challan.sentToWhatsApp) ||
      (whatsappFilter === "not_sent" && !challan.sentToWhatsApp);

    return matchesSearch && matchesStatus && matchesYear && matchesWhatsApp;
  });

  const uniqueYears = Array.from(new Set(challans.map((c) => c.year))).sort();

  const clearAllFilters = () => {
    setStatusFilter("all");
    setYearFilter("all");
    setWhatsappFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    yearFilter !== "all",
    whatsappFilter !== "all",
    searchTerm.length > 0,
  ].filter(Boolean).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  // Calculate paginated challans
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentChallans = filteredChallans.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredChallans.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Summary statistics - now based on filtered data
  const stats = {
    total: filteredChallans.length,
    paid: filteredChallans.filter((c) => c.status === "paid").length,
    pending: filteredChallans.filter((c) => c.status === "pending").length,
    overdue: filteredChallans.filter((c) => c.status === "overdue").length,
    totalAmount: filteredChallans.reduce((sum, c) => sum + c.paperFund, 0),
    paidAmount: filteredChallans
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.paperFund, 0),
    pendingAmount: filteredChallans
      .filter((c) => c.status !== "paid")
      .reduce((sum, c) => sum + c.paperFund, 0),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Paper Fund Records ({indexOfFirstItem + 1} -{" "}
          {indexOfLastItem > filteredChallans.length
            ? filteredChallans.length
            : indexOfLastItem}{" "}
          of {filteredChallans.length})
        </CardTitle>
        <CardDescription>
          View and manage all paper fund payment records
          {yearFilter !== "all" && (
            <span className="ml-2 text-blue-600 font-medium">
              (Showing data for {yearFilter})
            </span>
          )}
        </CardDescription>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.paid}
            </div>
            <div className="text-sm text-gray-600">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-800">
              Rs. {stats.totalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600">Total Amount</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-800">
              Rs. {stats.paidAmount.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">Paid Amount</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-800">
              Rs. {stats.pendingAmount.toLocaleString()}
            </div>
            <div className="text-sm text-orange-600">Pending Amount</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, father name, or roll number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Academic Year
              </Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears
                    .sort()
                    .reverse()
                    .map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">WhatsApp</Label>
              <Select value={whatsappFilter} onValueChange={setWhatsappFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="not_sent">Not Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Father</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Paper Fund</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Generated Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChallans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center text-muted-foreground py-8"
                  >
                    {activeFiltersCount > 0 || searchTerm ? (
                      <div className="space-y-2">
                        <p>No paper fund records match your current filters</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Clear filters to see all records
                        </Button>
                      </div>
                    ) : (
                      "No paper fund records found"
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                currentChallans.map((challan) => (
                  <TableRow key={challan.id}>
                    <TableCell className="font-medium">
                      {challan.studentId.studentName}
                    </TableCell>
                    <TableCell>{challan.studentId.fatherName}</TableCell>
                    <TableCell>
                      {challan.studentId.rollNumber || "N/A"}
                    </TableCell>
                    <TableCell>{challan.studentId.class || "N/A"}</TableCell>
                    <TableCell>{challan.year}</TableCell>
                    <TableCell className="font-semibold">
                      Rs. {challan.paperFund.toLocaleString()}
                    </TableCell>
                    <TableCell>{challan.dueDate || "N/A"}</TableCell>
                    <TableCell>{challan.generatedDate || "N/A"}</TableCell>
                    <TableCell>
                      {challan.paidDate ? (
                        challan.paidDate
                      ) : (
                        <span className="text-gray-400">Not paid</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(challan.status)}</TableCell>
                    <TableCell>
                      {challan.sentToWhatsApp ? (
                        <Badge className="bg-green-100 text-green-800">
                          Sent
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          Not Sent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => sendPaperFundReminder(challan)}
                          className="bg-green-600 hover:bg-green-700"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPaperFundChallanPDF(challan)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredChallans.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>

              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
