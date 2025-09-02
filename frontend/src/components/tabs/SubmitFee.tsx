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
import { Receipt, Search, User, FileText, AlertTriangle } from "lucide-react";
import { Checkbox } from "../ui/checkbox";

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
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const submitFeePayment = async () => {
    if (!selectedStudent || selectedPendingFees.length === 0) {
      alert(
        "Please select a student and at least one fee challan to process payment."
      );
      return;
    }

    try {
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
      alert("Failed to submit fee payment. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Fee Payment</CardTitle>
        <CardDescription>
          Submit payment for generated fee challans
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2 relative">
            <Label htmlFor="student">Search Student</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="student"
                placeholder="Type student name or ID..."
                value={studentSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowStudentDropdown(studentSearch.length > 0)}
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
                      Please generate fee challans first in the "Generate Fee
                      Challans" tab
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
                              {fee.tutionFee +
                                fee.examFee +
                                fee.miscFee -
                                fee.discount +
                                (lateFees[fee.id] || 0)}
                              {lateFees[fee.id] > 0 && (
                                <span className="text-sm text-red-600 block">
                                  (+ Rs. {lateFees[fee.id]} late fee)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Fee Breakdown */}
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

                        {/* Additional Fee Information */}
                        {(fee.arrears > 0 || fee.discount > 0) && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {fee.arrears > 0 && (
                                <div className="grid grid-cols-1 gap-3 text-sm">
                                  <div className="bg-red-50 p-2 rounded border border-red-200">
                                    <div className="font-medium text-red-700">
                                      Previous Arrears
                                    </div>
                                    <div className="font-semibold text-red-800">
                                      Rs. {fee.arrears}
                                    </div>
                                  </div>
                                  {/* Note about arrears */}
                                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <div className="text-xs text-blue-700">
                                      <strong>Note:</strong> This shows
                                      individual month fees. Previous unpaid
                                      amounts are shown as separate entries
                                      below.
                                    </div>
                                  </div>
                                </div>
                              )}
                              {fee.discount > 0 && (
                                <div className="bg-green-50 p-2 rounded border border-green-200">
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
                      <p className="text-sm text-yellow-800">
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
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Payment Summary
                  </h3>

                  <div className="space-y-2">
                    {pendingFees
                      .filter((fee) => selectedPendingFees.includes(fee.id))
                      .map((fee) => (
                        <div
                          key={fee.id}
                          className="flex justify-between items-center bg-white p-2 rounded"
                        >
                          <span className="text-sm">
                            {fee.month} {fee.year}
                            {fee.discount > 0 && (
                              <span className="text-green-600 ml-1">
                                (- Rs. {fee.discount} discount)
                              </span>
                            )}
                            {lateFees[fee.id] > 0 && (
                              <span className="text-red-600 ml-1">
                                (+ Rs. {lateFees[fee.id]} late fee)
                              </span>
                            )}
                          </span>
                          <span className="font-semibold">
                            Rs.{" "}
                            {fee.tutionFee +
                              fee.examFee +
                              fee.miscFee -
                              fee.discount +
                              (lateFees[fee.id] || 0)}
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
                                (fee.tutionFee +
                                  fee.examFee +
                                  fee.miscFee -
                                  fee.discount) +
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
                      .filter((fee) => selectedPendingFees.includes(fee.id))
                      .reduce(
                        (sum, fee) =>
                          sum +
                          (fee.tutionFee +
                            fee.examFee +
                            fee.miscFee -
                            fee.discount) +
                          (lateFees[fee.id] || 0),
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
