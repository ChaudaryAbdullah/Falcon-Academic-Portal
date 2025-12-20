import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Loader2,
  Edit2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export const BACKEND = import.meta.env.VITE_BACKEND;

export const classes = [
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

export const sections = [
  { value: "Red", label: "Red" },
  { value: "Blue", label: "Blue" },
  { value: "Pink", label: "Pink" },
  { value: "Green", label: "Green" },
  { value: "Yellow", label: "Yellow" },
  { value: "White", label: "White" },
];

export const examTypes = ["1st Term", "Mid Term", "Final Term"];

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

const getClassLabel = (value: string): string => {
  const classObj = classes.find((c) => c.value === value);
  return classObj ? classObj.label : value;
};

interface ManageExamsTabProps {
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ManageExamsTab({
  exams,
  setExams,
  loading,
  setLoading,
}: ManageExamsTabProps) {
  const [newExam, setNewExam] = useState({
    examName: "",
    examType: "",
    startDate: "",
    endDate: "",
    classes: [] as string[],
    academicYear: "",
  });
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddExam = async () => {
    try {
      if (
        !newExam.examName ||
        !newExam.examType ||
        newExam.classes.length === 0
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      setLoading(true);
      const response = await axios.post(
        `${BACKEND}/api/exams`,
        { ...newExam, status: "scheduled" },
        { withCredentials: true }
      );
      setExams([...exams, response.data.data]);
      resetForm();
      toast.success("Exam scheduled successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to schedule exam");
    } finally {
      setLoading(false);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setNewExam({
      examName: exam.examName,
      examType: exam.examType,
      startDate: exam.startDate,
      endDate: exam.endDate,
      classes: exam.classes,
      academicYear: exam.academicYear,
    });
    setIsEditing(true);
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;

    try {
      if (
        !newExam.examName ||
        !newExam.examType ||
        newExam.classes.length === 0
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      setLoading(true);
      const response = await axios.put(
        `${BACKEND}/api/exams/${editingExam._id}`,
        newExam,
        { withCredentials: true }
      );

      setExams(
        exams.map((e) => (e._id === editingExam._id ? response.data.data : e))
      );

      resetForm();
      toast.success("Exam updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update exam");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const resetForm = () => {
    setNewExam({
      examName: "",
      examType: "",
      startDate: "",
      endDate: "",
      classes: [],
      academicYear: "",
    });
    setEditingExam(null);
    setIsEditing(false);
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    try {
      setLoading(true);
      await axios.delete(`${BACKEND}/api/exams/${id}`, {
        withCredentials: true,
      });
      setExams(exams.filter((e) => e._id !== id));
      toast.success("Exam deleted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete exam");
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classValue: string) => {
    if (newExam.classes.includes(classValue)) {
      setNewExam({
        ...newExam,
        classes: newExam.classes.filter((c) => c !== classValue),
      });
    } else {
      setNewExam({
        ...newExam,
        classes: [...newExam.classes, classValue],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Exam Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {isEditing ? "Edit Exam" : "Schedule New Exam"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Exam Name</Label>
              <Input
                value={newExam.examName}
                onChange={(e) =>
                  setNewExam({ ...newExam, examName: e.target.value })
                }
                placeholder="e.g., 1st Term Exam 2024"
              />
            </div>
            <div>
              <Label>Exam Type</Label>
              <Select
                value={newExam.examType}
                onValueChange={(value) =>
                  setNewExam({ ...newExam, examType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Year</Label>
              <Input
                value={newExam.academicYear}
                onChange={(e) =>
                  setNewExam({ ...newExam, academicYear: e.target.value })
                }
                placeholder="2025-2026"
              />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newExam.startDate}
                onChange={(e) =>
                  setNewExam({ ...newExam, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={newExam.endDate}
                onChange={(e) =>
                  setNewExam({ ...newExam, endDate: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>Select Classes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {classes.map((cls) => (
                  <Button
                    key={cls.value}
                    size="sm"
                    variant={
                      newExam.classes.includes(cls.value)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleClass(cls.value)}
                  >
                    {cls.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleUpdateExam}
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Update Exam
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleAddExam}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Exam"
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exams scheduled. Schedule an exam to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow
                    key={exam._id}
                    className={
                      editingExam?._id === exam._id ? "bg-blue-50" : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {exam.examName}
                    </TableCell>
                    <TableCell>{exam.examType}</TableCell>
                    <TableCell>{exam.academicYear}</TableCell>
                    <TableCell>
                      {exam.startDate
                        ? new Date(exam.startDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {exam.endDate
                        ? new Date(exam.endDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {exam.classes?.slice(0, 3).map((cls) => (
                          <Badge
                            key={cls}
                            variant="outline"
                            className="text-xs"
                          >
                            {getClassLabel(cls)}
                          </Badge>
                        ))}
                        {exam.classes?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{exam.classes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          exam.status === "completed"
                            ? "default"
                            : exam.status === "ongoing"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditExam(exam)}
                          title="Edit Exam"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExam(exam._id)}
                          title="Delete Exam"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ManageExamsTab;
