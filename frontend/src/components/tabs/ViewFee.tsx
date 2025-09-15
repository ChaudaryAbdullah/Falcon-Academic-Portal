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

interface FeeChallan {
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
  month: string;
  year: string;
  tutionFee: number;
  examFee: number;
  miscFee: number;
  totalAmount: number;
  arrears: number;
  discount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
}

interface ViewRecordsTabProps {
  challans: FeeChallan[];
  setChallans: (challans: FeeChallan[]) => void;
  whatsappMessage: string;
}

export function ViewRecordsTab({
  challans,
  setChallans,
  whatsappMessage,
}: ViewRecordsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [whatsappFilter, setWhatsappFilter] = useState<string>("all");

  const sendFeeReminder = async (challan: FeeChallan) => {
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
      if (!dueDate) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        if (challan.month && challan.year) {
          try {
            const challanDate = new Date(`${challan.month} 1, ${challan.year}`);
            if (
              challanDate.getMonth() === currentMonth &&
              Number(challan.year) === currentYear
            ) {
              dueDate = `${currentYear}-${String(currentMonth + 1).padStart(
                2,
                "0"
              )}-10`;
            } else {
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);
              dueDate = tomorrow.toISOString().split("T")[0];
            }
          } catch (error) {
            console.error("Error parsing date:", error);
            dueDate = new Date().toISOString().split("T")[0];
          }
        } else {
          dueDate = new Date().toISOString().split("T")[0];
        }
      }

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
*Fee Reminder - Falcon House School*

Dear ${challan.studentId.fatherName || "Parent"},

This is a reminder for ${challan.studentId.studentName}'s fee:

Student Details:
• Name: ${challan.studentId.studentName}
• Roll Number: ${challan.studentId.rollNumber || "N/A"}

Fee Details:
• Month: ${challan.month} ${challan.year}
• Due Date: ${formattedDueDate}

Fee Breakdown:
• Tuition Fee: Rs. ${Number(challan.tutionFee) || 0}
• Exam Fee: Rs. ${Number(challan.examFee) || 0}
• Miscellaneous Fee: Rs. ${Number(challan.miscFee) || 0}
${challan.arrears > 0 ? `• Previous Arrears: Rs. ${challan.arrears}` : ""}
${challan.discount > 0 ? `• Discount: Rs. -${challan.discount}` : ""}

