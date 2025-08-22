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
import { Search, FileText, User } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND;

interface Student {
  _id: string;
  studentName: string;
  fatherName: string;
  fatherCnic: string;
  bform: string;
  dateOfBirth: string;
  fPhoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  rollNumber: string;
  class: string;
}

interface ClassFeeStructure {
  className: string;
  tutionFee: number;
  paperFund: number;
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
    fPhoneNumber: string;
    class: string;
  };
  month: string;
  year: string;
  tutionFee: number;
  paperFund: number;
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
          totalArrears += challan.totalAmount;
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

      const baseFees =
        classFee.tutionFee +
        classFee.paperFund +
        classFee.examFee +
        classFee.miscFee;
      const totalAmount = Math.max(0, baseFees + arrears - discount);

      const newChallan: FeeChallan = {
        id: `${studentId}-${month}-${year}`,
        studentId: {
          _id: student._id,
          rollNumber: student.rollNumber,
          studentName: student.studentName,
          fatherName: student.fatherName,
          fPhoneNumber: student.fPhoneNumber,
          class: student.class,
        },
        month,
        year,
        tutionFee: classFee.tutionFee,
        paperFund: classFee.paperFund,
        examFee: classFee.examFee,
        miscFee: classFee.miscFee,
        arrears: arrears,
        discount: discount,
        totalAmount: totalAmount,
        dueDate,
        status: "pending",
        generatedDate: new Date().toISOString().split("T")[0],
        sentToWhatsApp: false,
      };

      newChallans.push(newChallan);
    });

    if (newChallans.length === 0) {
      alert(
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

        alert(
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
      alert("Failed to generate fee challans. Please try again.");
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
        </div>
      </CardContent>
    </Card>
  );
}
