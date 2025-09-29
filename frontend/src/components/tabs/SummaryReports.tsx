"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Calendar, Users, DollarSign, TrendingUp, Loader2 } from "lucide-react";

interface SummaryData {
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

interface SummaryReportsProps {
  summaryData: SummaryData | null;
}

export default function SummaryReports({ summaryData }: SummaryReportsProps) {
  if (!summaryData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading summary...</span>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  Rs. {summaryData.summary.totalCollected.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  Rs. {summaryData.summary.totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Students Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summaryData.summary.paidStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summaryData.summary.collectionPercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Collection Summary</CardTitle>
          <CardDescription>Fee collection overview by month</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Collection %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryData.monthlyBreakdown.map((record, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{record.month}</TableCell>
                  <TableCell>{record.year}</TableCell>
                  <TableCell>Rs. {record.expected.toLocaleString()}</TableCell>
                  <TableCell>Rs. {record.collected.toLocaleString()}</TableCell>
                  <TableCell>Rs. {record.pending.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.collectionPercentage >= 80
                          ? "default"
                          : "destructive"
                      }
                    >
                      {record.collectionPercentage}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {summaryData.monthlyBreakdown.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
