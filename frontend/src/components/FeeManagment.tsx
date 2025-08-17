"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Receipt,
  Search,
  Download,
  MessageCircle,
  User,
  FileText,
  AlertTriangle,
  Filter,
  X,
} from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";

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
  class?: string; // Add class information
}

interface ClassFeeStructure {
  className: string;
  tutionFee: number;
  paperFund: number;
  examFee: number;
  miscFee: number;
}

interface FeeChallan {
  id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    fPhoneNumber: string;
  };
  month: string;
  year: string;
  tutionFee: number;
  paperFund: number;
  examFee: number;
  miscFee: number;
  totalAmount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
}

interface FeeManagementProps {
  students: Student[];
}

export function FeeManagement({ students }: FeeManagementProps) {
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [feeData, setFeeData] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    tutionFee: 0,
    paperFund: 0,
    examFee: 0,
    miscFee: 0,
    dueDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [feeStructure, setFeeStructure] = useState<ClassFeeStructure[]>();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [generatingFor, setGeneratingFor] = useState<
    "all" | "class" | "individual"
  >("class");
  const [pendingFees, setPendingFees] = useState<FeeChallan[]>([]);
  const [selectedPendingFees, setSelectedPendingFees] = useState<string[]>([]);
  const [lateFees, setLateFees] = useState<{ [key: string]: number }>({});
  const [showLateFeeInput, setShowLateFeeInput] = useState(false);

  // New filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [whatsappFilter, setWhatsappFilter] = useState<string>("all");

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  useEffect(() => {
    const fetchFeeStructure = async () => {
      const res = await axios.get(`${BACKEND}/api/fee-structures`, {
        withCredentials: true,
      });
      console.log(res.data);
      setFeeStructure(res.data);
      console.log(feeStructure);
    };
    fetchFeeStructure();
  }, []);

  useEffect(() => {
    const fetchFee = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/fees`, {
          withCredentials: true,
        });
        console.log(res.data.data);

        // Update overdue statuses locally first
        const updatedChallans = updateOverdueStatuses(res.data.data);
        setChallans(updatedChallans);

        // Then sync with backend if any changes were made
        syncOverdueStatusesWithBackend(updatedChallans);
      } catch (error) {
        console.error("Error fetching fees:", error);
      }
    };
    fetchFee();
  }, []);

  // Function to check and update overdue statuses
  const updateOverdueStatuses = (challansData: FeeChallan[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    return challansData.map((challan) => {
      // Only update if currently pending and has a due date
      if (challan.status === "pending" && challan.dueDate) {
        const dueDate = new Date(challan.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // If due date has passed, mark as overdue
        if (dueDate < today) {
          return {
            ...challan,
            status: "overdue" as const,
          };
        }
      }
      return challan;
    });
  };

  // Function to sync overdue statuses with backend
  const syncOverdueStatusesWithBackend = async (
    updatedChallans: FeeChallan[]
  ) => {
    try {
      // Find challans that were updated to overdue
      const overdueChallans = updatedChallans.filter((challan, index) => {
        const originalChallan = challans[index];
        return (
          originalChallan &&
          originalChallan.status === "pending" &&
          challan.status === "overdue"
        );
      });

      if (overdueChallans.length > 0) {
        console.log(
          `Updating ${overdueChallans.length} challans to overdue status`
        );

        // Update backend with overdue statuses
        const feeIdsToUpdate = overdueChallans.map((c) => c.id);

        await axios.patch(
          `${BACKEND}/api/fees/bulk-update`,
          {
            feeIds: feeIdsToUpdate,
            status: "overdue",
          },
          { withCredentials: true }
        );

        console.log("Successfully updated overdue statuses in backend");
      }
    } catch (error) {
      console.error("Error syncing overdue statuses with backend:", error);
      // Don't show alert to user as this is a background operation
    }
  };

  // Auto-check for overdue fees every 5 minutes
  useEffect(() => {
    const checkOverdueInterval = setInterval(() => {
      setChallans((prevChallans) => {
        const updatedChallans = updateOverdueStatuses(prevChallans);

        // Check if any changes were made
        const hasChanges = updatedChallans.some(
          (challan, index) => challan.status !== prevChallans[index]?.status
        );

        if (hasChanges) {
          console.log("Auto-updating overdue statuses...");
          syncOverdueStatusesWithBackend(updatedChallans);
          return updatedChallans;
        }

        return prevChallans;
      });
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(checkOverdueInterval);
  }, []);

  // Manual function to check and update overdue statuses (can be called by a button)
  const manualCheckOverdue = async () => {
    try {
      const updatedChallans = updateOverdueStatuses(challans);
      const hasChanges = updatedChallans.some(
        (challan, index) => challan.status !== challans[index]?.status
      );

      if (hasChanges) {
        setChallans(updatedChallans);
        await syncOverdueStatusesWithBackend(updatedChallans);

        const overdueCount = updatedChallans.filter(
          (c) => c.status === "overdue"
        ).length;
        alert(`Status updated! Found ${overdueCount} overdue fee(s).`);
      } else {
        alert("All fee statuses are up to date.");
      }
    } catch (error) {
      console.error("Error checking overdue statuses:", error);
      alert("Error updating overdue statuses. Please try again.");
    }
  };

  // Get pending fees for a specific student
  const getPendingFeesForStudent = (studentId: string) => {
    return challans.filter(
      (challan) =>
        challan.studentId._id === studentId &&
        (challan.status === "pending" || challan.status === "overdue")
    );
  };

  // Update pending fees when student is selected
  useEffect(() => {
    if (selectedStudent) {
      const pending = getPendingFeesForStudent(selectedStudent);
      setPendingFees(pending);

      // Check if any pending fees are overdue and show late fee input
      const hasOverdueFees = pending.some((fee) => fee.status === "overdue");
      setShowLateFeeInput(hasOverdueFees);

      // Initialize late fees object for overdue fees
      const initialLateFees: { [key: string]: number } = {};
      pending.forEach((fee) => {
        if (fee.status === "overdue") {
          initialLateFees[fee.id] = 0;
        }
      });
      setLateFees(initialLateFees);
    } else {
      setPendingFees([]);
      setShowLateFeeInput(false);
      setLateFees({});
    }
  }, [selectedStudent, challans]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student._id);
    setStudentSearch(
      `${student.studentName} - ${student.fatherName} (ID: ${student._id})`
    );
    setShowStudentDropdown(false);

    // Clear any previous selections when switching students
    setSelectedPendingFees([]);
    setLateFees({});
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

      // Set due date to 10th of the month
      const dueDate = `${year}-${String(
        new Date(`${month} 1, ${year}`).getMonth() + 1
      ).padStart(2, "0")}-10`;

      const newChallan: FeeChallan = {
        id: `${studentId}-${month}-${year}`, // This will be replaced by MongoDB _id
        studentId: {
          _id: student._id,
          rollNumber: student.rollNumber,
          studentName: student.studentName,
          fatherName: student.fatherName,
          fPhoneNumber: student.fPhoneNumber,
        },
        month,
        year,
        tutionFee: classFee.tutionFee,
        paperFund: classFee.paperFund,
        examFee: classFee.examFee,
        miscFee: classFee.miscFee,
        totalAmount:
          classFee.tutionFee +
          classFee.paperFund +
          classFee.examFee +
          classFee.miscFee,
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

  const downloadFeeChallanPDF = (challan: FeeChallan) => {
    // Create a simple PDF-like content
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Fee Challan - ${challan.studentId.studentName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .challan-info { margin: 20px 0; }
        .fee-details { border-collapse: collapse; width: 100%; margin: 20px 0; }
        .fee-details th, .fee-details td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .fee-details th { background-color: #f2f2f2; }
        .total { font-weight: bold; font-size: 18px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; }
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
        <p><strong>Month/Year:</strong> ${challan.month} ${challan.year}</p>
        <p><strong>Due Date:</strong> ${challan.dueDate}</p>
        <p><strong>Challan ID:</strong> ${challan.id}</p>
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
            <td>Paper Fund</td>
            <td>${challan.paperFund || 0}</td>
        </tr>
        <tr>
            <td>Exam Fee</td>
            <td>${challan.examFee || 0}</td>
        </tr>
        <tr>
            <td>Miscellaneous Fee</td>
            <td>${challan.miscFee || 0}</td>
        </tr>
        <tr class="total">
            <td>Total Amount</td>
            <td>Rs. ${
              (Number(challan.paperFund) || 0) +
              (Number(challan.examFee) || 0) +
              (Number(challan.miscFee) || 0) +
              (Number(challan.tutionFee) || 0)
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

    const blob = new Blob([pdfContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fee-challan-${challan.studentId.studentName}-${challan.month}-${challan.year}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const submitFeePayment = async () => {
    if (!selectedStudent || selectedPendingFees.length === 0) {
      alert(
        "Please select a student and at least one fee challan to process payment."
      );
      return;
    }

    try {
      console.log("Selected pending fees:", selectedPendingFees);
      console.log("Late fees:", lateFees);

      // Check if any fees have late fees that need to be updated first
      const feesWithLateFees = selectedPendingFees.filter(
        (feeId) => lateFees[feeId] && lateFees[feeId] > 0
      );

      // Step 1: Update late fees if any exist
      if (feesWithLateFees.length > 0) {
        // Update each fee with late fee individually using the existing updateFee route
        for (const feeId of feesWithLateFees) {
          const fee = challans.find((c) => c.id === feeId);
          if (!fee) continue;

          const lateFee = lateFees[feeId];

          // Use the existing updateFee route (PUT/PATCH /api/fees/:id)
          await axios.put(
            `${BACKEND}/api/fees/${feeId}`,
            {
              ...fee,
              miscFee: fee.miscFee + lateFee,
              // Don't update totalAmount - let the pre-save middleware handle it
            },
            { withCredentials: true }
          );
        }
      }

      // Step 2: Update all selected fees to "paid" status using bulk update
      const updateResponse = await axios.patch(
        `${BACKEND}/api/fees/bulk-update`,
        {
          feeIds: selectedPendingFees,
          status: "paid",
        },
        { withCredentials: true }
      );

      if (updateResponse.status === 200) {
        // Refresh the fees list to get the latest data
        const fetchResponse = await axios.get(`${BACKEND}/api/fees`, {
          withCredentials: true,
        });
        setChallans(fetchResponse.data.data);

        // Calculate total amount paid including late fees
        const totalLateFees = Object.values(lateFees).reduce(
          (sum, fee) => sum + fee,
          0
        );

        const totalPaid = selectedPendingFees.reduce((sum, feeId) => {
          const fee = challans.find((c) => c.id === feeId);
          const lateFee = lateFees[feeId] || 0;
          return sum + (fee ? fee.totalAmount + lateFee : 0);
        }, 0);

        // Reset form
        setSelectedPendingFees([]);
        setSelectedStudent("");
        setStudentSearch("");
        setLateFees({});

        const message =
          totalLateFees > 0
            ? `Payment successfully recorded! Total amount: Rs. ${totalPaid} (including Rs. ${totalLateFees} late fees)`
            : `Payment successfully recorded! Total amount: Rs. ${totalPaid}`;

        alert(message);
      } else {
        throw new Error("Failed to update payment status");
      }
    } catch (error) {
      console.error("Error submitting fee payment:", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response === "object"
      ) {
        const response = (error as any).response;
        console.error("Response data:", response.data);
        console.error("Response status:", response.status);

        if (response.data && response.data.message) {
          alert(`Failed to submit fee payment: ${response.data.message}`);
        } else {
          alert(
            "Failed to submit fee payment. Please check the console for details."
          );
        }
      } else {
        alert("Failed to submit fee payment. Please try again.");
      }
    }
  };

  const sendFeeReminder = async (challan: FeeChallan) => {
    try {
      // Validate phone number exists
      console.log(students);
      console.log(challan.studentId);
      if (!challan.studentId.fPhoneNumber) {
        alert(
          `Phone number not available for ${challan.studentId.studentName}. Please update the student's phone number first.`
        );
        return;
      }

      // Clean and format phone number
      let phoneNumber = challan.studentId.fPhoneNumber
        .toString()
        .replace(/[\s-]/g, "");

      // Remove any non-digit characters except +
      phoneNumber = phoneNumber.replace(/[^\d+]/g, "");

      // Handle Pakistani phone number formatting
      if (phoneNumber.startsWith("+92")) {
        phoneNumber = phoneNumber.substring(1); // Remove the + sign
      } else if (phoneNumber.startsWith("0")) {
        phoneNumber = "92" + phoneNumber.substring(1); // Replace 0 with 92
      } else if (!phoneNumber.startsWith("92")) {
        // If it doesn't start with 92, assume it's a local number starting with 3
        if (phoneNumber.startsWith("3")) {
          phoneNumber = "92" + phoneNumber;
        } else {
          alert(
            `Invalid phone number format for ${challan.studentId.studentName}: ${challan.studentId.fPhoneNumber}`
          );
          return;
        }
      }

      // Validate phone number length (Pakistani mobile numbers should be 13 digits with country code)
      if (phoneNumber.length < 12 || phoneNumber.length > 13) {
        alert(
          `Invalid phone number length for ${challan.studentId.studentName}: ${challan.studentId.fPhoneNumber}`
        );
        return;
      }

      // Format due date
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

      // Format due date for display
      let formattedDueDate = dueDate;
      try {
        if (dueDate) {
          const dateObj = new Date(dueDate);
          formattedDueDate = dateObj.toLocaleDateString("en-GB"); // DD/MM/YYYY format
        }
      } catch (error) {
        console.error("Error formatting due date:", error);
      }

      // Create WhatsApp message
      const message =
        whatsappMessage ||
        `
*Fee Reminder - Falcon House School*

Dear ${challan.studentId.fatherName || "Parent"},

This is a reminder for ${challan.studentId.studentName}'s fee:

📚 *Student Details:*
• Name: ${challan.studentId.studentName}
• Roll Number: ${challan.studentId.rollNumber || "N/A"}

📅 *Fee Details:*
• Month: ${challan.month} ${challan.year}
• Due Date: ${formattedDueDate}

💰 *Fee Breakdown:*
• Tuition Fee: Rs. ${Number(challan.tutionFee) || 0}
• Paper Fund: Rs. ${Number(challan.paperFund) || 0}
• Exam Fee: Rs. ${Number(challan.examFee) || 0}
• Miscellaneous Fee: Rs. ${Number(challan.miscFee) || 0}

💳 *Total Amount: Rs. ${
          challan.totalAmount ||
          (Number(challan.tutionFee) || 0) +
            (Number(challan.paperFund) || 0) +
            (Number(challan.examFee) || 0) +
            (Number(challan.miscFee) || 0)
        }*

${
  challan.status === "paid"
    ? "✅ Thank you for your payment!"
    : challan.status === "overdue"
    ? "⚠️ This payment is overdue. Please pay as soon as possible to avoid additional charges."
    : "Please pay before the due date to avoid late fees."
}

Best regards,
Falcon House School Administration
    `.trim();

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      console.log("Opening WhatsApp with:", {
        phoneNumber,
        originalPhone: challan.studentId.fPhoneNumber,
        studentName: challan.studentId.studentName,
      });

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");

      try {
        // Update WhatsApp status in database
        await axios.patch(
          `${BACKEND}/api/fees/${challan.id}/whatsapp`,
          { sentToWhatsApp: true },
          { withCredentials: true }
        );

        // Update local state
        setChallans((prevChallans) =>
          prevChallans.map((c) =>
            c.id === challan.id ? { ...c, sentToWhatsApp: true } : c
          )
        );
      } catch (error) {
        console.error("Error updating WhatsApp status:", error);
        // Don't show alert for this error as WhatsApp was still sent
      }
    } catch (error) {
      console.error("Error in sendFeeReminder:", error);
      alert(
        `Error sending WhatsApp reminder: ${
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : String(error)
        }`
      );
    }
  };

  // Enhanced filtering logic
  const filteredChallans = challans.filter((challan) => {
    // Text search
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
        .includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || challan.status === statusFilter;

    // Month filter
    const matchesMonth = monthFilter === "all" || challan.month === monthFilter;

    // Year filter
    const matchesYear = yearFilter === "all" || challan.year === yearFilter;

    // WhatsApp filter
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

  // Get unique months and years for filter options
  const uniqueMonths = Array.from(new Set(challans.map((c) => c.month)));
  const uniqueYears = Array.from(new Set(challans.map((c) => c.year)));

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setWhatsappFilter("all");
    setSearchTerm("");
  };

  // Count active filters
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

  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
        <p className="text-muted-foreground">
          Generate fee challans, submit payments, and send notifications to
          parents via WhatsApp
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Fee Challans</TabsTrigger>
          <TabsTrigger value="submit">Submit Fee Payment</TabsTrigger>
          <TabsTrigger value="list">View Fee Records</TabsTrigger>
          <TabsTrigger value="settings">WhatsApp Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Fee Challans</CardTitle>
              <CardDescription>
                Generate fee challans for students based on their class fee
                structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="generateMonth">Month</Label>
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
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
                        <SelectItem value="individual">
                          Individual Student
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {generatingFor === "class" && (
                  <div className="space-y-2">
                    <Label htmlFor="selectClass">Select Class</Label>
                    <Select
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                    >
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
        </TabsContent>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Submit Fee Payment</CardTitle>
              <CardDescription>
                Submit payment for already generated fee challans only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Student Selection */}
                <div className="space-y-2 relative">
                  <Label htmlFor="student">Search Student</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="student"
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
                                Father: {student.fatherName} | ID:{" "}
                                {student.rollNumber}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Display Generated Fee Challans for Selected Student */}
                {selectedStudent && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Generated Fee Challans for This Student
                      </h3>

                      {pendingFees.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium">
                            No Generated Fee Challans Found
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Please generate fee challans first in the "Generate
                            Fee Challans" tab
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingFees.map((fee) => (
                            <div
                              key={fee.id}
                              className="bg-white border rounded-lg p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`pending-${fee.id}`}
                                    checked={selectedPendingFees.includes(
                                      fee.id
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedPendingFees([
                                          ...selectedPendingFees,
                                          fee.id,
                                        ]);
                                      } else {
                                        setSelectedPendingFees(
                                          selectedPendingFees.filter(
                                            (id) => id !== fee.id
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <div>
                                    <h4 className="font-medium text-lg flex items-center gap-2">
                                      {fee.month} {fee.year}
                                      {fee.status === "overdue" && (
                                        <Badge className="bg-red-100 text-red-800 text-xs">
                                          Overdue
                                        </Badge>
                                      )}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      Due Date: {fee.dueDate}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {getStatusBadge(fee.status)}
                                  <div className="text-lg font-bold text-green-600 mt-1">
                                    Rs.{" "}
                                    {fee.totalAmount + (lateFees[fee.id] || 0)}
                                    {lateFees[fee.id] > 0 && (
                                      <span className="text-sm text-red-600 block">
                                        (+ Rs. {lateFees[fee.id]} late fee)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Fee Breakdown */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="font-medium text-gray-600">
                                    Tuition Fee
                                  </div>
                                  <div className="font-semibold">
                                    Rs. {fee.tutionFee}
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="font-medium text-gray-600">
                                    Paper Fund
                                  </div>
                                  <div className="font-semibold">
                                    Rs. {fee.paperFund}
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="font-medium text-gray-600">
                                    Exam Fee
                                  </div>
                                  <div className="font-semibold">
                                    Rs. {fee.examFee}
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="font-medium text-gray-600">
                                    Misc Fee
                                  </div>
                                  <div className="font-semibold">
                                    Rs. {fee.miscFee}
                                  </div>
                                </div>
                              </div>

                              {/* Late Fee Input for Overdue Fees */}
                              {fee.status === "overdue" && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                      <span className="font-medium text-red-800">
                                        Overdue Fee - Add Late Fee
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Label
                                      htmlFor={`lateFee-${fee.id}`}
                                      className="text-sm"
                                    >
                                      Late Fee Amount (Rs.)
                                    </Label>
                                    <Input
                                      id={`lateFee-${fee.id}`}
                                      type="number"
                                      min="0"
                                      step="10"
                                      value={lateFees[fee.id] || 0}
                                      onChange={(e) => {
                                        const value = Math.max(
                                          0,
                                          Number(e.target.value)
                                        );
                                        setLateFees((prev) => ({
                                          ...prev,
                                          [fee.id]: value,
                                        }));
                                      }}
                                      className="w-24 h-8"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-red-600">
                                      Will be added to misc fee
                                    </span>
                                  </div>
                                  <p className="text-xs text-red-600 mt-1">
                                    💡 Due date was {fee.dueDate}. This fee is{" "}
                                    {Math.ceil(
                                      (new Date().getTime() -
                                        new Date(fee.dueDate).getTime()) /
                                        (1000 * 3600 * 24)
                                    )}{" "}
                                    days overdue.
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                              💡 <strong>Note:</strong> Select the challans
                              above that you want to mark as paid. You can
                              select multiple months at once.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Summary */}
                    {selectedPendingFees.length > 0 && (
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          Payment Summary
                        </h3>

                        <div className="space-y-2">
                          {pendingFees
                            .filter((fee) =>
                              selectedPendingFees.includes(fee.id)
                            )
                            .map((fee) => (
                              <div
                                key={fee.id}
                                className="flex justify-between items-center bg-white p-2 rounded"
                              >
                                <span className="text-sm">
                                  {fee.month} {fee.year}
                                  {lateFees[fee.id] > 0 && (
                                    <span className="text-red-600 ml-1">
                                      (+ Rs. {lateFees[fee.id]} late fee)
                                    </span>
                                  )}
                                </span>
                                <span className="font-semibold">
                                  Rs.{" "}
                                  {fee.totalAmount + (lateFees[fee.id] || 0)}
                                </span>
                              </div>
                            ))}

                          <div className="border-t pt-2 mt-3">
                            <div className="flex justify-between items-center font-bold text-lg">
                              <span>Total Amount:</span>
                              <span className="text-green-600">
                                Rs.{" "}
                                {pendingFees
                                  .filter((fee) =>
                                    selectedPendingFees.includes(fee.id)
                                  )
                                  .reduce(
                                    (sum, fee) =>
                                      sum +
                                      fee.totalAmount +
                                      (lateFees[fee.id] || 0),
                                    0
                                  )}
                              </span>
                            </div>
                            {Object.values(lateFees).some((fee) => fee > 0) && (
                              <div className="flex justify-between items-center text-sm text-red-600 mt-1">
                                <span>Late Fees:</span>
                                <span>
                                  Rs.{" "}
                                  {Object.values(lateFees).reduce(
                                    (sum, fee) => sum + fee,
                                    0
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Payment Button */}
                    <Button
                      onClick={submitFeePayment}
                      className="w-full"
                      size="lg"
                      disabled={selectedPendingFees.length === 0}
                    >
                      <Receipt className="h-5 w-5 mr-2" />
                      Submit Payment for {selectedPendingFees.length} Challan(s)
                      {selectedPendingFees.length > 0 && (
                        <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded text-sm font-bold">
                          Rs.{" "}
                          {pendingFees
                            .filter((fee) =>
                              selectedPendingFees.includes(fee.id)
                            )
                            .reduce(
                              (sum, fee) =>
                                sum + fee.totalAmount + (lateFees[fee.id] || 0),
                              0
                            )}
                        </span>
                      )}
                    </Button>
                  </div>
                )}

                {!selectedStudent && (
                  <div className="text-center py-12">
                    <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Select a Student
                    </h3>
                    <p className="text-gray-500">
                      Search and select a student above to view their generated
                      fee challans
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>
                Fee Records ({filteredChallans.length} of {challans.length})
              </CardTitle>
              <CardDescription>
                View and manage all fee payment records
              </CardDescription>

              {/* Auto-Update Status Button */}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={manualCheckOverdue}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Check Overdue
                </Button>
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
                  {/* Status Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Status
                    </Label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
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

                  {/* Month Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Month
                    </Label>
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

                  {/* Year Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Year
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

                  {/* WhatsApp Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      WhatsApp
                    </Label>
                    <Select
                      value={whatsappFilter}
                      onValueChange={setWhatsappFilter}
                    >
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

                {/* Quick Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === "pending" ? "all" : "pending"
                      )
                    }
                    className="h-7 text-xs"
                  >
                    Pending Fees
                  </Button>
                  <Button
                    variant={statusFilter === "paid" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setStatusFilter(statusFilter === "paid" ? "all" : "paid")
                    }
                    className="h-7 text-xs"
                  >
                    Paid Fees
                  </Button>
                  <Button
                    variant={statusFilter === "overdue" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === "overdue" ? "all" : "overdue"
                      )
                    }
                    className="h-7 text-xs"
                  >
                    Overdue Fees
                  </Button>
                  <Button
                    variant={
                      whatsappFilter === "not_sent" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setWhatsappFilter(
                        whatsappFilter === "not_sent" ? "all" : "not_sent"
                      )
                    }
                    className="h-7 text-xs"
                  >
                    Not Reminded
                  </Button>
                </div>

                {/* Filter Summary */}
                {filteredChallans.length !== challans.length && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      📊 Showing <strong>{filteredChallans.length}</strong> of{" "}
                      <strong>{challans.length}</strong> fee records
                      {activeFiltersCount > 0 &&
                        ` with ${activeFiltersCount} filter(s) applied`}
                    </p>
                  </div>
                )}
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
                      <TableHead>Month/Year</TableHead>
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
                          colSpan={9}
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
                      filteredChallans.map((challan) => (
                        <TableRow key={challan.id}>
                          <TableCell className="font-medium">
                            {challan.studentId.studentName}
                          </TableCell>
                          <TableCell>{challan.studentId.fatherName}</TableCell>
                          <TableCell>{challan.studentId.rollNumber}</TableCell>
                          <TableCell>
                            {challan.month} {challan.year}
                          </TableCell>
                          <TableCell>
                            Rs.{" "}
                            {(Number(challan.examFee) || 0) +
                              (Number(challan.miscFee) || 0) +
                              (Number(challan.tutionFee) || 0) +
                              (Number(challan.paperFund) || 0)}
                          </TableCell>
                          <TableCell>{challan.dueDate}</TableCell>
                          <TableCell>
                            {getStatusBadge(challan.status)}
                          </TableCell>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Reminder Template</CardTitle>
              <CardDescription>
                Customize the reminder message sent to parents via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappTemplate">
                    Reminder Message Template
                  </Label>
                  <Textarea
                    id="whatsappTemplate"
                    placeholder="Enter custom WhatsApp reminder message template..."
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    rows={10}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to use default template. Available variables:
                    Student name, father name, fees breakdown, total amount, due
                    date, payment status.
                  </p>
                </div>
                <Button
                  onClick={() => setWhatsappMessage("")}
                  variant="outline"
                >
                  Reset to Default Template
                </Button>
              </div>

              {/* Fee Structure Management */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Fee Structure by Class
                </h3>
                <div className="space-y-4">
                  {feeStructure?.map((classFee, index) => (
                    <div
                      key={classFee.className}
                      className="grid grid-cols-6 gap-2 items-center p-3 border rounded"
                    >
                      <div className="font-medium">{classFee.className}</div>
                      <Input
                        type="number"
                        value={classFee.tutionFee}
                        onChange={(e) => {
                          const updated = [...feeStructure];
                          updated[index].tutionFee = Number(e.target.value);
                          setFeeStructure(updated);
                        }}
                        placeholder="Tuition"
                      />
                      <Input
                        type="number"
                        value={classFee.paperFund}
                        onChange={(e) => {
                          const updated = [...feeStructure];
                          updated[index].paperFund = Number(e.target.value);
                          setFeeStructure(updated);
                        }}
                        placeholder="Paper Fund"
                      />
                      <Input
                        type="number"
                        value={classFee.examFee}
                        onChange={(e) => {
                          const updated = [...feeStructure];
                          updated[index].examFee = Number(e.target.value);
                          setFeeStructure(updated);
                        }}
                        placeholder="Exam Fee"
                      />
                      <Input
                        type="number"
                        value={classFee.miscFee}
                        onChange={(e) => {
                          const updated = [...feeStructure];
                          updated[index].miscFee = Number(e.target.value);
                          setFeeStructure(updated);
                        }}
                        placeholder="Misc Fee"
                      />
                      <div className="text-sm font-medium">
                        Total: Rs.{" "}
                        {classFee.tutionFee +
                          classFee.paperFund +
                          classFee.examFee +
                          classFee.miscFee}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => setFeeStructure(feeStructure)}
                  variant="outline"
                  className="mt-4"
                >
                  Reset to Default Fee Structure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
