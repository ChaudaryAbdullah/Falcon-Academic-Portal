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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Search,
  FileText,
  User,
  Printer,
  Calendar,
  GraduationCap,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND = import.meta.env.VITE_BACKEND;

interface Student {
  _id: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  fatherCnic: string;
  motherCnic: string;
  bform: string;
  dob: string;
  section: string;
  fPhoneNumber: string;
  gender: string;
  mPhoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  class: string;
  email: string;
  password: string;
  address: string;
  discountCode?: string;
  img?: {
    data: string;
    contentType: string;
  };
}

interface ClassFeeStructure {
  className: string;
  tutionFee: number;
  examFee: number;
  miscFee: number;
}

interface StudentDiscount {
  _id: string;
  studentId: {
    _id: string;
    studentName: string;
    rollNumber: string;
  };
  discount: number;
}

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
    discountCode?: string;
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

interface GenerateFeeTabProps {
  students: Student[];
  feeStructure: ClassFeeStructure[];
  studentDiscounts: StudentDiscount[];
  challans: FeeChallan[];
  setChallans: (challans: FeeChallan[]) => void;
}

export function GenerateFeeTab({
  students,
  feeStructure,
  studentDiscounts,
  challans,
  setChallans,
}: GenerateFeeTabProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [generatingFor, setGeneratingFor] = useState<
    "all" | "class" | "individual"
  >("class");

  // New state for print functionality
  const [printDate, setPrintDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [printClass, setPrintClass] = useState("");
  const [printSection, setPrintSection] = useState("");
  const [printClassDate, setPrintClassDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Calculate arrears for a student
  const calculateArrears = (
    studentId: string,
    currentMonth: string,
    currentYear: string
  ): number => {
    const months = [
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

    const currentMonthIndex = months.indexOf(currentMonth);
    const currentYearNum = parseInt(currentYear);

    let totalArrears = 0;

    // Find unpaid fees before current month/year
    challans.forEach((challan) => {
      if (
        challan.studentId._id === studentId &&
        (challan.status === "pending" || challan.status === "overdue")
      ) {
        const challanYear = parseInt(challan.year);
        const challanMonthIndex = months.indexOf(challan.month);

        // Check if this challan is from before the current month/year
        if (
          challanYear < currentYearNum ||
          (challanYear === currentYearNum &&
            challanMonthIndex < currentMonthIndex)
        ) {
          totalArrears += challan.remainingBalance;
        }
      }
    });

    return totalArrears;
  };

  // Get student discount
  const getStudentDiscount = (studentId: string): number => {
    const discountRecord = studentDiscounts.find(
      (d) => d.studentId._id === studentId
    );
    return discountRecord ? discountRecord.discount : 0;
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student._id);
    setStudentSearch(
      `${student.studentName} - ${student.fatherName} (ID: ${student._id})`
    );
    setShowStudentDropdown(false);
  };

  const handleSearchChange = (value: string) => {
    setStudentSearch(value);
    setSelectedStudent("");
    setShowStudentDropdown(value.length > 0);
  };

  // Generate multiple challans HTML for bulk printing
  const generateBulkChallansHTML = (challansArray: FeeChallan[]) => {
    // Group challans in pairs for 2 per page
    const challanPairs = [];
    for (let i = 0; i < challansArray.length; i += 2) {
      challanPairs.push(challansArray.slice(i, i + 2));
    }

    const pages = challanPairs
      .map((pair, pageIndex) => {
        const pageBreak =
          pageIndex < challanPairs.length - 1
            ? 'style="page-break-after: always;"'
            : "";

        const challansOnPage = pair
          .map((challan) => {
            return `
<div class="challan-container">
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
            <td><strong>-${challan.studentId.discountCode}</strong></td>
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
</div>
        `;
          })
          .join("");

        return `
<div class="page" ${pageBreak}>
    ${challansOnPage}
</div>
    `;
      })
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Fee Challans - Bulk Print</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm; 
        }
        
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            font-size: 10px; 
        }
        
        .page {
            width: 100%;
            min-height: 281mm; /* A4 height minus margins */
            display: flex;
            flex-direction: column;
        }
        
        .challan-container {
            width: 100%;
            height: 140mm; /* Exactly half of A4 height */
            border: 1px dashed #999;
            padding: 4mm;
            box-sizing: border-box;
            flex: 0 0 140mm; /* Fixed height, no grow/shrink */
            overflow: hidden;
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 6px; 
        }
        
        .header h1 {
            font-size: 14px;
            margin: 0 0 2px 0;
            font-weight: bold;
        }
        
        .header h2 {
            font-size: 12px;
            margin: 0;
            font-weight: normal;
        }
        
        .challan-info { 
            margin: 6px 0; 
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-gap: 4px 15px;
            font-size: 10px;
        }
        
        .challan-info p {
            margin: 1px 0;
            line-height: 1.1;
        }
        
        .fee-details { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 6px 0; 
            font-size: 9px;
        }
        
        .fee-details th, .fee-details td { 
            border: 1px solid #ddd; 
            padding: 3px 4px; 
            text-align: left; 
            line-height: 1;
        }
        
        .fee-details th { 
            background-color: #f2f2f2; 
            font-weight: bold;
            font-size: 9px;
        }
        
        .total { 
            font-weight: bold; 
            font-size: 9px; 
            background-color: #f8f9fa;
        }
        
        .footer { 
            margin-top: 6px; 
            text-align: center; 
            font-size: 7px; 
            line-height: 1;
        }
        
        .footer p {
            margin: 1px 0;
        }
        
        .arrears { 
            color: #e74c3c; 
            font-weight: bold;
        }
        
        .discount { 
            color: #27ae60; 
            font-weight: bold;
        }
        
        @media print {
            html, body {
                margin: 0 !important;
                padding: 0 !important;
            }
            
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .page {
                page-break-after: always;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            .challan-container {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    ${pages}
</body>
</html>
`;
  };

  // Print challans generated today
  const printTodaysChallans = () => {
    const today = new Date().toISOString().split("T")[0];
    const todaysChallans = challans.filter(
      (challan) => challan.generatedDate === today
    );

    if (todaysChallans.length === 0) {
      toast.error("No challans were generated today.");
      return;
    }

    const printContent = generateBulkChallansHTML(todaysChallans);
    openPrintWindow(
      printContent,
      `Today's Challans (${todaysChallans.length})`
    );
  };

  // Print challans generated on specific date
  const printSpecificDateChallans = () => {
    if (!printDate) {
      toast.error("Please select a date.");
      return;
    }

    const dateChallans = challans.filter(
      (challan) => challan.generatedDate === printDate
    );

    if (dateChallans.length === 0) {
      toast.error(`No challans were generated on ${printDate}.`);
      return;
    }

    const printContent = generateBulkChallansHTML(dateChallans);
    openPrintWindow(
      printContent,
      `Challans for ${printDate} (${dateChallans.length})`
    );
  };

  // Print challans for specific class (all sections)
  const printClassChallans = () => {
    if (!printClass || !printClassDate) {
      toast.error("Please select a class and date.");
      return;
    }

    const classChallans = challans.filter(
      (challan) =>
        challan.studentId.class === printClass &&
        challan.generatedDate === printClassDate
    );

    if (classChallans.length === 0) {
      toast.error(
        `No challans were generated on ${printClassDate} for class ${printClass}.`
      );
      return;
    }

    const printContent = generateBulkChallansHTML(classChallans);
    openPrintWindow(
      printContent,
      `Class ${printClass} Challans - ${printClassDate} (${classChallans.length})`
    );
  };

  // Print challans for specific class and section
  const printSectionChallans = () => {
    if (!printClass || !printSection || !printClassDate) {
      toast.error("Please select class, section, and date.");
      return;
    }

    const sectionChallans = challans.filter(
      (challan) =>
        challan.studentId.class === printClass &&
        challan.studentId.section === printSection &&
        challan.generatedDate === printClassDate
    );

    if (sectionChallans.length === 0) {
      toast.error(
        `No challans were generated on ${printClassDate} for class ${printClass} section ${printSection}.`
      );
      return;
    }

    const printContent = generateBulkChallansHTML(sectionChallans);
    openPrintWindow(
      printContent,
      `Class ${printClass}-${printSection} Challans - ${printClassDate} (${sectionChallans.length})`
    );
  };

  // Helper function to open print window
  const openPrintWindow = (content: string, title: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.document.title = title;

      printWindow.onload = function () {
        printWindow.print();
        printWindow.onafterprint = function () {
          printWindow.close();
        };
      };

      toast.success(`Opening print dialog for ${title.toLowerCase()}`);
    } else {
      toast.error(
        "Unable to open print window. Please check your browser settings."
      );
    }
  };

  const generateFeeChallan = async (
    studentIds: string[],
    month: string,
    year: string
  ) => {
    const newChallans: FeeChallan[] = [];

    studentIds.forEach((studentId) => {
      const student = students.find((s) => s._id === studentId);
      if (!student) return;

      const classFee = feeStructure?.find((f) => f.className === student.class);
      if (!classFee) return;

      // Check if challan already exists for this student, month, and year
      const existingChallan = challans.find(
        (c) =>
          c.studentId._id === studentId && c.month === month && c.year === year
      );
      if (existingChallan) {
        console.log(
          `Challan already exists for ${student.studentName} - ${month} ${year}`
        );
        return;
      }

      // Calculate arrears for this student
      const arrears = calculateArrears(studentId, month, year);

      // Get student discount
      const discount = getStudentDiscount(studentId);

      // Set due date to 10th of the month
      const dueDate = `${year}-${String(
        new Date(`${month} 1, ${year}`).getMonth() + 1
      ).padStart(2, "0")}-10`;

      const baseFees = classFee.tutionFee + classFee.examFee + classFee.miscFee;
      const totalAmount = Math.max(0, baseFees + arrears - discount);

      const newChallan: FeeChallan = {
        id: `${studentId}-${month}-${year}`,
        studentId: {
          _id: student._id,
          rollNumber: student.rollNumber,
          studentName: student.studentName,
          fatherName: student.fatherName,
          mPhoneNumber: student.mPhoneNumber,
          class: student.class,
          section: student.section,
        },
        month,
        year,
        tutionFee: classFee.tutionFee,
        examFee: classFee.examFee,
        miscFee: classFee.miscFee,
        arrears: arrears,
        discount: discount,
        remainingBalance: totalAmount,
        totalAmount: totalAmount,
        dueDate,
        status: "pending",
        generatedDate: new Date().toISOString().split("T")[0],
        sentToWhatsApp: false,
      };

      newChallans.push(newChallan);
    });

    if (newChallans.length === 0) {
      toast.error(
        "No new challans to generate. All selected students already have challans for this month/year."
      );
      return [];
    }

    try {
      // Save to database
      const response = await axios.post(
        `${BACKEND}/api/fees/generate-bulk`,
        { challans: newChallans },
        { withCredentials: true }
      );

      if (response.status === 200 || response.status === 201) {
        // Refresh the fees list to get the latest data
        const fetchResponse = await axios.get(`${BACKEND}/api/fees`, {
          withCredentials: true,
        });
        setChallans(fetchResponse.data.data);

        toast.success(
          `Successfully generated ${response.data.data.length} fee challan(s)`
        );

        if (response.data.errors && response.data.errors.length > 0) {
          console.warn("Some challans had errors:", response.data.errors);
        }

        return response.data.data;
      } else {
        throw new Error("Failed to save challans to database");
      }
    } catch (error) {
      console.error("Error generating fee challans:", error);
      toast.error("Failed to generate fee challans. Please try again.");
      return [];
    }
  };

  const handleGenerateFees = async () => {
    if (!selectedMonth || !selectedYear) return;

    let studentIds: string[] = [];

    if (generatingFor === "all") {
      studentIds = students.map((s) => s._id);
    } else if (generatingFor === "class" && selectedClass) {
      studentIds = students
        .filter((s) => s.class === selectedClass)
        .map((s) => s._id);
    } else if (generatingFor === "individual" && selectedStudent) {
      studentIds = [selectedStudent];
    }

    if (studentIds.length === 0) return;

    await generateFeeChallan(studentIds, selectedMonth, selectedYear);

    // Reset form
    setSelectedClass("");
    setSelectedStudent("");
    setStudentSearch("");
    setSelectedMonth("");
    setGeneratingFor("class");
  };

  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class).filter(Boolean))
  );

  // Get unique sections for selected print class
  const uniqueSections = Array.from(
    new Set(
      students
        .filter((s) => s.class === printClass)
        .map((s) => s.section)
        .filter(Boolean)
    )
  );

  // Get today's challans count
  const todaysChallansCount = challans.filter(
    (challan) =>
      challan.generatedDate === new Date().toISOString().split("T")[0]
  ).length;

  // Get specific date challans count
  const specificDateChallansCount = challans.filter(
    (challan) => challan.generatedDate === printDate
  ).length;

  // Get class challans count (today only)
  const classChallansCount = challans.filter(
    (challan) =>
      challan.studentId.class === printClass &&
      challan.generatedDate === printClassDate
  ).length;

  // Get section challans count (today only)
  const sectionChallansCount = challans.filter(
    (challan) =>
      challan.studentId.class === printClass &&
      challan.studentId.section === printSection &&
      challan.generatedDate === printClassDate
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Fee Challans</CardTitle>
        <CardDescription>
          Generate fee challans with automatic discount and arrears calculation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="generateMonth">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {[
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
                  ].map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="generateYear">Year</Label>
              <Input
                id="generateYear"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Generate For</Label>
              <Select
                value={generatingFor}
                onValueChange={(value: "all" | "class" | "individual") =>
                  setGeneratingFor(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="class">Specific Class</SelectItem>
                  <SelectItem value="individual">Individual Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {generatingFor === "class" && (
            <div className="space-y-2">
              <Label htmlFor="selectClass">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {generatingFor === "individual" && (
            <div className="space-y-2 relative">
              <Label htmlFor="generateStudent">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="generateStudent"
                  placeholder="Type student name or ID..."
                  value={studentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() =>
                    setShowStudentDropdown(studentSearch.length > 0)
                  }
                  className="pl-10"
                />
              </div>
              {showStudentDropdown && filteredStudents.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredStudents.slice(0, 10).map((student) => (
                    <div
                      key={student._id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleStudentSelect(student)}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-sm">
                            {student.studentName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Class: {student.class} | Father:{" "}
                            {student.fatherName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              Automatic Calculations:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>Discounts:</strong> Individual student discounts will
                be automatically applied
              </li>
              <li>
                • <strong>Arrears:</strong> Any unpaid fees from previous months
                will be added automatically
              </li>
              <li>
                • <strong>Total Amount:</strong> Base fees + Arrears - Discount
              </li>
            </ul>
          </div>

          <Button
            onClick={handleGenerateFees}
            className="w-full"
            disabled={
              !selectedMonth ||
              !selectedYear ||
              (generatingFor === "class" && !selectedClass) ||
              (generatingFor === "individual" && !selectedStudent)
            }
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Fee Challans
          </Button>

          {/* Print Challans Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Challans (Today's Generated Only)
            </h3>

            <div className="space-y-4">
              {/* Print All Today's Challans */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Today's Challans
                    </h4>
                    <p className="text-sm text-green-600">
                      Print all challans generated today ({todaysChallansCount}{" "}
                      challans)
                    </p>
                  </div>
                  <Button
                    onClick={printTodaysChallans}
                    variant="outline"
                    className="bg-green-100 hover:bg-green-200 border-green-300 text-green-700"
                    disabled={todaysChallansCount === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print All Today's
                  </Button>
                </div>
              </div>
              {/* Print by Class (All Sections) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Print by Class (All Sections)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <Label
                        htmlFor="printClass"
                        className="text-sm text-blue-700"
                      >
                        Select Class
                      </Label>
                      <Select value={printClass} onValueChange={setPrintClass}>
                        <SelectTrigger className="border-blue-300 focus:border-blue-500">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueClasses.map((className) => (
                            <SelectItem key={className} value={className}>
                              {className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor="printClassDate"
                        className="text-sm text-blue-700"
                      >
                        Select Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-blue-400 hidden sm:block" />
                        <Input
                          id="printClassDate"
                          type="date"
                          value={printClassDate}
                          onChange={(e) => setPrintClassDate(e.target.value)}
                          className="pl-4 sm:pl-6 md:pl-8 lg:pl-10  border-blue-300 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button
                        onClick={printClassChallans}
                        variant="outline"
                        className="bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700"
                        disabled={
                          !printClass ||
                          !printClassDate ||
                          classChallansCount === 0
                        }
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Class
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    {classChallansCount} challans found for class{" "}
                    {printClass || "..."} on {printClassDate}
                  </p>
                </div>
              </div>
              {/* Print by Class and Section */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-orange-800 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Print by Class & Section
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <Label
                        htmlFor="printClassSection"
                        className="text-sm text-orange-700"
                      >
                        Select Class
                      </Label>
                      <Select
                        value={printClass}
                        onValueChange={(value) => {
                          setPrintClass(value);
                          setPrintSection("");
                        }}
                      >
                        <SelectTrigger className="border-orange-300 focus:border-orange-500">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueClasses.map((className) => (
                            <SelectItem key={className} value={className}>
                              {className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor="printSectionSelect"
                        className="text-sm text-orange-700"
                      >
                        Select Section
                      </Label>
                      <Select
                        value={printSection}
                        onValueChange={setPrintSection}
                        disabled={!printClass}
                      >
                        <SelectTrigger className="border-orange-300 focus:border-orange-500">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueSections.map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor="printSectionDate"
                        className="text-sm text-orange-700"
                      >
                        Select Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-orange-400 hidden sm:block" />
                        <Input
                          id="printSectionDate"
                          type="date"
                          value={printClassDate}
                          onChange={(e) => setPrintClassDate(e.target.value)}
                          className="pl-4 sm:pl-6 md:pl-8 lg:pl-10 border-orange-300 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button
                        onClick={printSectionChallans}
                        variant="outline"
                        className="bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700"
                        disabled={
                          !printClass ||
                          !printSection ||
                          !printClassDate ||
                          sectionChallansCount === 0
                        }
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Section
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-orange-600">
                    {sectionChallansCount} challans found for{" "}
                    {printClass || "..."}-{printSection || "..."} on{" "}
                    {printClassDate}
                  </p>
                </div>
              </div>
              {/* Print Specific Date Challans */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-purple-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Print by Date
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                      <Label
                        htmlFor="printDate"
                        className="text-sm text-purple-700"
                      >
                        Select Date
                      </Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-purple-400 hidden sm:block" />
                        <Input
                          id="printDate"
                          type="date"
                          value={printDate}
                          onChange={(e) => setPrintDate(e.target.value)}
                          className="pl-4 sm:pl-6 md:pl-8 lg:pl-10 border-purple-300 focus:border-purple-500"
                        />
                      </div>
                      <p className="text-xs text-purple-600 mt-1">
                        {specificDateChallansCount} challans found for selected
                        date
                      </p>
                    </div>
                    <Button
                      onClick={printSpecificDateChallans}
                      variant="outline"
                      className="bg-purple-100 mb-5 hover:bg-purple-200 border-purple-300 text-purple-700"
                      disabled={specificDateChallansCount === 0}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Date Challans
                    </Button>
                  </div>
                </div>
              </div>
              {/* Print Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Print Instructions:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Each challan will be printed on a separate page</li>
                  <li>
                    • Use A4 paper size with landscape orientation for best
                    results
                  </li>
                  <li>
                    • Ensure your printer has sufficient paper for bulk printing
                  </li>
                  <li>• Check print preview before printing large batches</li>

                  <li>
                    • <strong>Note:</strong> Class and section printing works
                    for any selected date
                  </li>
                </ul>
              </div>
              {/* Print Summary */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Today's Print Summary:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-gray-700">Total Today</div>
                    <div className="text-lg font-bold text-green-600">
                      {todaysChallansCount}
                    </div>
                  </div>
                  {printClass && (
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        Class {printClass}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {classChallansCount}
                      </div>
                    </div>
                  )}
                  {printClass && printSection && (
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        {printClass}-{printSection}
                      </div>
                      <div className="text-lg font-bold text-orange-600">
                        {sectionChallansCount}
                      </div>
                    </div>
                  )}
                  {printDate && (
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        {printDate}
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {specificDateChallansCount}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
