import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  Trophy,
  TrendingUp,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND = import.meta.env.VITE_BACKEND;

const classes = [
  { value: "Play", label: "Play" },
  { value: "Nursery", label: "Nursery" },
  { value: "Prep", label: "Prep" },
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
];

const sections = [
  { value: "Red", label: "Red" },
  { value: "Blue", label: "Blue" },
  { value: "Pink", label: "Pink" },
  { value: "Green", label: "Green" },
  { value: "Yellow", label: "Yellow" },
  { value: "White", label: "White" },
  { value: "Purple", label: "Purple" },
];

interface ClassStats {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  averageObtained: number;
  averagePercentage: number;
  class: string;
  highestPercentage: number;
  lowestPercentage: number;
  passPercentage: number;
  pendingStudents: number;
  section: string;
  totalMarks: number;
}

interface Exam {
  _id: string;
  examName: string;
  examType: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  classes: string[];
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  isActive: boolean;
}

interface ReportsTabProps {
  exams: Exam[];
  performanceData: any[];
  setPerformanceData: React.Dispatch<React.SetStateAction<any[]>>;
  classStats: ClassStats | null;
  setClassStats: React.Dispatch<React.SetStateAction<ClassStats | null>>;
  topPerformers: any[];
  setTopPerformers: React.Dispatch<React.SetStateAction<any[]>>;
}

export function ReportsTab({
  exams,
  performanceData,
  setPerformanceData,
  classStats,
  setClassStats,
  topPerformers,
  setTopPerformers,
}: ReportsTabProps) {
  const [loading, setLoading] = React.useState(false);
  const [selectedExam, setSelectedExam] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("all");
  const [selectedSection, setSelectedSection] = React.useState("all");

  const loadReports = async () => {
    if (!selectedExam) {
      toast.error("Please select an exam");
      return;
    }

    try {
      setLoading(true);

      const params = {
        examId: selectedExam,
        ...(selectedClass &&
          selectedClass !== "all" && { class: selectedClass }),
        ...(selectedSection &&
          selectedSection !== "all" && { section: selectedSection }),
      };

      const [perfResponse, classResponse, topResponse] = await Promise.all([
        axios.get(`${BACKEND}/api/results/subject-performance`, {
          params,
          withCredentials: true,
        }),
        axios.get(`${BACKEND}/api/results/class-performance`, {
          params,
          withCredentials: true,
        }),
        axios.get(`${BACKEND}/api/results/top-performers`, {
          params: { ...params, limit: 10 },
          withCredentials: true,
        }),
      ]);

      setPerformanceData(perfResponse.data.data || []);
      setClassStats(classResponse.data.data?.[0] || null);
      setTopPerformers(topResponse.data.data || []);

      toast.success("Reports loaded successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Select Exam</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.examName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Class (Optional)</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Section (Optional)</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.value} value={section.value}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadReports}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Statistics Cards */}
      {classStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold">
                    {classStats.totalStudents || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Passed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {classStats.passedStudents || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {classStats.failedStudents || 0}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pass Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {classStats.passPercentage?.toFixed(2) || 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subject Performance Table */}
      {performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Average Marks</TableHead>
                  <TableHead>Highest</TableHead>
                  <TableHead>Lowest</TableHead>
                  <TableHead>Pass Rate</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {subject.subjectName}
                    </TableCell>
                    <TableCell>{subject.averageMarks?.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">
                      {subject.highestMarks}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {subject.lowestMarks}
                    </TableCell>
                    <TableCell>{subject.passPercentage?.toFixed(2)}%</TableCell>
                    <TableCell>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${subject.passPercentage || 0}%` }}
                        ></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 10 Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((student, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        student.position === 1
                          ? "bg-yellow-100 text-yellow-700"
                          : student.position === 2
                          ? "bg-gray-100 text-gray-700"
                          : student.position === 3
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {student.position}
                    </div>
                    <div>
                      <p className="font-medium">
                        {student.studentId?.studentName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Roll No: {student.studentId?.rollNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {student.percentage?.toFixed(2)}%
                    </p>
                    <Badge variant="outline">{student.grade}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading &&
        !classStats &&
        !performanceData.length &&
        !topPerformers.length && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No reports generated yet</p>
                <p className="text-sm mt-2">
                  Select an exam and click "Generate Report" to view performance
                  analytics
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

export default ReportsTab;
