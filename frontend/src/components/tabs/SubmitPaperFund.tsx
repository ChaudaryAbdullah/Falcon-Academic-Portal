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

interface SubmitPaperFundPaymentTabProps {
  students: Student[];
  challans: PaperFundChallan[];
  setChallans: (challans: PaperFundChallan[]) => void;
}

export function SubmitPaperFundPaymentTab({
  students,
  challans,
  setChallans,
}: SubmitPaperFundPaymentTabProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [pendingPaperFunds, setPendingPaperFunds] = useState<
    PaperFundChallan[]
  >([]);
  const [selectedPendingFunds, setSelectedPendingFunds] = useState<string[]>(
    []
  );
  const [lateFees, setLateFees] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const getPendingPaperFundsForStudent = (studentId: string) => {
    return challans.filter(
      (challan) =>
        challan.studentId._id === studentId &&
        (challan.status === "pending" || challan.status === "overdue")
    );
  };

  useEffect(() => {
    if (selectedStudent) {
      const pending = getPendingPaperFundsForStudent(selectedStudent);
      setPendingPaperFunds(pending);
      const initialLateFees: { [key: string]: number } = {};
      pending.forEach((fund) => {
        if (fund.status === "overdue") {
          initialLateFees[fund.id] = 0;
        }
      });
      setLateFees(initialLateFees);
    } else {
      setPendingPaperFunds([]);
      setLateFees({});
    }
  }, [selectedStudent, challans]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student._id);
    setStudentSearch(
      `${student.studentName} - ${student.fatherName} (Roll: ${student.rollNumber})`
    );
    setShowStudentDropdown(false);
    setSelectedPendingFunds([]);
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

  const submitPaperFundPayment = async () => {
    if (!selectedStudent || selectedPendingFunds.length === 0) {
      alert(
        "Please select a student and at least one paper fund challan to process payment."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if any funds have late fees that need to be updated first
      const fundsWithLateFees = selectedPendingFunds.filter(
        (fundId) => lateFees[fundId] && lateFees[fundId] > 0
      );

      // Update late fees if any exist (we could add this to backend if needed)
      if (fundsWithLateFees.length > 0) {
        for (const fundId of fundsWithLateFees) {
          const fund = challans.find((c) => c.id === fundId);
          if (!fund) continue;

          // const lateFee = lateFees[fundId];
          // For now, we'll just include late fees in the total calculation
          // In a real system, you might want to update the paperFund amount
          // await axios.put(`${BACKEND}/api/paperFund/${fundId}`, {
          //   ...fund,
          //   paperFund: fund.paperFund + lateFee,
          // }, { withCredentials: true });
        }
      }

      // Update all selected paper funds to "paid" status using bulk update
      const updateResponse = await axios.patch(
        `${BACKEND}/api/paperFund/bulk-update`,
        {
          ids: selectedPendingFunds,
          status: "paid",
        },
        { withCredentials: true }
      );

      if (updateResponse.status === 200) {
        // Refresh the paper funds list
        const fetchResponse = await axios.get(`${BACKEND}/api/paperFund`, {
          withCredentials: true,
        });

        if (fetchResponse.data.success) {
          setChallans(fetchResponse.data.data);

          // Calculate total amount paid including late fees
          const totalLateFees = Object.values(lateFees).reduce(
            (sum, fee) => sum + fee,
            0
          );

          const totalPaid = selectedPendingFunds.reduce((sum, fundId) => {
            const fund = challans.find((c) => c.id === fundId);
            const lateFee = lateFees[fundId] || 0;
            return sum + (fund ? fund.paperFund + lateFee : 0);
          }, 0);

          // Reset form
          setSelectedPendingFunds([]);
          setSelectedStudent("");
          setStudentSearch("");
          setLateFees({});

          const message =
            totalLateFees > 0
              ? `Payment successfully recorded! Total amount: Rs. ${totalPaid} (including Rs. ${totalLateFees} late fees)`
              : `Payment successfully recorded! Total amount: Rs. ${totalPaid}`;

          alert(message);
        }
      } else {
        throw new Error("Failed to update payment status");
      }
    } catch (error: any) {
      console.error("Error submitting paper fund payment:", error);

      let errorMessage =
        "Failed to submit paper fund payment. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Paper Fund Payment</CardTitle>
        <CardDescription>
          Submit payment for generated paper fund challans
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
                placeholder="Type student name, roll number, or father name..."
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
                          Father: {student.fatherName} | Roll:{" "}
                          {student.rollNumber} | Class: {student.class}
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

          {selectedStudent && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Paper Fund Challans for This Student
                </h3>

                {pendingPaperFunds.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">
                      No Generated Paper Fund Challans Found
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Please generate paper fund challans first in the "Generate
                      Paper Fund Challans" tab
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingPaperFunds.map((fund) => (
                      <div
                        key={fund.id}
                        className="bg-white border rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`pending-${fund.id}`}
                              checked={selectedPendingFunds.includes(fund.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPendingFunds([
                                    ...selectedPendingFunds,
                                    fund.id,
                                  ]);
                                } else {
                                  setSelectedPendingFunds(
                                    selectedPendingFunds.filter(
                                      (id) => id !== fund.id
                                    )
                                  );
                                }
                              }}
                            />
                            <div>
                              <h4 className="font-medium text-lg flex items-center gap-2">
                                Academic Year {fund.year}
                                {fund.status === "overdue" && (
                                  <Badge className="bg-red-100 text-red-800 text-xs">
                                    Overdue
                                  </Badge>
                                )}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Due Date: {fund.dueDate}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(fund.status)}
                            <div className="text-lg font-bold text-green-600 mt-1">
                              Rs. {fund.paperFund + (lateFees[fund.id] || 0)}
                              {lateFees[fund.id] > 0 && (
                                <span className="text-sm text-red-600 block">
                                  (+ Rs. {lateFees[fund.id]} late fee)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Paper Fund Details */}
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600">
                              Paper Fund
                            </span>
                            <span className="font-semibold">
                              Rs. {fund.paperFund}
                            </span>
                          </div>
                        </div>

                        {/* Late Fee Input for Overdue Paper Funds */}
                        {fund.status === "overdue" && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-800">
                                  Overdue Payment - Add Late Fee
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Label
                                htmlFor={`lateFee-${fund.id}`}
                                className="text-sm"
                              >
                                Late Fee Amount (Rs.)
                              </Label>
                              <Input
                                id={`lateFee-${fund.id}`}
                                type="number"
                                min="0"
                                step="10"
                                value={lateFees[fund.id] || 0}
                                onChange={(e) => {
                                  const value = Math.max(
                                    0,
                                    Number(e.target.value)
                                  );
                                  setLateFees((prev) => ({
                                    ...prev,
                                    [fund.id]: value,
                                  }));
                                }}
                                className="w-24 h-8"
                                placeholder="0"
                              />
                              <span className="text-xs text-red-600">
                                Additional late fee
                              </span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              Due date was {fund.dueDate}. This payment is{" "}
                              {calculateDaysOverdue(fund.dueDate)} days overdue.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Select the paper fund challans
                        above that you want to mark as paid. You can select
                        multiple years at once.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              {selectedPendingFunds.length > 0 && (
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Payment Summary
                  </h3>

                  <div className="space-y-2">
                    {pendingPaperFunds
                      .filter((fund) => selectedPendingFunds.includes(fund.id))
                      .map((fund) => (
                        <div
                          key={fund.id}
                          className="flex justify-between items-center bg-white p-2 rounded"
                        >
                          <span className="text-sm">
                            Academic Year {fund.year}
                            {lateFees[fund.id] > 0 && (
                              <span className="text-red-600 ml-1">
                                (+ Rs. {lateFees[fund.id]} late fee)
                              </span>
                            )}
                          </span>
                          <span className="font-semibold">
                            Rs. {fund.paperFund + (lateFees[fund.id] || 0)}
                          </span>
                        </div>
                      ))}

                    <div className="border-t pt-2 mt-3">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total Amount:</span>
                        <span className="text-green-600">
                          Rs.{" "}
                          {pendingPaperFunds
                            .filter((fund) =>
                              selectedPendingFunds.includes(fund.id)
                            )
                            .reduce(
                              (sum, fund) =>
                                sum + fund.paperFund + (lateFees[fund.id] || 0),
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
                onClick={submitPaperFundPayment}
                className="w-full"
                size="lg"
                disabled={selectedPendingFunds.length === 0 || isSubmitting}
              >
                <Receipt className="h-5 w-5 mr-2" />
                {isSubmitting
                  ? "Processing..."
                  : `Submit Payment for ${selectedPendingFunds.length} Challan(s)`}
                {selectedPendingFunds.length > 0 && !isSubmitting && (
                  <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded text-sm font-bold">
                    Rs.{" "}
                    {pendingPaperFunds
                      .filter((fund) => selectedPendingFunds.includes(fund.id))
                      .reduce(
                        (sum, fund) =>
                          sum + fund.paperFund + (lateFees[fund.id] || 0),
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
                Search and select a student above to view their generated paper
                fund challans
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
