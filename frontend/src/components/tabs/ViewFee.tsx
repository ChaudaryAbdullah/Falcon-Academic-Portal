"use client";
import axios from "axios";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Search,
  Download,
  MessageCircle,
  Filter,
  X,
  Printer,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "../../hooks/useDebounce";

const BACKEND = import.meta.env.VITE_BACKEND;

interface FeeChallan {
  id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    mPhoneNumber: string;
    class: string;
    section: string;
    discountCode: string;
  };
  month: string;
  year: string;
  tutionFee: number;
  examFee: number;
  miscFee: number;
  totalAmount: number;
  remainingBalance: number;
  arrears: number;
  discount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startRecord: number;
  endRecord: number;
}

interface FilterOptions {
  months: string[];
  years: string[];
  statuses: string[];
}

interface ViewRecordsTabProps {
  whatsappMessage: string;
}

export function ViewRecordsTab({ whatsappMessage }: ViewRecordsTabProps) {
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 50,
    hasNextPage: false,
    hasPrevPage: false,
    startRecord: 0,
    endRecord: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [whatsappFilter, setWhatsappFilter] = useState<string>("all");

  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    months: [],
    years: [],
    statuses: [],
  });

  // Debounced search
  const debouncedSearch = useDebouncedValue(searchTerm, 500);

  // Fetch filter options once
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`${BACKEND}/api/fees/filter-options`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch fees with pagination and filters
  const fetchFees = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        if (statusFilter && statusFilter !== "all") {
          params.append("status", statusFilter);
        }
        if (monthFilter && monthFilter !== "all") {
          params.append("month", monthFilter);
        }
        if (yearFilter && yearFilter !== "all") {
          params.append("year", yearFilter);
        }
        if (whatsappFilter && whatsappFilter !== "all") {
          params.append("whatsapp", whatsappFilter);
        }
        if (debouncedSearch.trim()) {
          params.append("search", debouncedSearch.trim());
        }

        const response = await axios.get(
          `${BACKEND}/api/fees?${params.toString()}`,
          { withCredentials: true },
        );

        if (response.data.success) {
          setChallans(response.data.data);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching fees:", error);
        toast.error("Failed to load fee records");
      } finally {
        setIsLoading(false);
      }
    },
    [
      pagination.limit,
      statusFilter,
      monthFilter,
      yearFilter,
      whatsappFilter,
      debouncedSearch,
    ],
  );

  // Fetch fees when filters change
  useEffect(() => {
    fetchFees(1); // Reset to page 1 when filters change
  }, [statusFilter, monthFilter, yearFilter, whatsappFilter, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchFees(newPage);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setWhatsappFilter("all");
    setSearchTerm("");
  };

  const activeFiltersCount = useMemo(() => {
    return [
      statusFilter !== "all",
      monthFilter !== "all",
      yearFilter !== "all",
      whatsappFilter !== "all",
      searchTerm.length > 0,
    ].filter(Boolean).length;
  }, [statusFilter, monthFilter, yearFilter, whatsappFilter, searchTerm]);

  const sendFeeReminder = async (challan: FeeChallan) => {
    try {
      if (!challan.studentId.mPhoneNumber) {
        toast.error(
          `Phone number not available for ${challan.studentId.studentName}`,
        );
        return;
      }

      let phoneNumber = challan.studentId.mPhoneNumber
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
          toast.error(`Invalid phone number format`);
          return;
        }
      }

      if (phoneNumber.length < 12 || phoneNumber.length > 13) {
        toast.error(`Invalid phone number length`);
        return;
      }

      let dueDate = challan.dueDate || new Date().toISOString().split("T")[0];
      let formattedDueDate = new Date(dueDate).toLocaleDateString("en-GB");

      const message =
        whatsappMessage ||
        `*Fee Reminder - Falcon House School*

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
      ? "This payment is overdue. Please pay as soon as possible."
      : "Please pay before the due date to avoid late fees."
}

Best regards,
Falcon House School Administration`.trim();

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      // Update WhatsApp status
      try {
        await axios.patch(
          `${BACKEND}/api/fees/${challan.id}/whatsapp`,
          { sentToWhatsApp: true },
          { withCredentials: true },
        );

        // Update local state
        setChallans((prev) =>
          prev.map((c) =>
            c.id === challan.id ? { ...c, sentToWhatsApp: true } : c,
          ),
        );
      } catch (error) {
        console.error("Error updating WhatsApp status:", error);
      }
    } catch (error) {
      console.error("Error sending WhatsApp reminder:", error);
      toast.error("Error sending WhatsApp reminder");
    }
  };

  const getChallanHTML = (challan: FeeChallan) => {
    // Helper function to get student image
    const getStudentImage = (studentId: any): string | null => {
      if (!studentId?.img?.data || !studentId?.img?.contentType) {
        return null;
      }

      const { data, contentType } = studentId.img;

      try {
        // Case 1: Already a base64 string
        if (typeof data === "string") {
          // Check if it already has the data URI prefix
          if (data.startsWith("data:")) {
            return data;
          }
          return `data:${contentType};base64,${data}`;
        }

        // Case 2: Buffer object with data array (common when sent from Node.js)
        if (data.type === "Buffer" && Array.isArray(data.data)) {
          const base64String = btoa(
            data.data.reduce(
              (acc: string, byte: number) => acc + String.fromCharCode(byte),
              "",
            ),
          );
          return `data:${contentType};base64,${base64String}`;
        }

        // Case 3: Uint8Array or regular array of bytes
        if (Array.isArray(data) || data instanceof Uint8Array) {
          const base64String = btoa(
            Array.from(data).reduce(
              (acc: string, byte: number) => acc + String.fromCharCode(byte),
              "",
            ),
          );
          return `data:${contentType};base64,${base64String}`;
        }

        // Case 4: ArrayBuffer
        if (data instanceof ArrayBuffer) {
          const base64String = btoa(
            new Uint8Array(data).reduce(
              (acc: string, byte: number) => acc + String.fromCharCode(byte),
              "",
            ),
          );
          return `data:${contentType};base64,${base64String}`;
        }

        console.warn("Unknown image data format:", typeof data, data);
        return null;
      } catch (error) {
        console.error("Error processing student image:", error);
        return null;
      }
    };

    const studentImage = getStudentImage(challan.studentId);

    return `
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
        
        .header-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }
        
        .school-logo {
            width: auto;
            height: 70px;
            object-fit: contain;
        }
        
        .logo-spacer {
            width: 70px;
        }
        
        .header-text {
            flex: 1;
            text-align: center;
        }
        
        .header h1 {
            font-size: 20px;
            margin: 0 0 3px 0;
        }
        
        .header h2 {
            font-size: 18px;
            margin: 0;
        }
        
        .info-section {
            display: flex;
            gap: 15px;
            margin: 15px 0;
            align-items: flex-start;
        }
        
        .student-photo {
            flex-shrink: 0;
        }
        
        .student-img {
            width: 70px;
            height: 85px;
            object-fit: cover;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .photo-placeholder {
            width: 70px;
            height: 85px;
            border: 2px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
            border-radius: 4px;
        }
        
        .photo-placeholder svg {
            width: 35px;
            height: 35px;
            color: #ccc;
        }
        
        .challan-info { 
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-gap: 8px 30px;
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
            font-size: 14px; 
            background-color: #f8f9fa;
        }
        
        .footer { 
            margin-top: 15px; 
            text-align: center; 
            font-size: 10px; 
            line-height: 1.3;
        }
        
        .footer p {
            margin: 3px 0;
        }
        
        .arrears { 
            color: #e74c3c; 
            font-weight: bold;
        }
        
        .discount { 
            color: #27ae60; 
            font-weight: bold;
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
        <div class="header-content">
            <img src="/results.jpeg" alt="Logo" class="school-logo" onerror="this.style.display='none'; this.nextElementSibling.style.flex='none';" />
            <div class="header-text">
                <h1>FALCON House School</h1>
                <h2>Fee Challan</h2>
            </div>
            <div class="logo-spacer"></div>
        </div>
    </div>
    
    <div class="info-section">
        <div class="student-photo">
            ${
              studentImage
                ? `<img src="${studentImage}" alt="Student Photo" class="student-img" />`
                : `<div class="photo-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                 </div>`
            }
        </div>
        <div class="challan-info">
            <p><strong>Student Name:</strong> ${
              challan.studentId.studentName
            }</p>
            <p><strong>Father Name:</strong> ${challan.studentId.fatherName}</p>
            <p><strong>Reg Number:</strong> ${challan.studentId.rollNumber}</p>
            <p><strong>Class:</strong> ${challan.studentId.class} ${
              challan.studentId.section
            }</p>
            <p><strong>Month/Year:</strong> ${challan.month} ${challan.year}</p>
            <p><strong>Due Date:</strong> ${challan.dueDate}</p>
            <p><strong>Challan code:</strong> ${
              challan.studentId.discountCode
                ? challan.studentId.discountCode
                : "*ADF*"
            }</p>
        </div>
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
        
        <tr class="total">
            <td>Total Amount</td>
            <td>Rs. ${
              challan.tutionFee +
              challan.examFee +
              challan.miscFee +
              challan.arrears
            }</td>
        </tr>
    </table>

    <div class="footer">
        <p>Please pay before the due date to avoid late fees.</p>
        <p>For queries, contact school administration.</p>
    </div>
