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
import { Receipt, Search, Download, MessageCircle, User } from "lucide-react";
import { Textarea } from "./ui/textarea";

const BACKEND = import.meta.env.VITE_BACKEND;

interface Student {
  _id: string;
  studentName: string;
  fatherName: string;
  fatherCnic: string;
  bform: string;
  dateOfBirth: string;
  phoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
}

interface FeeChallan {
  id: string;
  studentId: {
    _id: string;
    studentName: string;
    fatherName: string;
    phoneNumber: string;
  };
  month: string;
  year: string;
  tuitionFee: number;
  paperFund: number;
  examFee: number;
  miscFee: number;
  totalAmount: number; // you can compute on frontend or backend
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
    tuitionFee: 0,
    paperFund: 0,
    examFee: 0,
    miscFee: 0,
    dueDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student._id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  useEffect(() => {
    const fetchFee = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/fees`, {
          withCredentials: true,
        });
        console.log(res.data.data);
        setChallans(res.data.data);
      } catch (error) {
        // Handle error if needed
        console.error("Error fetching fees:", error);
      }
    };
    fetchFee();
  }, []);

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

  const submitFeePayment = () => {
    if (!selectedStudent) return;

    const student = students.find((s) => s._id === selectedStudent);
    if (!student) return;

    const totalAmount =
      feeData.tuitionFee +
      feeData.paperFund +
      feeData.examFee +
      feeData.miscFee;

    const newChallan: FeeChallan = {
      id: Date.now().toString(),
      studentId: {
        _id: student._id,
        studentName: student.studentName,
        fatherName: student.fatherName,
        phoneNumber: student.phoneNumber,
      },
      month: feeData.month,
      year: feeData.year,
      tuitionFee: feeData.tuitionFee,
      paperFund: feeData.paperFund,
      examFee: feeData.examFee,
      miscFee: feeData.miscFee,
      totalAmount,
      dueDate: feeData.dueDate,
      status: "paid",
      generatedDate: new Date().toISOString().split("T")[0],
      sentToWhatsApp: false,
    };

    setChallans([...challans, newChallan]);

    setSelectedStudent("");
    setStudentSearch("");
    setFeeData({
      month: "",
      year: new Date().getFullYear().toString(),
      tuitionFee: 0,
      paperFund: 0,
      examFee: 0,
      miscFee: 0,
      dueDate: "",
    });
  };

  const sendFeeReminder = async (challan: FeeChallan) => {
    let phoneNumber = challan.studentId.phoneNumber.replace(/[\s-]/g, "");
    if (!phoneNumber.startsWith("92")) {
      phoneNumber = "92" + phoneNumber.substring(1);
    }

    // Calculate due date if undefined
    let dueDate = challan.dueDate;
    if (!dueDate) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      // If challan month/year is current, set due date to 10th of current month
      if (
        challan.month &&
        challan.year &&
        new Date(`${challan.month} 1, ${challan.year}`).getMonth() ===
          currentMonth &&
        Number(challan.year) === currentYear
      ) {
        dueDate = `${currentYear}-${String(currentMonth + 1).padStart(
          2,
          "0"
        )}-10`;
      } else {
        // Otherwise, set due date to tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        dueDate = tomorrow.toISOString().split("T")[0];
      }
    }

    const message =
      whatsappMessage ||
      `
  *Fee Reminder - Falcon Portal*

  Dear ${challan.studentId.fatherName},

  This is a reminder for ${challan.studentId.studentName}'s fee:

  *Month:* ${challan.month} ${challan.year}
  *Tuition Fee:* Rs. ${Number(challan.tuitionFee) || 0}
  *Paper Fund:* Rs. ${Number(challan.paperFund) || 0}
  *Exam Fee:* Rs. ${Number(challan.examFee) || 0}
  *Miscellaneous Fee:* Rs. ${Number(challan.miscFee) || 0}

  *Total Amount:* Rs. ${
    (Number(challan.examFee) || 0) +
    (Number(challan.miscFee) || 0) +
    (Number(challan.tuitionFee) || 0) +
    (Number(challan.paperFund) || 0)
  }
  *Due Date:* ${dueDate}

  ${
    challan.status === "paid"
      ? "Thank you for your payment!"
      : "Please pay before the due date to avoid late fees."
  }

  Best regards,
  Falcon Portal Administration
    `.trim();

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");

    setChallans(
      challans.map((c) =>
        c.id === challan.id ? { ...c, sentToWhatsApp: true } : c
      )
    );
  };

  const filteredChallans = challans.filter(
    (challan) =>
      challan.studentId.studentName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      challan.studentId.fatherName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      challan.month.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
        <p className="text-muted-foreground">
          Submit fee payments and send notifications to parents via WhatsApp
        </p>
      </div>

      <Tabs defaultValue="submit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submit">Submit Fee Payment</TabsTrigger>
          <TabsTrigger value="list">View Fee Records</TabsTrigger>
          <TabsTrigger value="settings">WhatsApp Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Submit Fee Payment</CardTitle>
              <CardDescription>
                Record a fee payment for a student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  {student._id}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredStudents.length > 10 && (
                          <div className="px-4 py-2 text-xs text-gray-500 text-center border-t">
                            Showing first 10 results. Type more to narrow down.
                          </div>
                        )}
                      </div>
                    )}
                    {showStudentDropdown &&
                      studentSearch.length > 0 &&
                      filteredStudents.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="px-4 py-2 text-sm text-gray-500 text-center">
                            No students found matching "{studentSearch}"
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select
                      value={feeData.month}
                      onValueChange={(value) =>
                        setFeeData({ ...feeData, month: value })
                      }
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
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={feeData.year}
                      onChange={(e) =>
                        setFeeData({ ...feeData, year: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={feeData.dueDate}
                      onChange={(e) =>
                        setFeeData({ ...feeData, dueDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tuitionFee">Tuition Fee (Rs.)</Label>
                    <Input
                      id="tuitionFee"
                      type="number"
                      value={feeData.tuitionFee}
                      onChange={(e) =>
                        setFeeData({
                          ...feeData,
                          tuitionFee: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paperFund">Paper Fund (Rs.)</Label>
                    <Input
                      id="paperFund"
                      type="number"
                      value={feeData.paperFund}
                      onChange={(e) =>
                        setFeeData({
                          ...feeData,
                          paperFund: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="examFee">Exam Fee (Rs.)</Label>
                    <Input
                      id="examFee"
                      type="number"
                      value={feeData.examFee}
                      onChange={(e) =>
                        setFeeData({
                          ...feeData,
                          examFee: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="miscFee">Miscellaneous Fee (Rs.)</Label>
                    <Input
                      id="miscFee"
                      type="number"
                      value={feeData.miscFee}
                      onChange={(e) =>
                        setFeeData({
                          ...feeData,
                          miscFee: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <div className="text-lg font-semibold">
                    Total Amount: Rs.{" "}
                    {feeData.tuitionFee +
                      feeData.paperFund +
                      feeData.examFee +
                      feeData.miscFee}
                  </div>
                </div>

                <Button
                  onClick={submitFeePayment}
                  className="w-full"
                  disabled={!selectedStudent || !feeData.month}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Submit Fee Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Fee Records ({challans.length})</CardTitle>
              <CardDescription>
                View and manage all fee payment records
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fee records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Father</TableHead>
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
                          colSpan={8}
                          className="text-center text-muted-foreground"
                        >
                          No fee records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredChallans.map((challan) => (
                        <TableRow key={challan.id}>
                          <TableCell className="font-medium">
                            {challan.studentId.studentName}
                          </TableCell>
                          <TableCell>{challan.studentId.fatherName}</TableCell>
                          <TableCell>
                            {challan.month} {challan.year}
                          </TableCell>
                          <TableCell>
                            Rs.{" "}
                            {(Number(challan.examFee) || 0) +
                              (Number(challan.miscFee) || 0) +
                              (Number(challan.tuitionFee) || 0) +
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
                              <Button size="sm" variant="outline">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
