"use client";
import axios from "axios";
import { useEffect, useState } from "react";
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
import { Badge } from "../ui/badge";
import {
  Receipt,
  Search,
  User,
  FileText,
  AlertTriangle,
  Calculator,
} from "lucide-react";
import { Checkbox } from "../ui/checkbox";
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

interface PaymentBreakdown {
  feeId: string;
  month: string;
  year: string;
  originalAmount: number;
  currentBalance: number;
  lateFee: number;
  totalRequired: number;
  paymentAmount: number;
  newBalance: number;
  status: "paid" | "pending";
}

interface PaymentSummary {
  totalPaid: number;
  breakdown: PaymentBreakdown[];
  remainingAmount: number;
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

interface SubmitPaymentTabProps {
  students: Student[];
  challans: FeeChallan[];
  setChallans: (challans: FeeChallan[]) => void;
}

export function SubmitPaymentTab({
  students,
  challans,
  setChallans,
}: SubmitPaymentTabProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [pendingFees, setPendingFees] = useState<FeeChallan[]>([]);
  const [selectedPendingFees, setSelectedPendingFees] = useState<string[]>([]);
  const [lateFees, setLateFees] = useState<{ [key: string]: number }>({});
  const [partialPaymentMode, setPartialPaymentMode] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(
    null
  );

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const getPendingFeesForStudent = (studentId: string) => {
    return challans
      .filter(
        (challan) =>
          challan.studentId._id === studentId &&
          (challan.status === "pending" || challan.status === "overdue")
      )
      .map((challan) => ({
        ...challan,
        displayAmount: challan.totalAmount - challan.arrears,
      }));
  };

  // New WhatsApp function
  const sendPaymentConfirmation = async (
    selectedFees: FeeChallan[],
    lateFees: { [key: string]: number }
  ) => {
    try {
      const student = selectedFees[0].studentId;

      if (!student.mPhoneNumber) {
        toast.error(
          `Phone number not available for ${student.studentName}. Please update the student's phone number first.`
        );
        return;
      }

      // Format phone number (same logic as your existing function)
      let phoneNumber = student.mPhoneNumber.toString().replace(/[\s-]/g, "");

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
            `Invalid phone number format for ${student.studentName}: ${student.mPhoneNumber}`
          );
          return;
        }
      }

      if (phoneNumber.length < 12 || phoneNumber.length > 13) {
        toast.error(
          `Invalid phone number length for ${student.studentName}: ${student.mPhoneNumber}`
        );
        return;
      }

      // Calculate totals
      const totalTuitionFee = selectedFees.reduce(
        (sum, fee) => sum + fee.tutionFee,
        0
      );
      const totalExamFee = selectedFees.reduce(
        (sum, fee) => sum + fee.examFee,
        0
      );
      const totalMiscFee = selectedFees.reduce(
        (sum, fee) => sum + fee.miscFee,
        0
      );
      const totalDiscount = selectedFees.reduce(
        (sum, fee) => sum + fee.discount,
        0
      );
      const totalLateFees = Object.values(lateFees).reduce(
        (sum, fee) => sum + fee,
        0
      );
      const grandTotal =
        totalTuitionFee +
        totalExamFee +
        totalMiscFee +
        totalLateFees -
        totalDiscount;

      const monthsString = selectedFees
        .map((fee) => `${fee.month} ${fee.year}`)
        .join(", ");

