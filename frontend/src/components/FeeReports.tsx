"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import axios from "axios";

// Import tab components
import ClassReports from "./tabs/ClassReports";
import DailyReports from "./tabs/DailyReports";
import StudentReport from "./tabs/StudentReport";
import SummaryReports from "./tabs/SummaryReports";

export interface Student {
  _id: string;
  studentName: string;
  fatherName: string;
  class: string;
  section: string;
  rollNumber: string;
}

export interface ReportRecord {
  _id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  class: string;
  section: string;
  rollNumber: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  lastPayment: string;
  status: string;
}

export interface StudentReportData {
  student: Student;
  summary: {
    totalFee: number;
    paidAmount: number;
    pendingAmount: number;
    totalRecords: number;
    paidRecords: number;
    pendingRecords: number;
  };
  paymentHistory: {
    month: string;
    year: number;
    amount: number;
    dueDate: string;
    paidDate: string;
    status: string;
    challanId: string;
  }[];
}

export interface SummaryData {
  summary: {
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    totalStudents: number;
    paidStudents: number;
    collectionPercentage: number;
  };
  monthlyBreakdown: {
    month: string;
    year: number;
    expected: number;
    collected: number;
    pending: number;
    collectionPercentage: number;
  }[];
}

export interface DailyReportData {
  date: string;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalTransactions: number;
  students: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    class: string;
    section: string;
    amount: number;
    challanId: string;
    paymentTime: string;
  }[];
}

const BACKEND = import.meta.env.VITE_BACKEND;

interface FeeReportProps {
  students: Student[];
}

export default function FeeReports({ students }: FeeReportProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Load summary data on component mount
  useEffect(() => {
    loadSummaryReport();
  }, []);

  const loadSummaryReport = async () => {
    try {
      const response = await axios.get(`${BACKEND}/api/fees/reports/summary`, {
        withCredentials: true,
      });
      setSummaryData(response.data.data);
    } catch (error) {
      console.error("Error loading summary report:", error);
      toast.error("Failed to load summary report");
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Reports</h2>
          <p className="text-muted-foreground">
            Generate comprehensive fee payment reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="class-reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="class-reports">Class Reports</TabsTrigger>
          <TabsTrigger value="daily-reports">Daily Reports</TabsTrigger>
          <TabsTrigger value="student-report">Individual Student</TabsTrigger>
          <TabsTrigger value="summary">Summary Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="class-reports" className="space-y-4">
          <ClassReports />
        </TabsContent>

        <TabsContent value="daily-reports" className="space-y-4">
          <DailyReports />
        </TabsContent>

        <TabsContent value="student-report" className="space-y-4">
          <StudentReport students={students} />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <SummaryReports summaryData={summaryData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