</body>
</html>
    `;
  };

  const printFeeChallan = (challan: FeeChallan) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(getChallanHTML(challan));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const downloadFeeChallanPDF = (challan: FeeChallan) => {
    const pdfContent = getChallanHTML(challan);
    const blob = new Blob([pdfContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fee-challan-${challan.studentId.studentName}-${challan.month}-${challan.year}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Fee Records ({pagination.startRecord} - {pagination.endRecord} of{" "}
          {pagination.totalRecords})
        </CardTitle>
        <CardDescription>
          View and manage all fee payment records with pagination
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
                  {filterOptions.months.map((month) => (
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
                  {filterOptions.years.map((year) => (
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Father</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
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
                    challans.map((challan) => (
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
                        <TableCell className="font-semibold">
                          Rs. {challan.totalAmount}
                        </TableCell>
                        <TableCell>
                          {challan.remainingBalance > 0 ? (
                            <span className="text-orange-600 font-medium">
                              Rs. {challan.remainingBalance}
                            </span>
                          ) : (
                            <span className="text-green-600">Paid</span>
                          )}
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
                              onClick={() => printFeeChallan(challan)}
                              title="Print Challan"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFeeChallanPDF(challan)}
                              title="Download Challan"
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
            </div>

            {/* Pagination Controls */}
            {challans.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {pagination.startRecord} to {pagination.endRecord} of{" "}
                  {pagination.totalRecords} records
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage || isLoading}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Show page numbers */}
                    {Array.from(
                      {
                        length: Math.min(5, pagination.totalPages),
                      },
                      (_, i) => {
                        const pageNum =
                          Math.max(
                            1,
                            Math.min(
                              pagination.currentPage - 2,
                              pagination.totalPages - 4,
                            ),
                          ) + i;

                        if (pageNum > pagination.totalPages) return null;

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pageNum === pagination.currentPage
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                          >
                            {pageNum}
                          </Button>
                        );
                      },
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || isLoading}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
