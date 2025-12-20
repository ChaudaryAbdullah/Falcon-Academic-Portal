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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Users,
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

interface Subject {
  _id: string;
  subjectName: string;
  subjectCode: string;
  totalMarks: number;
  passingMarks: number;
  classes: string[];
  isActive: boolean;
}

const getClassLabel = (value: string): string => {
  const classObj = classes.find((c) => c.value === value);
  return classObj ? classObj.label : value;
};

interface ManageSubjectsTabProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

function ManageSubjectsTab({
  subjects,
  setSubjects,
  loading,
  setLoading,
}: ManageSubjectsTabProps) {
  const [newSubject, setNewSubject] = useState({
    subjectName: "",
    subjectCode: "",
    totalMarks: 100,
    passingMarks: 50,
    classes: [] as string[],
  });

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddSubject = async () => {
    try {
      if (!newSubject.subjectName || !newSubject.subjectCode) {
        toast.error("Subject name and code are required");
        return;
      }

      setLoading(true);
      const response = await axios.post(`${BACKEND}/api/subjects`, newSubject, {
        withCredentials: true,
      });
      setSubjects([...subjects, response.data.data]);
      setNewSubject({
        subjectName: "",
        subjectCode: "",
        totalMarks: 100,
        passingMarks: 50,
        classes: [],
      });
      toast.success("Subject added successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add subject");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setNewSubject({
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      totalMarks: subject.totalMarks,
      passingMarks: subject.passingMarks,
      classes: subject.classes,
    });
    setIsEditing(true);
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    try {
      if (!newSubject.subjectName || !newSubject.subjectCode) {
        toast.error("Subject name and code are required");
        return;
      }

      setLoading(true);
      const response = await axios.put(
        `${BACKEND}/api/subjects/${editingSubject._id}`,
        newSubject,
        { withCredentials: true }
      );

      setSubjects(
        subjects.map((s) =>
          s._id === editingSubject._id ? response.data.data : s
        )
      );

      resetForm();
      toast.success("Subject updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update subject");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const resetForm = () => {
    setNewSubject({
      subjectName: "",
      subjectCode: "",
      totalMarks: 100,
      passingMarks: 50,
      classes: [],
    });
    setEditingSubject(null);
    setIsEditing(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;

    try {
      setLoading(true);
      await axios.delete(`${BACKEND}/api/subjects/${id}`, {
        withCredentials: true,
      });
      setSubjects(subjects.filter((s) => s._id !== id));
      toast.success("Subject deleted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete subject");
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classValue: string) => {
    if (newSubject.classes.includes(classValue)) {
      setNewSubject({
        ...newSubject,
        classes: newSubject.classes.filter((c) => c !== classValue),
      });
    } else {
      setNewSubject({
        ...newSubject,
        classes: [...newSubject.classes, classValue],
      });
    }
  };

  // Group subjects by code for display
  const subjectsByCode = subjects.reduce((acc, subject) => {
    const code = subject.subjectCode;
    if (!acc[code]) {
      acc[code] = [];
    }
    acc[code].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  return (
    <div className="space-y-6">
      {/* Add/Edit Subject Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {isEditing ? "Edit Subject" : "Add New Subject"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subject Name</Label>
              <Input
                value={newSubject.subjectName}
                onChange={(e) =>
                  setNewSubject({
                    ...newSubject,
                    subjectName: e.target.value,
                  })
                }
                placeholder="e.g., English Oral, English Written"
              />
            </div>
            <div>
              <Label>Subject Code (Same code = Same group)</Label>
              <Input
                value={newSubject.subjectCode}
                onChange={(e) =>
                  setNewSubject({
                    ...newSubject,
                    subjectCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., ENG (for all English subjects)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use same code to group subjects (e.g., ENG for English Oral &
                English Written)
              </p>
            </div>
            <div>
              <Label>Total Marks</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newSubject.totalMarks}
                onChange={(e) =>
                  setNewSubject({
                    ...newSubject,
                    totalMarks: parseFloat(e.target.value) || 100,
                  })
                }
              />
            </div>
            <div>
              <Label>Passing Marks</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newSubject.passingMarks}
                onChange={(e) =>
                  setNewSubject({
                    ...newSubject,
                    passingMarks: parseFloat(e.target.value) || 40,
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>Assign to Classes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {classes.map((cls) => (
                  <Button
                    key={cls.value}
                    size="sm"
                    variant={
                      newSubject.classes.includes(cls.value)
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
                    onClick={handleUpdateSubject}
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
                        Update Subject
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
                  onClick={handleAddSubject}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Subject"
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Groups Info */}
      {Object.keys(subjectsByCode).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Subject Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(subjectsByCode).map(([code, subs]) => (
                <div
                  key={code}
                  className={`p-4 rounded-lg border ${
                    subs.length > 1
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={subs.length > 1 ? "default" : "outline"}>
                      {code}
                    </Badge>
                    {subs.length > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Grouped
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {subs.map((sub) => (
                      <div key={sub._id} className="text-sm">
                        • {sub.subjectName}{" "}
                        <span className="text-gray-500">
                          (Max: {sub.totalMarks})
                        </span>
                      </div>
                    ))}
                  </div>
                  {subs.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <span className="text-sm font-medium text-blue-800">
                        Group Total:{" "}
                        {subs.reduce((sum, s) => sum + s.totalMarks, 0)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subjects found. Add a subject to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Passing Marks</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => {
                  const sameCodeCount = subjects.filter(
                    (s) => s.subjectCode === subject.subjectCode
                  ).length;
                  return (
                    <TableRow
                      key={subject._id}
                      className={
                        editingSubject?._id === subject._id
                          ? "bg-blue-50"
                          : sameCodeCount > 1
                          ? "bg-blue-50/30"
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {subject.subjectName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sameCodeCount > 1 ? "default" : "outline"}
                        >
                          {subject.subjectCode}
                        </Badge>
                        {sameCodeCount > 1 && (
                          <span className="ml-2 text-xs text-blue-600">
                            (Grouped)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{subject.totalMarks}</TableCell>
                      <TableCell>{subject.passingMarks}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {subject.classes?.map((cls) => (
                            <Badge
                              key={cls}
                              variant="outline"
                              className="text-xs"
                            >
                              {getClassLabel(cls)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSubject(subject)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSubject(subject._id)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ManageSubjectsTab;
