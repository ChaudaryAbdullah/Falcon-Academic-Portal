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
      toast.error(
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

          toast.success(message);
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

      toast.error(errorMessage);
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
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl lg:text-2xl">
          Submit Paper Fund Payment
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Submit payment for generated paper fund challans
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 relative">
            <Label
              htmlFor="student"
              className="text-sm sm:text-base font-medium"
            >
              Search Student
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="student"
                placeholder="Type student name, roll number, or father name..."
                value={studentSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowStudentDropdown(studentSearch.length > 0)}
                className="pl-10 text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
            {showStudentDropdown && filteredStudents.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredStudents.slice(0, 10).map((student) => (
                  <div
                    key={student._id}
                    className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">
                          {student.studentName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">
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
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500 text-sm sm:text-base">
                No students found
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="space-y-4 sm:space-y-6">
              <div className="border rounded-lg p-3 sm:p-4 lg:p-6 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  Generated Paper Fund Challans for This Student
                </h3>

                {pendingPaperFunds.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 lg:py-12">
                    <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-600 font-medium text-sm sm:text-base lg:text-lg">
                      No Generated Paper Fund Challans Found
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-1 px-4">
                      Please generate paper fund challans first in the "Generate
                      Paper Fund Challans" tab
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {pendingPaperFunds.map((fund) => (
                      <div
                        key={fund.id}
                        className="bg-white border rounded-lg p-3 sm:p-4 lg:p-5 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3">
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
                              className="mt-1 sm:mt-0 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-base sm:text-lg flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span>Academic Year {fund.year}</span>
                                {fund.status === "overdue" && (
                                  <Badge className="bg-red-100 text-red-800 text-xs self-start sm:self-center">
                                    Overdue
                                  </Badge>
                                )}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                Due Date: {fund.dueDate}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="mb-2">
                              {getStatusBadge(fund.status)}
                            </div>
                            <div className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
                              Rs. {fund.paperFund + (lateFees[fund.id] || 0)}
                              {lateFees[fund.id] > 0 && (
                                <span className="text-xs sm:text-sm text-red-600 block mt-1">
                                  (+ Rs. {lateFees[fund.id]} late fee)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Paper Fund Details */}
                        <div className="bg-gray-50 p-2 sm:p-3 rounded mb-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 text-sm sm:text-base">
                              Paper Fund
                            </span>
                            <span className="font-semibold text-sm sm:text-base">
                              Rs. {fund.paperFund}
                            </span>
                          </div>
                        </div>

                        {/* Late Fee Input for Overdue Paper Funds */}
                        {fund.status === "overdue" && (
                          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-2 sm:gap-0">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <span className="font-medium text-red-800 text-sm sm:text-base">
                                  Overdue Payment - Add Late Fee
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <Label
                                htmlFor={`lateFee-${fund.id}`}
                                className="text-xs sm:text-sm flex-shrink-0"
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
                                className="w-20 sm:w-24 h-8 sm:h-9 text-sm"
                                placeholder="0"
                              />
                              <span className="text-xs text-red-600 flex-1">
                                Additional late fee
                              </span>
                            </div>
                            <p className="text-xs text-red-600 mt-2">
                              Due date was {fund.dueDate}. This payment is{" "}
                              {calculateDaysOverdue(fund.dueDate)} days overdue.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-yellow-800">
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
                <div className="border rounded-lg p-3 sm:p-4 lg:p-6 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    Payment Summary
                  </h3>

                  <div className="space-y-2 sm:space-y-3">
                    {pendingPaperFunds
                      .filter((fund) => selectedPendingFunds.includes(fund.id))
                      .map((fund) => (
                        <div
                          key={fund.id}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-2 sm:p-3 rounded gap-1 sm:gap-0"
                        >
                          <span className="text-xs sm:text-sm flex-1">
                            Academic Year {fund.year}
                            {lateFees[fund.id] > 0 && (
                              <span className="text-red-600 ml-1 block sm:inline">
                                (+ Rs. {lateFees[fund.id]} late fee)
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-sm sm:text-base self-start sm:self-center">
                            Rs. {fund.paperFund + (lateFees[fund.id] || 0)}
                          </span>
                        </div>
                      ))}

                    <div className="border-t pt-2 sm:pt-3 mt-3 sm:mt-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center font-bold text-base sm:text-lg lg:text-xl gap-1 sm:gap-0">
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
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-red-600 mt-1 gap-1 sm:gap-0">
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
                className="w-full h-11 sm:h-12 text-sm sm:text-base"
                size="lg"
                disabled={selectedPendingFunds.length === 0 || isSubmitting}
              >
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span className="flex-1 text-center">
                  {isSubmitting
                    ? "Processing..."
                    : `Submit Payment for ${selectedPendingFunds.length} Challan(s)`}
                </span>
                {selectedPendingFunds.length > 0 && !isSubmitting && (
                  <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded text-xs sm:text-sm font-bold flex-shrink-0">
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
            <div className="text-center py-8 sm:py-12 lg:py-16">
              <User className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-600 mb-2">
                Select a Student
              </h3>
              <p className="text-sm sm:text-base text-gray-500 px-4">
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