Total Amount: Rs. ${challan.totalAmount + challan.arrears}

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
        await axios.patch(
          `${BACKEND}/api/fees/${challan.id}/whatsapp`,
          { sentToWhatsApp: true },
          { withCredentials: true }
        );

        setChallans(((prevChallans: FeeChallan[]) =>
          prevChallans.map((c) =>
            c.id === challan.id ? { ...c, sentToWhatsApp: true } : c
          )) as unknown as FeeChallan[]);
      } catch (error) {
        console.error("Error updating WhatsApp status:", error);
      }
    } catch (error) {
      console.error("Error in sendFeeReminder:", error);
      toast.error("Error sending WhatsApp reminder. Please try again.");
    }
  };

  const downloadFeeChallanPDF = (challan: FeeChallan) => {
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Fee Challan - ${challan.studentId.studentName}</title>
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
            font-size: 13px; 
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
        
        .arrears { 
            color: #e74c3c; 
        }
        
        .discount { 
            color: #27ae60; 
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
    </style>
</head>
<body>
    <div class="header">
        <h1>FALCON House School</h1>
        <h2>Fee Challan</h2>
    </div>
    
    <div class="challan-info">
        <p><strong>Student Name:</strong> ${challan.studentId.studentName}</p>
        <p><strong>Father Name:</strong> ${challan.studentId.fatherName}</p>
        <p><strong>Roll Number:</strong> ${challan.studentId.rollNumber}</p>
        <p><strong>Class:</strong> ${challan.studentId.class} ${
      challan.studentId.section
    }</p>
        <p><strong>Month/Year:</strong> ${challan.month} ${challan.year}</p>
        <p><strong>Due Date:</strong> ${challan.dueDate}</p>
    </div>

    <table class="fee-details">
        <tr>
            <th>Fee Type</th>
            <th>Amount (Rs.)</th>
        </tr>
        <tr>
            <td>Tuition Fee</td>
            <td>${challan.tutionFee || 0}</td>
        </tr>
        <tr>
            <td>Exam Fee</td>
            <td>${challan.examFee || 0}</td>
        </tr>
        <tr>
            <td>Miscellaneous Fee</td>
            <td>${challan.miscFee || 0}</td>
        </tr>
        ${
          challan.arrears > 0
            ? `
        <tr class="arrears">
            <td><strong>Previous Arrears</strong></td>
            <td><strong>${challan.arrears}</strong></td>
        </tr>`
            : ""
        }
        ${
          challan.discount > 0
            ? `
        <tr class="discount">
            <td><strong>Discount</strong></td>
            <td><strong>${challan.discount}</strong></td>
        </tr>`
            : ""
        }
        <tr class="total">
            <td>Total Amount</td>
            <td>Rs. ${challan.totalAmount + challan.arrears}</td>
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
    link.download = `fee-challan-${challan.studentId.studentName}-${challan.month}-${challan.year}.html`;
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
      challan.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.studentId.rollNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      challan.studentId.class?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || challan.status === statusFilter;
    const matchesMonth = monthFilter === "all" || challan.month === monthFilter;
    const matchesYear = yearFilter === "all" || challan.year === yearFilter;
    const matchesWhatsApp =
      whatsappFilter === "all" ||
      (whatsappFilter === "sent" && challan.sentToWhatsApp) ||
      (whatsappFilter === "not_sent" && !challan.sentToWhatsApp);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMonth &&
      matchesYear &&
      matchesWhatsApp
    );
  });

  const uniqueMonths = Array.from(new Set(challans.map((c) => c.month)));
  const uniqueYears = Array.from(new Set(challans.map((c) => c.year)));

  const clearAllFilters = () => {
    setStatusFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setWhatsappFilter("all");
    setSearchTerm("");
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    monthFilter !== "all",
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

  // Add inside your component
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // change as needed

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Fee Records ({indexOfFirstItem + 1} -{" "}
          {indexOfLastItem > filteredChallans.length
            ? filteredChallans.length
            : indexOfLastItem}{" "}
          of {filteredChallans.length})
        </CardTitle>
        <CardDescription>
          View and manage all fee payment records with discounts and arrears
        </CardDescription>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, father name, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {uniqueMonths.sort().map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Year</Label>
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
                <TableHead>Month/Year</TableHead>
                <TableHead>Base Amount</TableHead>
                <TableHead>Arrears</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Due Date</TableHead>
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
                        <p>No fee records match your current filters</p>
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
                      "No fee records found"
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
                    <TableCell>{challan.studentId.rollNumber}</TableCell>
                    <TableCell>{challan.studentId.class}</TableCell>
                    <TableCell>
                      {challan.month} {challan.year}
                    </TableCell>
                    <TableCell>
                      Rs.{" "}
                      {(Number(challan.tutionFee) || 0) +
                        (Number(challan.examFee) || 0) +
                        (Number(challan.miscFee) || 0)}
                    </TableCell>
                    <TableCell>
                      {challan.arrears > 0 ? (
                        <span className="text-red-600 font-semibold">
                          +Rs. {challan.arrears}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {challan.discount > 0 ? (
                        <span className="text-green-600 font-semibold">
                          -Rs. {challan.discount}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      Rs. {challan.totalAmount + challan.arrears}
                    </TableCell>
                    <TableCell>{challan.dueDate}</TableCell>
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
                          onClick={() => sendFeeReminder(challan)}
                          className="bg-green-600 hover:bg-green-700"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadFeeChallanPDF(challan)}
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
          {filteredChallans.length > 0 && (
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
