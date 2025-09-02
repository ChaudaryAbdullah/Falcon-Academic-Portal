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
import { Search, FileText, User, Calendar } from "lucide-react";

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
      alert("Please select a year");
      return;
    }

    if (!selectedDueDate) {
      alert("Please select a due date");
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
      alert("Please select students to generate paper fund challans for");
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
        alert(
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
          alert(`Successfully generated ${successCount} paper fund challan(s)`);

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

      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class).filter(Boolean))
  ).sort();

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
                  min={new Date().toISOString().split("T")[0]} // Prevent selecting past dates
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
        </div>
      </CardContent>
    </Card>
  );
}
