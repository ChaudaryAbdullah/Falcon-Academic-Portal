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
  Calendar,
  Printer,
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
  gender: string;
  fPhoneNumber: string;
  mPhoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  class: string;
  email: string;
  password: string;
  address: string;
  img?: {
    data: string;
    contentType: string;
  };
}

interface ClassFeeStructure {
  className: string;
  paperFund: number;
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
  };
  year: string;
  paperFund: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
  paidDate?: string;
}

interface GenerateFeeTabProps {
  students: Student[];
  feeStructure: ClassFeeStructure[];
  challans: FeeChallan[];
  setChallans: (challans: FeeChallan[]) => void;
}

export function GeneratePaperFundTab({
  students,
  feeStructure,
  challans,
  setChallans,
}: GenerateFeeTabProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [generatingFor, setGeneratingFor] = useState<
    "all" | "class" | "individual"
  >("class");
  const [isGenerating, setIsGenerating] = useState(false);

  // Print functionality state
  const [printDate, setPrintDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [printClass, setPrintClass] = useState("");
  const [printSection, setPrintSection] = useState("");
  const [printClassDate, setPrintClassDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Set default due date to 10th of next month
  useState(() => {
    const currentDate = new Date();
    const defaultDueDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      10
    );
    setSelectedDueDate(defaultDueDate.toISOString().split("T")[0]);
  });

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student._id);
    setStudentSearch(
      `${student.studentName} - ${student.fatherName} (Roll: ${student.rollNumber})`
    );
    setShowStudentDropdown(false);
  };

  const handleSearchChange = (value: string) => {
    setStudentSearch(value);
    setSelectedStudent("");
    setShowStudentDropdown(value.length > 0);
  };

  // Generate Paper Fund Challans HTML for Printing (2 per page)
  // Replace the generateBulkPaperFundChallansHTML function with this updated version

  const generateBulkPaperFundChallansHTML = (challansArray: FeeChallan[]) => {
    // Group challans in sets of 4 for 4 per page (2x2 grid)
    const challanGroups = [];
    for (let i = 0; i < challansArray.length; i += 4) {
      challanGroups.push(challansArray.slice(i, i + 4));
    }

    const pages = challanGroups
      .map((group, pageIndex) => {
        const pageBreak =
          pageIndex < challanGroups.length - 1
            ? 'style="page-break-after: always;"'
            : "";

        const challansOnPage = group
          .map((challan) => {
            return `
            <div class="challan-container">
              <div class="header">
                <h1>FALCON House School</h1>
                <h2>Paper Fund Challan</h2>
              </div>

              <div class="challan-info">
                <p><strong>Student:</strong> ${
                  challan.studentId.studentName
                }</p>
                <p><strong>Father:</strong> ${challan.studentId.fatherName}</p>
                <p><strong>Reg No:</strong> ${challan.studentId.rollNumber}</p>
                <p><strong>Class:</strong> ${challan.studentId.class} ${
              challan.studentId.section
            }</p>
                <p><strong>Year:</strong> ${challan.year}</p>
                <p><strong>Due:</strong> ${new Date(
                  challan.dueDate
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}</p>
              </div>

              <table class="fee-details">
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
                <tr>
                  <td>Paper Fund</td>
                  <td>Rs. ${challan.paperFund || 0}</td>
                </tr>
                <tr class="total">
                  <td><strong>Total</strong></td>
                  <td><strong>Rs. ${challan.paperFund || 0}</strong></td>
                </tr>
              </table>

              <div class="footer">
                <p>Please pay before the due date.</p>
              </div>
            </div>
          `;
          })
          .join("");

        return `
        <div class="page" ${pageBreak}>
          <div class="slips-grid">
            ${challansOnPage}
          </div>
        </div>
      `;
      })
      .join("");

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Paper Fund Challans - Bulk Print</title>
        <style>
          @page { 
            size: A4 portrait; 
            margin: 8mm; 
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            font-size: 8px; 
          }
          
          .page {
            width: 100%;
            height: 277mm;
            page-break-after: always;
          }

          .page:last-child {
            page-break-after: auto;
          }
          
          .slips-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 0;
            width: 100%;
            height: 100%;
          }
          
          .challan-container {
            border: 1px dashed #999;
            padding: 3mm;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            page-break-inside: avoid;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 3px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 2px;
          }
          
          .header h1 {
            font-size: 11px;
            margin: 0 0 1px 0;
            font-weight: bold;
          }
          
          .header h2 {
            font-size: 9px;
            margin: 0;
            font-weight: normal;
            color: #555;
          }
          
          .challan-info { 
            margin: 3px 0; 
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px 8px;
            font-size: 7.5px;
            line-height: 1.3;
          }
          
          .challan-info p {
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .challan-info strong {
            font-weight: 600;
          }
          
          .fee-details { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 3px 0; 
            font-size: 7.5px;
          }
          
          .fee-details th, .fee-details td { 
            border: 1px solid #ddd; 
            padding: 2px 3px; 
            text-align: left; 
          }
          
          .fee-details th { 
            background-color: #f2f2f2; 
            font-weight: bold;
            font-size: 7.5px;
          }

          .fee-details td:last-child,
          .fee-details th:last-child {
            text-align: right;
          }
          
          .total { 
            font-weight: bold; 
            background-color: #f8f9fa;
            font-size: 8px;
          }
          
          .footer { 
            margin-top: auto;
            padding-top: 2px;
            text-align: center; 
            font-size: 6.5px; 
            border-top: 1px solid #eee;
            color: #666;
          }
          
          .footer p {
            margin: 1px 0;
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
              margin: 0;
              padding: 0;
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

  // Print today's paper fund challans
  const printTodaysChallans = () => {
    const today = new Date().toISOString().split("T")[0];
    const todaysChallans = challans.filter(
      (challan) => challan.generatedDate === today
    );

    if (todaysChallans.length === 0) {
      toast.error("No paper fund challans were generated today.");
      return;
    }

    const printContent = generateBulkPaperFundChallansHTML(todaysChallans);
    openPrintWindow(
      printContent,
      `Today's Paper Fund Challans (${todaysChallans.length})`
    );
  };

  // Print paper fund challans for specific date
  const printSpecificDateChallans = () => {
    if (!printDate) {
      toast.error("Please select a date.");
      return;
    }

    const dateChallans = challans.filter(
      (challan) => challan.generatedDate === printDate
    );

    if (dateChallans.length === 0) {
      toast.error(`No paper fund challans were generated on ${printDate}.`);
      return;
    }

    const printContent = generateBulkPaperFundChallansHTML(dateChallans);
    openPrintWindow(
      printContent,
      `Paper Fund Challans for ${printDate} (${dateChallans.length})`
    );
  };

  // Print paper fund challans for specific class (all sections)
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
        `No paper fund challans were generated on ${printClassDate} for class ${printClass}.`
      );
      return;
    }

    const printContent = generateBulkPaperFundChallansHTML(classChallans);
    openPrintWindow(
      printContent,
      `Class ${printClass} Paper Fund Challans - ${printClassDate} (${classChallans.length})`
    );
  };

  // Print paper fund challans for specific class and section
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
        `No paper fund challans were generated on ${printClassDate} for class ${printClass} section ${printSection}.`
      );
      return;
    }

    const printContent = generateBulkPaperFundChallansHTML(sectionChallans);
    openPrintWindow(
      printContent,
      `Class ${printClass}-${printSection} Paper Fund Challans - ${printClassDate} (${sectionChallans.length})`
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

  const generatePaperFundChallans = async (
    studentIds: string[],
    year: string,
    dueDate: string
  ) => {
    const challansToCreate: any[] = [];

    for (const studentId of studentIds) {
      const student = students.find((s) => s._id === studentId);
      if (!student) continue;

      const classFee = feeStructure?.find((f) => f.className === student.class);
      if (!classFee) {
        console.warn(`No fee structure found for class: ${student.class}`);
        continue;
      }

      // Check if challan already exists for this student and year
      const existingChallan = challans.find(
        (c) => c.studentId._id === studentId && c.year === year
      );
      if (existingChallan) {
        console.log(
          `Paper fund challan already exists for ${student.studentName} - ${year}`
        );
        continue;
      }

      const challanData = {
        studentId: studentId,
        year: year,
        paperFund: classFee.paperFund,
        dueDate: new Date(dueDate),
        status: "pending",
        generatedDate: new Date(),
        sentToWhatsApp: false,
      };

      challansToCreate.push(challanData);
    }

    return challansToCreate;
  };

  const handleGeneratePaperFund = async () => {
    if (!selectedYear) {
      toast.error("Please select a year");
      return;
    }

    if (!selectedDueDate) {
      toast.error("Please select a due date");
      return;
    }

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

    if (studentIds.length === 0) {
      toast.error("Please select students to generate paper fund challans for");
      return;
    }

    setIsGenerating(true);

    try {
      // Generate challans data
      const challansToCreate = await generatePaperFundChallans(
        studentIds,
        selectedYear,
        selectedDueDate
      );

      if (challansToCreate.length === 0) {
        toast.error(
          "No new paper fund challans to generate. All selected students already have challans for this year."
        );
        setIsGenerating(false);
        return;
      }

      // Send bulk create request to backend
      const response = await axios.post(
        `${BACKEND}/api/paperFund/generate-bulk`,
        { challans: challansToCreate },
        { withCredentials: true }
      );

      if (response.status === 200 || response.status === 201) {
        // Refresh the paper fund list to get the latest data
        const fetchResponse = await axios.get(`${BACKEND}/api/paperFund`, {
          withCredentials: true,
        });

        if (fetchResponse.data.success) {
          setChallans(fetchResponse.data.data);

          const successCount = response.data.data
            ? response.data.data.length
            : challansToCreate.length;
          toast.success(
            `Successfully generated ${successCount} paper fund challan(s)`
          );

          // Reset form
          setSelectedClass("");
          setSelectedStudent("");
          setStudentSearch("");
          setGeneratingFor("class");
        }
      } else {
        throw new Error("Failed to save paper fund challans to database");
      }
    } catch (error: any) {
      console.error("Error generating paper fund challans:", error);

      let errorMessage =
        "Failed to generate paper fund challans. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class).filter(Boolean))
  ).sort();

  // Get unique sections for selected print class
  const uniqueSections = Array.from(
    new Set(
      students
        .filter((s) => s.class === printClass)
        .map((s) => s.section)
        .filter(Boolean)
    )
  );

  // Helper function to format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get today's challans count
  const todaysChallansCount = challans.filter(
    (challan) =>
      challan.generatedDate === new Date().toISOString().split("T")[0]
  ).length;

  // Get specific date challans count
  const specificDateChallansCount = challans.filter(
    (challan) => challan.generatedDate === printDate
  ).length;

  // Get class challans count
  const classChallansCount = challans.filter(
    (challan) =>
      challan.studentId.class === printClass &&
      challan.generatedDate === printClassDate
  ).length;

  // Get section challans count
  const sectionChallansCount = challans.filter(
    (challan) =>
      challan.studentId.class === printClass &&
      challan.studentId.section === printSection &&
      challan.generatedDate === printClassDate
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Paper Fund Challans</CardTitle>
        <CardDescription>
          Generate paper fund challans for students with automatic fee
          calculation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="generateYear">Academic Year</Label>
              <Input
                id="generateYear"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                min="2020"
                max="2030"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dueDate"
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              {selectedDueDate && (
                <p className="text-sm text-muted-foreground">
                  Due: {formatDateForDisplay(selectedDueDate)}
                </p>
              )}
            </div>
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
                  placeholder="Type student name, roll number, or father name..."
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
                            Class: {student.class} | Roll: {student.rollNumber}{" "}
                            | Father: {student.fatherName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showStudentDropdown && filteredStudents.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                  No students found
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleGeneratePaperFund}
            className="w-full"
            disabled={
              isGenerating ||
              !selectedYear ||
              !selectedDueDate ||
              (generatingFor === "class" && !selectedClass) ||
              (generatingFor === "individual" && !selectedStudent)
            }
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Paper Fund Challans"}
          </Button>

          {/* Display summary info */}
          <div className="text-sm text-muted-foreground space-y-1 p-4 bg-gray-50 rounded-lg">
            <p>
              <strong>Students to process:</strong>{" "}
              {generatingFor === "all"
                ? students.length
                : generatingFor === "class" && selectedClass
                ? students.filter((s) => s.class === selectedClass).length
                : generatingFor === "individual" && selectedStudent
                ? 1
                : 0}
            </p>
            <p>
              <strong>Academic Year:</strong> {selectedYear}
            </p>
            {selectedDueDate && (
              <p>
                <strong>Payment Due Date:</strong>{" "}
                {formatDateForDisplay(selectedDueDate)}
              </p>
            )}
            {generatingFor === "class" && selectedClass && (
              <p>
                <strong>Target Class:</strong> {selectedClass}
              </p>
            )}
            {generatingFor === "individual" && selectedStudent && (
              <p>
                <strong>Selected Student:</strong>{" "}
                {studentSearch.split(" - ")[0]}
              </p>
            )}
          </div>

          {/* Print Paper Fund Challans Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Paper Fund Challans
            </h3>

            <div className="space-y-4">
              {/* Print All Today's Challans */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Today's Paper Fund Challans
                    </h4>
                    <p className="text-sm text-green-600">
                      Print all paper fund challans generated today (
                      {todaysChallansCount} challans)
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
                          className="pl-4 sm:pl-6 md:pl-8 lg:pl-10 border-blue-300 focus:border-blue-500"
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
                  <li>• Each page will contain 4 challans</li>
                  <li>
                    • Use A4 paper size with portrait orientation for best
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
                  Print Summary:
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