      // Create payment confirmation message
      const message = `
*Payment Confirmation - Falcon House School*

Dear ${student.fatherName || "Parent"},

Thank you for your payment! Here are the details:

*Student Information:*
• Name: ${student.studentName}
• Roll Number: ${student.rollNumber}
• Class: ${student.class}-${student.section}

*Payment Details:*
• Date: ${new Date().toLocaleDateString()}
• Months Paid: ${monthsString}

*Fee Breakdown:*
• Tuition Fee: Rs. ${totalTuitionFee.toLocaleString()}
• Exam Fee: Rs. ${totalExamFee.toLocaleString()}
• Miscellaneous Fee: Rs. ${totalMiscFee.toLocaleString()}
${totalLateFees > 0 ? `• Late Fee: Rs. ${totalLateFees.toLocaleString()}` : ""}
${totalDiscount > 0 ? `• Discount: Rs. -${totalDiscount.toLocaleString()}` : ""}

*Total Paid: Rs. ${grandTotal.toLocaleString()}*

Your payment has been successfully recorded in our system. Please keep this message as confirmation.

Thank you for choosing Falcon House School!

Best regards,
Falcon House School Administration
      `.trim();

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, "_blank");

      toast.success("WhatsApp message opened successfully!");
    } catch (error) {
      console.error("Error sending payment confirmation:", error);
      toast.error("Error opening WhatsApp message. Please try again.");
    }
  };

  const generateFeeChallanHTML = (
    selectedFees: FeeChallan[],
    lateFees: { [key: string]: number },
    isPartialPayment: boolean = false,
    partialPaymentAmount: string = "",
    paymentSummaryData: PaymentSummary | null = null
  ) => {
    const totalTuitionFee = selectedFees.reduce(
      (sum, fee) => sum + fee.tutionFee,
      0
    );
    const totalExamFee = selectedFees.reduce(
      (sum, fee) => sum + fee.examFee,
      0
    );
    const totalMiscFee = selectedFees.reduce(
      (sum, fee) => sum + fee.miscFee,
      0
    );
    const totalDiscount = selectedFees.reduce(
      (sum, fee) => sum + fee.discount,
      0
    );
    const totalLateFees = Object.values(lateFees).reduce(
      (sum, fee) => sum + fee,
      0
    );

    // For partial payment, use the actual amount paid
    const grandTotal =
      isPartialPayment && partialPaymentAmount
        ? parseFloat(partialPaymentAmount)
        : totalTuitionFee +
          totalExamFee +
          totalMiscFee +
          totalLateFees -
          totalDiscount;

    const totalOutstanding =
      totalTuitionFee +
      totalExamFee +
      totalMiscFee +
      totalLateFees -
      totalDiscount;
    const remainingBalance = isPartialPayment
      ? totalOutstanding - grandTotal
      : 0;

    const monthsString = selectedFees
      .map((fee) => `${fee.month} ${fee.year}`)
      .join(", ");

    const reciptId = Math.random().toString(36).substr(2, 9).toUpperCase();

    // Generate partial payment breakdown HTML
    const partialPaymentBreakdownHTML =
      isPartialPayment && paymentSummaryData
        ? `
    <div style="margin-top: 2mm; padding: 2mm; background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 1mm;">
      <p style="font-size: 11pt; font-weight: bold; margin-bottom: 1mm;">Payment Allocation:</p>
      ${paymentSummaryData.breakdown
        .map(
          (item) => `
        <div style="font-size: 10pt; margin-bottom: 0.5mm;">
          <span>${item.month} ${item.year}:</span>
          <span style="float: right;">Rs. ${item.paymentAmount.toLocaleString()} ${
            item.status === "paid" ? "(Full)" : "(Partial)"
          }</span>
        </div>
      `
        )
        .join("")}
    </div>
  `
        : "";

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Fee Payment Receipt - ${
      isPartialPayment ? "Partial Payment" : "Full Payment"
    }</title>
    <style>
        /* Your existing styles remain the same */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 0;
        }
        
        body {
            font-family: Arial, sans-serif;
            width: 205mm;
            height: 280mm;
            font-size: 14pt;
            position: relative;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 0;
        }

        .receipt-container {
            width: 105mm;
            height: 140mm;
            padding: 3mm;
            position: relative;
            border: 1px dashed #999;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2mm;
            border-bottom: 1px solid #333;
            padding-bottom: 1mm;
            flex-shrink: 0;
        }
        
        .header h1 {
            font-size: 17pt;
            margin-bottom: 0.5mm;
            font-weight: bold;
        }
        
        .header h2 {
            font-size: 14pt;
            font-weight: normal;
        }
        
        .payment-type-badge {
            display: inline-block;
            padding: 1mm 2mm;
            border-radius: 1mm;
            font-size: 11pt;
            font-weight: bold;
            margin-top: 1mm;
        }
        
        .payment-info-0 {
            gap: 0.5mm;
            margin-bottom: 2mm;
            flex-shrink: 0;
        }

        .payment-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5mm;
            margin-bottom: 2mm;
            flex-shrink: 0;
        }
        
        .payment-info p {
            margin: 0;
            line-height: 1.1;
            font-size: 13pt;
        }
        
        .months-paid {
            margin-bottom: 1.5mm;
            padding: 0.5mm 1mm;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 1mm;
            font-size: 12pt;
            flex-shrink: 0;
        }
        
        .fee-details {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1mm;
            font-size: 11pt;
            flex: 1;
        }
        
        .fee-details th, 
        .fee-details td {
            border: 0.3pt solid #ddd;
            padding: 0.5mm 1mm;
            text-align: left;
            line-height: 1;
        }
        
        .fee-details th {
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 11pt;
        }
        
        .amount-column {
            text-align: right !important;
            width: 22mm;
        }
        
        .grand-total {
            font-weight: bold;
            font-size: 12pt;
            background-color: #e9ecef;
        }
        
        .remaining-balance {
            font-weight: bold;
        }
        
        .footer {
            bottom: 3mm;
            left: 3mm;
            right: 3mm;
            text-align: center;
            font-size: 11pt;
            color: #666;
            border-top: 0.5pt solid #ddd;
            padding-top: 0.5mm;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <!-- Parents Receipt (Top Left) -->
    <div class="receipt-container">
        <div class="header">
            <h1>FALCON House School</h1>
            <h2>Fee Payment Receipt (Parents)</h2>
            <div class="payment-type-badge">${
              isPartialPayment ? "PARTIAL PAYMENT" : "FULL PAYMENT"
            }</div>
        </div>
        
        <div class="payment-info-0">
            <p><strong>Student name:</strong> ${
              selectedFees[0].studentId.studentName
            }</p>
            <p><strong>Father name:</strong> ${
              selectedFees[0].studentId.fatherName
            }</p>
              </div>
              <div class="payment-info">
              <p><strong>Reg No:</strong> ${
                selectedFees[0].studentId.rollNumber
              }</p>
            <p><strong>Class:</strong> ${selectedFees[0].studentId.class}-${
      selectedFees[0].studentId.section
    }</p>
            <p><strong>Receipt:</strong> ${reciptId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="months-paid">
            <strong>Months:</strong> ${monthsString}
        </div>

        <table class="fee-details">
            <tr>
                <th>Description</th>
                <th class="amount-column">Amount</th>
            </tr>
            ${
              isPartialPayment
                ? `
            <tr>
                <td>Tuition Fee</td>
                <td class="amount-column">${totalOutstanding.toLocaleString()}</td>
            </tr>
            <tr class="grand-total">
                <td>Amount Paid</td>
                <td class="amount-column">Rs. ${grandTotal.toLocaleString()}</td>
            </tr>
            <tr class="remaining-balance">
                <td>Remaining Balance</td>
                <td class="amount-column">Rs. ${remainingBalance.toLocaleString()}</td>
            </tr>
            `
                : `
            <tr>
                <td>Tuition Fee</td>
                <td class="amount-column">${totalTuitionFee.toLocaleString()}</td>
            </tr>
            <tr>
                <td>Exam Fee</td>
                <td class="amount-column">${totalExamFee.toLocaleString()}</td>
            </tr>
            <tr>
                <td>Misc Fee</td>
                <td class="amount-column">${totalMiscFee.toLocaleString()}</td>
            </tr>
            ${
              totalLateFees > 0
                ? `
            <tr>
                <td>Late Fee</td>
                <td class="amount-column">${totalLateFees.toLocaleString()}</td>
            </tr>
            `
                : ""
            }
            <tr class="grand-total">
                <td>Total Paid</td>
                <td class="amount-column">Rs. ${grandTotal.toLocaleString()}</td>
            </tr>
            `
            }
        </table>
        
        ${isPartialPayment ? partialPaymentBreakdownHTML : ""}

        <div class="footer">
            <p>This is a computer generated ${
              isPartialPayment ? "partial payment" : ""
            } receipt. Thank you for your payment.</p>
        </div>
    </div>

    <!-- Admin Receipt (Top Right) -->
    <div class="receipt-container">
        <div class="header">
            <h1>FALCON House School</h1>
            <h2>Fee Payment Receipt (Admin)</h2>
            <div class="payment-type-badge">${
              isPartialPayment ? "PARTIAL PAYMENT" : "FULL PAYMENT"
            }</div>
        </div>
        
        <div class="payment-info-0">
            <p><strong>Student name:</strong> ${
              selectedFees[0].studentId.studentName
            }</p>
               <p><strong>Father name:</strong> ${
                 selectedFees[0].studentId.fatherName
               }</p>
            </div>
            <div class="payment-info">
            <p><strong>Reg No:</strong> ${
              selectedFees[0].studentId.rollNumber
            }</p>
            <p><strong>Class:</strong> ${selectedFees[0].studentId.class}-${
      selectedFees[0].studentId.section
    }</p>
            <p><strong>Receipt:</strong> ${reciptId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="months-paid">
            <strong>Months:</strong> ${monthsString}
        </div>

        <table class="fee-details">
            <tr>
                <th>Description</th>
                <th class="amount-column">Amount</th>
            </tr>
            ${
              isPartialPayment
                ? `
            <tr>
                <td>Tuition Fee</td>
                <td class="amount-column">${totalOutstanding.toLocaleString()}</td>
            </tr>
            <tr class="grand-total">
                <td>Amount Paid</td>
                <td class="amount-column">Rs. ${grandTotal.toLocaleString()}</td>
            </tr>
            <tr class="remaining-balance">
                <td>Remaining Balance</td>
                <td class="amount-column">Rs. ${remainingBalance.toLocaleString()}</td>
            </tr>
            `
                : `
            <tr>
                <td>Tuition Fee</td>
                <td class="amount-column">${totalTuitionFee.toLocaleString()}</td>
            </tr>
            <tr>
                <td>Exam Fee</td>
                <td class="amount-column">${totalExamFee.toLocaleString()}</td>
            </tr>
            <tr>
                <td>Misc Fee</td>
                <td class="amount-column">${totalMiscFee.toLocaleString()}</td>
            </tr>
            ${
              totalLateFees > 0
                ? `
            <tr>
                <td>Late Fee</td>
                <td class="amount-column">${totalLateFees.toLocaleString()}</td>
            </tr>
            `
                : ""
            }
            <tr class="grand-total">
                <td>Total Paid</td>
                <td class="amount-column">Rs. ${grandTotal.toLocaleString()}</td>
            </tr>
            `
            }
        </table>
        
        ${isPartialPayment ? partialPaymentBreakdownHTML : ""}

        <div class="footer">
            <p>This is a computer generated ${
              isPartialPayment ? "partial payment" : ""
            } receipt. Thank you for your payment.</p>
        </div>
    </div>   
</body>
</html>
  `;
  };

  const generateThermalFeeChallanHTML = (
    selectedFees: FeeChallan[],
    lateFees: { [key: string]: number },
    isPartialPayment: boolean = false,
    partialPaymentAmount: string = "",
    paymentSummaryData: PaymentSummary | null = null
  ) => {
    const totalTuitionFee = selectedFees.reduce(
      (sum, fee) => sum + fee.tutionFee,
      0
    );
    const totalExamFee = selectedFees.reduce(
      (sum, fee) => sum + fee.examFee,
      0
    );
    const totalMiscFee = selectedFees.reduce(
      (sum, fee) => sum + fee.miscFee,
      0
    );
    const totalDiscount = selectedFees.reduce(
      (sum, fee) => sum + fee.discount,
      0
    );
    const totalLateFees = Object.values(lateFees).reduce(
      (sum, fee) => sum + fee,
      0
    );

    const grandTotal =
      isPartialPayment && partialPaymentAmount
        ? parseFloat(partialPaymentAmount)
        : totalTuitionFee +
          totalExamFee +
          totalMiscFee +
          totalLateFees -
          totalDiscount;

    const totalOutstanding =
      totalTuitionFee +
      totalExamFee +
      totalMiscFee +
      totalLateFees -
      totalDiscount;
    const remainingBalance = isPartialPayment
      ? totalOutstanding - grandTotal
      : 0;

    const monthsString = selectedFees
      .map((fee) => `${fee.month} ${fee.year}`)
      .join(", ");
    const reciptId = Math.random().toString(36).substr(2, 9).toUpperCase();

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Fee Receipt - ${
    isPartialPayment ? "Partial Payment" : "Full Payment"
  }</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      width: 80mm;
      padding: 5px;
    }
    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      margin-bottom: 5px;
    }
    .header h1 {
      font-size: 15px;
      margin-bottom: 2px;
    }
    .header h2 {
      font-size: 13px;
      font-weight: normal;
    }
    .payment-type {
      font-size: 12px;
      font-weight: bold;
      padding: 2px;
      margin: 3px 0;
      border: 1px solid #000;
    }
    .payment-info {
      margin-bottom: 5px;
    }
    .payment-info p {
      margin: 2px 0;
      font-size: 12px;
    }
    .months-paid {
      margin: 5px 0;
      padding: 3px;
      border: 1px dashed #333;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 5px;
    }
    th, td {
      border-bottom: 1px dashed #000;
      padding: 2px 0;
    }
    th { text-align: left; }
    td.amount { text-align: right; }
    .grand-total {
      font-weight: bold;
      border-top: 1px solid #000;
      padding-top: 3px;
    }
    .remaining {
      font-weight: bold;
      background-color: #f0f0f0;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      margin-top: 5px;
      border-top: 1px dashed #000;
      padding-top: 3px;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FALCON House School</h1>
    <h2>Fee Receipt (Parent Copy)</h2>
    ${
      isPartialPayment
        ? '<div class="payment-type">*** PARTIAL PAYMENT ***</div>'
        : ""
    }
  </div>

  <div class="payment-info">
    <p><strong>Student name:</strong> ${
      selectedFees[0].studentId.studentName
    }</p>
    <p><strong>Father name:</strong> ${selectedFees[0].studentId.fatherName}</p>
    <p><strong>Reg No:</strong> ${selectedFees[0].studentId.rollNumber}</p>
    <p><strong>Class:</strong> ${selectedFees[0].studentId.class}-${
      selectedFees[0].studentId.section
    }</p>
    <p><strong>Receipt:</strong> ${reciptId}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="months-paid">
    <strong>Months:</strong> ${monthsString}
  </div>

  <table>
    <tr><th>Description</th><th class="amount">Amount</th></tr>
    ${
      isPartialPayment
        ? `
    <tr><td>Tuition Fee</td><td class="amount">${totalOutstanding.toLocaleString()}</td></tr>
    <tr class="grand-total"><td>Amount Paid</td><td class="amount">Rs. ${grandTotal.toLocaleString()}</td></tr>
    <tr class="remaining"><td>Remaining Balance</td><td class="amount">Rs. ${remainingBalance.toLocaleString()}</td></tr>
    `
        : `
    <tr><td>Tuition Fee</td><td class="amount">${totalTuitionFee.toLocaleString()}</td></tr>
    <tr><td>Exam Fee</td><td class="amount">${totalExamFee.toLocaleString()}</td></tr>
    <tr><td>Misc Fee</td><td class="amount">${totalMiscFee.toLocaleString()}</td></tr>
    ${
      totalLateFees > 0
        ? `<tr><td>Late Fee</td><td class="amount">${totalLateFees.toLocaleString()}</td></tr>`
        : ""
    }
    <tr class="grand-total"><td>Total Paid</td><td class="amount">Rs. ${grandTotal.toLocaleString()}</td></tr>
    `
    }
  </table>

  ${
    isPartialPayment && paymentSummaryData
      ? `
  <div style="margin-top: 5px; padding: 3px; border: 1px dashed #000;">
    <strong>Payment Allocation:</strong>
    ${paymentSummaryData.breakdown
      .map(
        (item) => `
      <div style="font-size: 11px;">
        ${item.month} ${
          item.year
        }: Rs. ${item.paymentAmount.toLocaleString()} ${
          item.status === "paid" ? "✓" : "(P)"
        }
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>This is a computer generated ${
      isPartialPayment ? "partial payment" : ""
    } receipt.</p>
  </div>
</body>
</html>
  `;
  };

  const printPaymentReceipt = (option: string) => {
    const selectedFees = pendingFees.filter((fee) =>
      selectedPendingFees.includes(fee.id)
    );

    if (selectedFees.length === 0) {
      toast.error("Please select at least one fee challan to print receipt");
      return;
    }

    const receiptContent =
      option == "termal"
        ? generateThermalFeeChallanHTML(
            selectedFees,
            lateFees,
            partialPaymentMode,
            partialAmount,
            paymentSummary
          )
        : generateFeeChallanHTML(
            selectedFees,
            lateFees,
            partialPaymentMode,
            partialAmount,
            paymentSummary
          );

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = function () {
        printWindow.print();
        // Close the window after printing (optional)
        printWindow.onafterprint = function () {
          printWindow.close();
        };
      };
    }
  };

  const simulatePartialPayment = (amount: string): PaymentSummary | null => {
    if (!amount || parseFloat(amount) <= 0) return null;

    const selectedFees = pendingFees
      .filter((fee: FeeChallan) => selectedPendingFees.includes(fee.id))
      .sort((a: FeeChallan, b: FeeChallan) => {
        // Sort by year first (oldest first)
        const yearA = parseInt(a.year);
        const yearB = parseInt(b.year);
        if (yearA !== yearB) {
          return yearA - yearB;
        }

        // Then sort by month (oldest first for FIFO)
        const months: { [key: string]: number } = {
          January: 1,
          February: 2,
          March: 3,
          April: 4,
          May: 5,
          June: 6,
          July: 7,
          August: 8,
          September: 9,
          October: 10,
          November: 11,
          December: 12,
        };

        const monthA = months[a.month] || 0;
        const monthB = months[b.month] || 0;
        return monthA - monthB;
      });

    let remainingAmount: number = parseFloat(amount);
    const paymentBreakdown: PaymentBreakdown[] = [];

    for (const fee of selectedFees) {
      if (remainingAmount <= 0) break;

      const lateFee: number = lateFees[fee.id] || 0;
      const currentBalance: number = fee.remainingBalance || fee.totalAmount;
      const totalRequired: number = currentBalance + lateFee;

      const paymentForThisFee: number = Math.min(
        remainingAmount,
        totalRequired
      );
      const newBalance: number = Math.max(0, totalRequired - paymentForThisFee);

      paymentBreakdown.push({
        feeId: fee.id,
        month: fee.month,
        year: fee.year,
        originalAmount: fee.totalAmount,
        currentBalance,
        lateFee,
        totalRequired,
        paymentAmount: paymentForThisFee,
        newBalance,
        status: newBalance <= 0 ? "paid" : "pending",
      });

      remainingAmount -= paymentForThisFee;
    }

    return {
      totalPaid: parseFloat(amount),
      breakdown: paymentBreakdown,
      remainingAmount: remainingAmount,
    };
  };

  const submitPartialPayment = async (): Promise<void> => {
    if (
      !selectedStudent ||
      selectedPendingFees.length === 0 ||
      !partialAmount
    ) {
      toast.error("Please select fees and enter partial payment amount.");
      return;
    }

    const amount: number = parseFloat(partialAmount);
    const totalOutstanding: number = selectedPendingFees.reduce(
      (total: number, feeId: string) => {
        const fee = pendingFees.find((f: FeeChallan) => f.id === feeId);
        if (!fee) return total;

        const currentBalance: number = fee.remainingBalance || fee.totalAmount;
        const lateFee: number = lateFees[feeId] || 0;
        return total + currentBalance + lateFee;
      },
      0
    );

    if (amount <= 0) {
      toast.error("Please enter a valid amount greater than 0.");
      return;
    }

    if (amount > totalOutstanding) {
      toast.error(
        `Amount cannot exceed total outstanding (Rs. ${totalOutstanding.toLocaleString()})`
      );
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND}/api/fees/partial-payment`,
        {
          studentId: selectedStudent,
          selectedFeeIds: selectedPendingFees,
          partialAmount: amount,
          lateFees: lateFees,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh the fees list
        const fetchResponse = await axios.get(`${BACKEND}/api/fees`, {
          withCredentials: true,
        });
        setChallans(fetchResponse.data.data);

        // Send WhatsApp confirmation for partial payment
        const selectedFees: FeeChallan[] = pendingFees.filter(
          (fee: FeeChallan) => selectedPendingFees.includes(fee.id)
        );
        await sendPartialPaymentConfirmation(selectedFees, amount, lateFees);

        toast.success(
          `Partial payment of Rs. ${amount.toLocaleString()} submitted successfully!`
        );

        // Reset form
        setSelectedPendingFees([]);
        setPartialPaymentMode(false);
        setPartialAmount("");
        setPaymentSummary(null);
        setLateFees({});
      }
    } catch (error) {
      console.error("Error submitting partial payment:", error);
      toast.error("Failed to submit partial payment. Please try again.");
    }
  };

  // ADD this function for partial payment WhatsApp confirmation:
  const sendPartialPaymentConfirmation = async (
    selectedFees: FeeChallan[],
    paidAmount: number,
    lateFees: { [key: string]: number }
  ): Promise<void> => {
    try {
      const student = selectedFees[0].studentId;

      if (!student.mPhoneNumber) {
        toast.error(
          `Phone number not available for ${student.studentName}. Please update the student's phone number first.`
        );
        return;
      }

      // Format phone number (same logic as existing function)
      let phoneNumber: string = student.mPhoneNumber
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
            `Invalid phone number format for ${student.studentName}: ${student.mPhoneNumber}`
          );
          return;
        }
      }

      if (phoneNumber.length < 12 || phoneNumber.length > 13) {
        toast.error(
          `Invalid phone number length for ${student.studentName}: ${student.mPhoneNumber}`
        );
        return;
      }

      const monthsString: string = selectedFees
        .map((fee: FeeChallan) => `${fee.month} ${fee.year}`)
        .join(", ");

      // Calculate outstanding balance
      const totalOutstanding: number = selectedFees.reduce(
        (sum: number, fee: FeeChallan) => {
          const currentBalance: number =
            fee.remainingBalance || fee.totalAmount;
          const lateFee: number = lateFees[fee.id] || 0;
          return sum + currentBalance + lateFee;
        },
        0
      );

      const remainingBalance: number = totalOutstanding - paidAmount;

      // Create partial payment confirmation message
      const message: string = `
*Partial Payment Confirmation - Falcon House School*

Dear ${student.fatherName || "Parent"},

Thank you for your partial payment!

*Student Information:*
• Name: ${student.studentName}
• Roll Number: ${student.rollNumber}
• Class: ${student.class}-${student.section}

*Payment Details:*
• Date: ${new Date().toLocaleDateString()}
• Months: ${monthsString}
• Amount Paid: Rs. ${paidAmount.toLocaleString()}

*Balance Information:*
• Total Outstanding: Rs. ${totalOutstanding.toLocaleString()}
• Amount Paid: Rs. ${paidAmount.toLocaleString()}
• Remaining Balance: Rs. ${remainingBalance.toLocaleString()}

Your partial payment has been successfully recorded. The remaining balance will be allocated to pending fees.

Thank you for choosing Falcon House School!

Best regards,
Falcon House School Administration
    `.trim();

      const whatsappUrl: string = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, "_blank");

      toast.success(
        "WhatsApp partial payment confirmation opened successfully!"
      );
    } catch (error) {
      console.error("Error sending partial payment confirmation:", error);
      toast.error("Error opening WhatsApp message. Please try again.");
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      const pending = getPendingFeesForStudent(selectedStudent);
      setPendingFees(pending);
      const initialLateFees: { [key: string]: number } = {};
      pending.forEach((fee) => {
        if (fee.status === "overdue") {
          initialLateFees[fee.id] = 0;
        }
      });
      setLateFees(initialLateFees);
    } else {
      setPendingFees([]);
      setLateFees({});
    }
  }, [selectedStudent, challans]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student._id);
    setStudentSearch(
      `${student.studentName} - ${student.fatherName} (ID: ${student._id})`
    );
    setShowStudentDropdown(false);
    setSelectedPendingFees([]);
    setLateFees({});
  };

  const handleSearchChange = (value: string) => {
    setStudentSearch(value);
    setSelectedStudent("");
    setShowStudentDropdown(value.length > 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
            Pending
          </Badge>
        );
    }
  };

  const submitFeePayment = async () => {
    if (!selectedStudent || selectedPendingFees.length === 0) {
      toast.error(
        "Please select a student and at least one fee challan to process payment."
      );
      return;
    }

    try {
      // Get selected fees for WhatsApp message
      const selectedFees = pendingFees.filter((fee) =>
        selectedPendingFees.includes(fee.id)
      );

      // Check if any fees have late fees that need to be updated first
      const feesWithLateFees = selectedPendingFees.filter(
        (feeId) => lateFees[feeId] && lateFees[feeId] > 0
      );

      // Update late fees if any exist
      if (feesWithLateFees.length > 0) {
        for (const feeId of feesWithLateFees) {
          const fee = challans.find((c) => c.id === feeId);
          if (!fee) continue;

          const lateFee = lateFees[feeId];
          await axios.put(
            `${BACKEND}/api/fees/${feeId}`,
            {
              ...fee,
              miscFee: fee.miscFee + lateFee,
            },
            { withCredentials: true }
          );
        }
      }

      // Update all selected fees to "paid" status using bulk update
      const updateResponse = await axios.patch(
        `${BACKEND}/api/fees/bulk-update`,
        {
          feeIds: selectedPendingFees,
          status: "paid",
        },
        { withCredentials: true }
      );

      if (updateResponse.status === 200) {
        // Refresh the fees list
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

        // Send WhatsApp confirmation message
        await sendPaymentConfirmation(selectedFees, lateFees);

        // Reset form
        setSelectedPendingFees([]);
        setSelectedStudent("");
        setStudentSearch("");
        setLateFees({});

        const message =
          totalLateFees > 0
            ? `Payment successfully recorded! Total amount: Rs. ${totalPaid} (including Rs. ${totalLateFees} late fees)`
            : `Payment successfully recorded! Total amount: Rs. ${totalPaid}`;

        toast.success(message);
      } else {
        throw new Error("Failed to update payment status");
      }
    } catch (error) {
      console.error("Error submitting fee payment:", error);
      toast.error("Failed to submit fee payment. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-none">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Submit Fee Payment</CardTitle>
        <CardDescription className="text-sm">
          Submit payment for generated fee challans
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Student Search Section */}
          <div className="space-y-2 relative">
            <Label htmlFor="student" className="text-sm font-medium">
              Search Student
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="student"
                placeholder="Type student name or ID..."
                value={studentSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowStudentDropdown(studentSearch.length > 0)}
                className="pl-10 h-10 sm:h-11"
              />
            </div>
            {showStudentDropdown && filteredStudents.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredStudents.slice(0, 10).map((student) => (
                  <div
                    key={student._id}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-start space-x-3">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {student.studentName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
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

          {/* Selected Student Fee Challans */}
          {selectedStudent && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3 sm:p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-3 flex flex-wrap items-center gap-2 text-sm sm:text-base">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="break-words">
                    Generated Fee Challans for This Student
                  </span>
                </h3>

                {pendingFees.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium text-sm sm:text-base">
                      No Generated Fee Challans Found
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 px-2">
                      Please generate fee challans first in the "Generate Fee
                      Challans" tab
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingFees.map((fee) => (
                      <div
                        key={fee.id}
                        className="bg-white border rounded-lg p-3 sm:p-4 shadow-sm"
                      >
                        {/* Fee Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id={`pending-${fee.id}`}
                              checked={selectedPendingFees.includes(fee.id)}
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
                              className="mt-1 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-base sm:text-lg flex flex-wrap items-center gap-2">
                                <span className="break-words">
                                  {fee.month} {fee.year}
                                </span>
                                {fee.status === "overdue" && (
                                  <Badge className="bg-red-100 text-red-800 text-xs flex-shrink-0">
                                    Overdue
                                  </Badge>
                                )}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-500">
                                Due Date: {fee.dueDate}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            {getStatusBadge(fee.status)}
                            <div className="text-base sm:text-lg font-bold text-green-600">
                              Rs.{" "}
                              {fee.remainingBalance + (lateFees[fee.id] || 0)}
                            </div>
                            {lateFees[fee.id] > 0 && (
                              <span className="text-xs text-red-600">
                                (+ Rs. {lateFees[fee.id]} late fee)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Fee Breakdown */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-600 truncate">
                              Tuition Fee
                            </div>
                            <div className="font-semibold">
                              Rs. {fee.tutionFee}
                            </div>
                          </div>

                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-600 truncate">
                              Exam Fee
                            </div>
                            <div className="font-semibold">
                              Rs. {fee.examFee}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-600 truncate">
                              Misc Fee
                            </div>
                            <div className="font-semibold">
                              Rs. {fee.miscFee}
                            </div>
                          </div>
                        </div>

                        {/* Additional Fee Information */}
                        {(fee.arrears > 0 || fee.discount > 0) && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-3 text-xs sm:text-sm">
                              {fee.arrears > 0 && (
                                <div className="space-y-2">
                                  <div className="bg-red-50 p-2 sm:p-3 rounded border border-red-200">
                                    <div className="font-medium text-red-700">
                                      Previous Arrears
                                    </div>
                                    <div className="font-semibold text-red-800">
                                      Rs. {fee.arrears}
                                    </div>
                                  </div>
                                  <div className="bg-blue-50 p-2 sm:p-3 rounded border border-blue-200">
                                    <div className="text-xs text-blue-700 leading-relaxed">
                                      <strong>Note:</strong> This shows
                                      individual month fees. Previous unpaid
                                      amounts are shown as separate entries
                                      below.
                                    </div>
                                  </div>
                                </div>
                              )}
                              {fee.discount > 0 && (
                                <div className="bg-green-50 p-2 sm:p-3 rounded border border-green-200">
                                  <div className="font-medium text-green-700">
                                    Discount Applied
                                  </div>
                                  <div className="font-semibold text-green-800">
                                    Rs. {fee.discount}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Late Fee Input for Overdue Fees */}
                        {fee.status === "overdue" && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <span className="font-medium text-red-800 text-sm">
                                  Overdue Fee - Add Late Fee
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <Label
                                htmlFor={`lateFee-${fee.id}`}
                                className="text-sm flex-shrink-0"
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
                                className="w-full sm:w-24 h-8"
                                placeholder="0"
                              />
                              <span className="text-xs text-red-600">
                                Will be added to misc fee
                              </span>
                            </div>
                            <p className="text-xs text-red-600 mt-2 leading-relaxed">
                              Due date was {fee.dueDate}. This fee is{" "}
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
                      <p className="text-xs sm:text-sm text-yellow-800 leading-relaxed">
                        <strong>Note:</strong> Select the challans above that
                        you want to mark as paid. You can select multiple months
                        at once.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              {selectedPendingFees.length > 0 && (
                <div className="border rounded-lg p-3 sm:p-4 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                    Payment Summary
                  </h3>

                  <div className="space-y-2">
                    {pendingFees
                      .filter((fee) => selectedPendingFees.includes(fee.id))
                      .map((fee) => (
                        <div
                          key={fee.id}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-3 rounded gap-2"
                        >
                          <div className="text-xs sm:text-sm">
                            <span className="font-medium">
                              {fee.month} {fee.year}
                            </span>
                            {fee.discount > 0 && (
                              <span className="text-green-600 ml-1 block sm:inline">
                                (- Rs. {fee.discount} discount)
                              </span>
                            )}
                            {lateFees[fee.id] > 0 && (
                              <span className="text-red-600 ml-1 block sm:inline">
                                (+ Rs. {lateFees[fee.id]} late fee)
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-sm sm:text-base">
                            Rs. {fee.remainingBalance + (lateFees[fee.id] || 0)}
                          </span>
                        </div>
                      ))}

                    <div className="border-t pt-3 mt-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="font-bold text-base sm:text-lg">
                          Total Amount:
                        </span>
                        <span className="font-bold text-base sm:text-lg text-green-600">
                          Rs.{" "}
                          {pendingFees
                            .filter((fee) =>
                              selectedPendingFees.includes(fee.id)
                            )
                            .reduce(
                              (sum, fee) =>
                                sum +
                                fee.remainingBalance +
                                (lateFees[fee.id] || 0),
                              0
                            )}
                        </span>
                      </div>
                      {Object.values(lateFees).some((fee) => fee > 0) && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-red-600 mt-1 gap-1">
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

              {/* Partial Payment Section */}
              {selectedPendingFees.length > 0 && (
                <div className="border rounded-lg p-3 sm:p-4 bg-orange-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-orange-800 flex items-center gap-2 text-sm sm:text-base">
                      <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                      Payment Options
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={partialPaymentMode ? "outline" : "default"}
                        onClick={() => {
                          setPartialPaymentMode(false);
                          setPartialAmount("");
                          setPaymentSummary(null);
                        }}
                      >
                        Full Payment
                      </Button>
                      <Button
                        size="sm"
                        variant={partialPaymentMode ? "default" : "outline"}
                        onClick={() => setPartialPaymentMode(true)}
                      >
                        Partial Payment
                      </Button>
                    </div>
                  </div>

                  {partialPaymentMode && (
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded border">
                        <Label
                          htmlFor="partialAmount"
                          className="text-sm font-medium"
                        >
                          Enter Partial Payment Amount
                        </Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2 text-sm text-gray-500">
                              Rs.
                            </span>
                            <Input
                              id="partialAmount"
                              type="number"
                              min="1"
                              max={selectedPendingFees.reduce(
                                (total: number, feeId: string) => {
                                  const fee = pendingFees.find(
                                    (f: FeeChallan) => f.id === feeId
                                  );
                                  if (!fee) return total;
                                  const currentBalance: number =
                                    fee.remainingBalance || fee.totalAmount;
                                  const lateFee: number = lateFees[feeId] || 0;
                                  return total + currentBalance + lateFee;
                                },
                                0
                              )}
                              value={partialAmount}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                const value: string = e.target.value;
                                setPartialAmount(value);
                                if (value && parseFloat(value) > 0) {
                                  const summary: PaymentSummary | null =
                                    simulatePartialPayment(value);
                                  setPaymentSummary(summary);
                                } else {
                                  setPaymentSummary(null);
                                }
                              }}
                              placeholder="Enter amount"
                              className="pl-8"
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            Max: Rs.{" "}
                            {selectedPendingFees
                              .reduce((total: number, feeId: string) => {
                                const fee = pendingFees.find(
                                  (f: FeeChallan) => f.id === feeId
                                );
                                if (!fee) return total;
                                const currentBalance: number =
                                  fee.remainingBalance || fee.totalAmount;
                                const lateFee: number = lateFees[feeId] || 0;
                                return total + currentBalance + lateFee;
                              }, 0)
                              .toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Partial Payment Preview */}
                      {paymentSummary && (
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Payment Allocation Preview
                          </h4>
                          <div className="space-y-2">
                            {paymentSummary.breakdown.map(
                              (item: PaymentBreakdown, index: number) => (
                                <div
                                  key={index}
                                  className="text-xs bg-gray-50 p-2 rounded"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                      {item.month} {item.year}
                                    </span>
                                    <Badge
                                      className={
                                        item.status === "paid"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-blue-100 text-blue-800"
                                      }
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      Balance: Rs.{" "}
                                      {item.currentBalance.toLocaleString()}
                                    </div>
                                    <div>
                                      Payment: Rs.{" "}
                                      {item.paymentAmount.toLocaleString()}
                                    </div>
                                    <div>
                                      Late Fee: Rs.{" "}
                                      {item.lateFee.toLocaleString()}
                                    </div>
                                    <div className="font-medium">
                                      Remaining: Rs.{" "}
                                      {item.newBalance.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                          <div className="mt-3 p-2 bg-green-50 rounded border-l-4 border-green-400">
                            <div className="text-sm font-medium text-green-800">
                              Total Payment: Rs.{" "}
                              {paymentSummary.totalPaid.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Partial Payment Submit Button */}
                      <Button
                        onClick={submitPartialPayment}
                        className="w-full h-12"
                        disabled={
                          !partialAmount || parseFloat(partialAmount) <= 0
                        }
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Submit Partial Payment - Rs.{" "}
                        {partialAmount
                          ? parseFloat(partialAmount).toLocaleString()
                          : "0"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Submit and Print Buttons */}
              <div className="space-y-3">
                {/* Mobile View - Stacked buttons */}
                <div className="flex flex-col gap-3 md:hidden">
                  <Button
                    onClick={submitFeePayment}
                    className="w-full h-12 text-sm"
                    size="lg"
                    disabled={selectedPendingFees.length === 0}
                  >
                    <Receipt className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="flex-1 truncate">
                      Submit Payment ({selectedPendingFees.length})
                    </span>
                    {selectedPendingFees.length > 0 && (
                      <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded text-xs font-bold flex-shrink-0">
                        Rs.{" "}
                        {pendingFees
                          .filter((fee) => selectedPendingFees.includes(fee.id))
                          .reduce(
                            (sum, fee) =>
                              sum +
                              fee.remainingBalance +
                              (lateFees[fee.id] || 0),
                            0
                          )
                          .toLocaleString()}
                      </span>
                    )}
                  </Button>
                  <Button
                    onClick={() => printPaymentReceipt("termal")}
                    variant="outline"
                    className="w-full h-12 text-sm"
                    size="lg"
                    disabled={selectedPendingFees.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print Thermal
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => printPaymentReceipt("regular")}
                      variant="outline"
                      className="h-12 text-sm"
                      size="lg"
                      disabled={selectedPendingFees.length === 0}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Print
                    </Button>

                    <Button
                      onClick={() => {
                        const selectedFees = pendingFees.filter((fee) =>
                          selectedPendingFees.includes(fee.id)
                        );
                        sendPaymentConfirmation(selectedFees, lateFees);
                      }}
                      variant="outline"
                      className="h-12 text-sm bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                      size="lg"
                      disabled={selectedPendingFees.length === 0}
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      WhatsApp
                    </Button>
                  </div>
                </div>

                {/* Tablet View - 2 rows */}
                <div className="hidden md:flex lg:flex flex-col gap-3">
                  <div className="lg:flex gap-3">
                    <Button
                      onClick={submitFeePayment}
                      className=" flex-1 h-11 text-sm md:mb-2 md:w-full"
                      size="lg"
                      disabled={selectedPendingFees.length === 0}
                    >
                      <Receipt className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="flex-1 truncate">
                        Submit Payment for {selectedPendingFees.length}{" "}
                        Challan(s)
                      </span>
                      {selectedPendingFees.length > 0 && (
                        <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded text-sm font-bold flex-shrink-0">
                          Rs.{" "}
                          {pendingFees
                            .filter((fee) =>
                              selectedPendingFees.includes(fee.id)
                            )
                            .reduce(
                              (sum, fee) =>
                                sum +
                                fee.remainingBalance +
                                (lateFees[fee.id] || 0),
                              0
                            )
                            .toLocaleString()}
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={() => printPaymentReceipt("termal")}
                      variant="outline"
                      className="flex-1 h-11 md:w-full text-sm"
                      size="lg"
                      disabled={selectedPendingFees.length === 0}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Print Thermal Receipt
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => printPaymentReceipt("regular")}
                      variant="outline"
                      className="flex-1 h-11 text-sm"
                      size="lg"
                      disabled={selectedPendingFees.length === 0}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Print Receipt
                    </Button>

                    <Button
                      onClick={() => {
                        const selectedFees = pendingFees.filter((fee) =>
                          selectedPendingFees.includes(fee.id)
                        );
                        sendPaymentConfirmation(selectedFees, lateFees);
                      }}
                      variant="outline"
                      className="flex-1 h-11 text-sm bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                      size="lg"
                      disabled={selectedPendingFees.length === 0}
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      Send WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Student Selected State */}
          {!selectedStudent && (
            <div className="text-center py-8 sm:py-12">
              <User className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">
                Select a Student
              </h3>
              <p className="text-sm text-gray-500 px-4">
                Search and select a student above to view their generated fee
                challans
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
