// "use client";

// import { useState } from "react";
// import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// import { Button } from "../components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import { Input } from "../components/ui/input";
// import { Label } from "../components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";
// import { Badge } from "../components/ui/badge";
// import { Textarea } from "../components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "../components/ui/dialog";
// import {
//   Plus,
//   Save,
//   Users,
//   BookOpen,
//   Calculator,
//   Edit,
//   Eye,
//   History,
//   Trash2,
// } from "lucide-react";
// import Sidebar from "../components/Sidebar";

// interface Student {
//   id: number;
//   name: string;
//   rollNumber: string;
//   obtainedMarks: number;
// }

// interface TestExamDetails {
//   id?: number;
//   title: string;
//   type: "test" | "exam";
//   totalMarks: number;
//   date: string;
//   description: string;
//   duration: string;
// }

// interface SavedAssessment {
//   id: number;
//   classId: string;
//   details: TestExamDetails;
//   students: Student[];
//   createdAt: string;
//   updatedAt: string;
// }

// export function TeacherMarksPage() {
//   const [selectedClass, setSelectedClass] = useState("");
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [showPreviewModal, setShowPreviewModal] = useState(false);
//   const [selectedAssessment, setSelectedAssessment] =
//     useState<SavedAssessment | null>(null);
//   const [editingAssessment, setEditingAssessment] =
//     useState<SavedAssessment | null>(null);
//   const [testExamDetails, setTestExamDetails] = useState<TestExamDetails>({
//     title: "",
//     type: "test",
//     totalMarks: 100,
//     date: "",
//     description: "",
//     duration: "",
//   });
//   const [students, setStudents] = useState<Student[]>([]);
//   const [isFormSubmitted, setIsFormSubmitted] = useState(false);
//   const [viewMode, setViewMode] = useState<"create" | "existing">("create");
//   const [editingAssessmentDetails, setEditingAssessmentDetails] =
//     useState(false);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [assessmentToDelete, setAssessmentToDelete] =
//     useState<SavedAssessment | null>(null);

//   const classes = [
//     "Grade 10A - Algebra",
//     "Grade 9B - Geometry",
//     "Grade 11C - Calculus",
//     "Grade 8A - Basic Math",
//     "Grade 12B - Statistics",
//   ];

//   // Sample saved assessments data
//   const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>([
//     {
//       id: 1,
//       classId: "Grade 10A - Algebra",
//       details: {
//         id: 1,
//         title: "Chapter 5 Test",
//         type: "test",
//         totalMarks: 100,
//         date: "2024-03-10",
//         description: "Linear equations and inequalities",
//         duration: "1 hour",
//       },
//       students: [
//         { id: 1, name: "John Smith", rollNumber: "10A001", obtainedMarks: 85 },
//         {
//           id: 2,
//           name: "Emma Johnson",
//           rollNumber: "10A002",
//           obtainedMarks: 92,
//         },
//         {
//           id: 3,
//           name: "Michael Brown",
//           rollNumber: "10A003",
//           obtainedMarks: 78,
//         },
//         { id: 4, name: "Sarah Davis", rollNumber: "10A004", obtainedMarks: 88 },
//       ],
//       createdAt: "2024-03-10",
//       updatedAt: "2024-03-10",
//     },
//     {
//       id: 2,
//       classId: "Grade 10A - Algebra",
//       details: {
//         id: 2,
//         title: "Midterm Exam",
//         type: "exam",
//         totalMarks: 150,
//         date: "2024-02-20",
//         description: "Comprehensive exam covering chapters 1-4",
//         duration: "2 hours",
//       },
//       students: [
//         { id: 1, name: "John Smith", rollNumber: "10A001", obtainedMarks: 128 },
//         {
//           id: 2,
//           name: "Emma Johnson",
//           rollNumber: "10A002",
//           obtainedMarks: 135,
//         },
//         {
//           id: 3,
//           name: "Michael Brown",
//           rollNumber: "10A003",
//           obtainedMarks: 115,
//         },
//         {
//           id: 4,
//           name: "Sarah Davis",
//           rollNumber: "10A004",
//           obtainedMarks: 142,
//         },
//       ],
//       createdAt: "2024-02-20",
//       updatedAt: "2024-02-22",
//     },
//     {
//       id: 3,
//       classId: "Grade 9B - Geometry",
//       details: {
//         id: 3,
//         title: "Triangles Quiz",
//         type: "test",
//         totalMarks: 50,
//         date: "2024-03-05",
//         description: "Properties of triangles and congruence",
//         duration: "45 minutes",
//       },
//       students: [
//         { id: 1, name: "Alex Chen", rollNumber: "9B001", obtainedMarks: 42 },
//         {
//           id: 2,
//           name: "Sophie Miller",
//           rollNumber: "9B002",
//           obtainedMarks: 38,
//         },
//         {
//           id: 3,
//           name: "Ryan Thompson",
//           rollNumber: "9B003",
//           obtainedMarks: 45,
//         },
//       ],
//       createdAt: "2024-03-05",
//       updatedAt: "2024-03-05",
//     },
//   ]);

//   // Sample student data for different classes
//   const classStudents = {
//     "Grade 10A - Algebra": [
//       { id: 1, name: "John Smith", rollNumber: "10A001", obtainedMarks: 0 },
//       { id: 2, name: "Emma Johnson", rollNumber: "10A002", obtainedMarks: 0 },
//       { id: 3, name: "Michael Brown", rollNumber: "10A003", obtainedMarks: 0 },
//       { id: 4, name: "Sarah Davis", rollNumber: "10A004", obtainedMarks: 0 },
//       { id: 5, name: "David Wilson", rollNumber: "10A005", obtainedMarks: 0 },
//       { id: 6, name: "Lisa Anderson", rollNumber: "10A006", obtainedMarks: 0 },
//       { id: 7, name: "James Taylor", rollNumber: "10A007", obtainedMarks: 0 },
//       { id: 8, name: "Maria Garcia", rollNumber: "10A008", obtainedMarks: 0 },
//     ],
//     "Grade 9B - Geometry": [
//       { id: 1, name: "Alex Chen", rollNumber: "9B001", obtainedMarks: 0 },
//       { id: 2, name: "Sophie Miller", rollNumber: "9B002", obtainedMarks: 0 },
//       { id: 3, name: "Ryan Thompson", rollNumber: "9B003", obtainedMarks: 0 },
//       { id: 4, name: "Olivia White", rollNumber: "9B004", obtainedMarks: 0 },
//       { id: 5, name: "Ethan Clark", rollNumber: "9B005", obtainedMarks: 0 },
//       { id: 6, name: "Ava Martinez", rollNumber: "9B006", obtainedMarks: 0 },
//     ],
//     "Grade 11C - Calculus": [
//       { id: 1, name: "Daniel Lee", rollNumber: "11C001", obtainedMarks: 0 },
//       {
//         id: 2,
//         name: "Isabella Rodriguez",
//         rollNumber: "11C002",
//         obtainedMarks: 0,
//       },
//       { id: 3, name: "Matthew Kim", rollNumber: "11C003", obtainedMarks: 0 },
//       { id: 4, name: "Charlotte Wang", rollNumber: "11C004", obtainedMarks: 0 },
//       { id: 5, name: "Andrew Singh", rollNumber: "11C005", obtainedMarks: 0 },
//     ],
//     "Grade 8A - Basic Math": [
//       { id: 1, name: "Lucas Brown", rollNumber: "8A001", obtainedMarks: 0 },
//       { id: 2, name: "Mia Johnson", rollNumber: "8A002", obtainedMarks: 0 },
//       { id: 3, name: "Noah Davis", rollNumber: "8A003", obtainedMarks: 0 },
//       { id: 4, name: "Emma Wilson", rollNumber: "8A004", obtainedMarks: 0 },
//       { id: 5, name: "Liam Garcia", rollNumber: "8A005", obtainedMarks: 0 },
//       { id: 6, name: "Sophia Martinez", rollNumber: "8A006", obtainedMarks: 0 },
//       { id: 7, name: "Mason Anderson", rollNumber: "8A007", obtainedMarks: 0 },
//     ],
//     "Grade 12B - Statistics": [
//       { id: 1, name: "William Taylor", rollNumber: "12B001", obtainedMarks: 0 },
//       { id: 2, name: "Amelia Thomas", rollNumber: "12B002", obtainedMarks: 0 },
//       { id: 3, name: "Benjamin Moore", rollNumber: "12B003", obtainedMarks: 0 },
//       { id: 4, name: "Harper Jackson", rollNumber: "12B004", obtainedMarks: 0 },
//     ],
//   };

//   const handleClassChange = (className: string) => {
//     setSelectedClass(className);
//     setShowAddForm(false);
//     setIsFormSubmitted(false);
//     setEditingAssessment(null);
//     setViewMode("create");
//     resetForm();
//   };

//   const resetForm = () => {
//     setTestExamDetails({
//       title: "",
//       type: "test",
//       totalMarks: 100,
//       date: "",
//       description: "",
//       duration: "",
//     });
//     setStudents([]);
//   };

//   const handleAddNewAssessment = () => {
//     setShowAddForm(true);
//     setIsFormSubmitted(false);
//     setEditingAssessment(null);
//     setViewMode("create");
//     resetForm();
//   };

//   const handleViewExisting = () => {
//     setViewMode("existing");
//     setShowAddForm(false);
//     setIsFormSubmitted(false);
//     setEditingAssessment(null);
//   };

//   const handleEditAssessment = (assessment: SavedAssessment) => {
//     setEditingAssessment(assessment);
//     setTestExamDetails(assessment.details);
//     setStudents([...assessment.students]);
//     setIsFormSubmitted(true);
//     setShowAddForm(false);
//     setViewMode("create");
//   };

//   const handlePreviewAssessment = (assessment: SavedAssessment) => {
//     setSelectedAssessment(assessment);
//     setShowPreviewModal(true);
//   };

//   const handleDeleteAssessment = (assessment: SavedAssessment) => {
//     setAssessmentToDelete(assessment);
//     setShowDeleteDialog(true);
//   };

//   const confirmDeleteAssessment = () => {
//     if (assessmentToDelete) {
//       setSavedAssessments((prev) =>
//         prev.filter((assessment) => assessment.id !== assessmentToDelete.id)
//       );
//       setShowDeleteDialog(false);
//       setAssessmentToDelete(null);
//       alert("Assessment deleted successfully!");

//       // If we're currently editing the deleted assessment, reset the form
//       if (editingAssessment && editingAssessment.id === assessmentToDelete.id) {
//         setEditingAssessment(null);
//         setIsFormSubmitted(false);
//         resetForm();
//       }
//     }
//   };

//   const cancelDeleteAssessment = () => {
//     setShowDeleteDialog(false);
//     setAssessmentToDelete(null);
//   };

//   const handleFormSubmit = () => {
//     if (!testExamDetails.title || !testExamDetails.date) {
//       alert("Please fill in all required fields");
//       return;
//     }

//     if (editingAssessment) {
//       // Update existing assessment
//       const updatedStudents = editingAssessment.students.map((student) => {
//         const existingStudent = students.find((s) => s.id === student.id);
//         return existingStudent || student;
//       });
//       setStudents(updatedStudents);
//     } else {
//       // Create new assessment
//       const classStudentList =
//         classStudents[selectedClass as keyof typeof classStudents] || [];
//       setStudents([...classStudentList]);
//     }

//     setIsFormSubmitted(true);
//     setShowAddForm(false);
//   };

//   const handleMarksChange = (studentId: number, marks: string) => {
//     const numericMarks = Math.max(
//       0,
//       Math.min(testExamDetails.totalMarks, Number.parseInt(marks) || 0)
//     );
//     setStudents((prev) =>
//       prev.map((student) =>
//         student.id === studentId
//           ? { ...student, obtainedMarks: numericMarks }
//           : student
//       )
//     );
//   };

//   const handleSubmitMarks = () => {
//     const assessmentData: SavedAssessment = {
//       id: editingAssessment?.id || Date.now(),
//       classId: selectedClass,
//       details: { ...testExamDetails, id: editingAssessment?.id || Date.now() },
//       students: [...students],
//       createdAt:
//         editingAssessment?.createdAt || new Date().toISOString().split("T")[0],
//       updatedAt: new Date().toISOString().split("T")[0],
//     };

//     if (editingAssessment) {
//       // Update existing assessment
//       setSavedAssessments((prev) =>
//         prev.map((assessment) =>
//           assessment.id === editingAssessment.id ? assessmentData : assessment
//         )
//       );
//       alert("Assessment updated successfully!");
//     } else {
//       // Add new assessment
//       setSavedAssessments((prev) => [...prev, assessmentData]);
//       alert("Assessment saved successfully!");
//     }

//     console.log("Assessment data:", assessmentData);
//   };

//   const calculateStats = () => {
//     if (students.length === 0)
//       return { average: 0, highest: 0, lowest: 0, passCount: 0 };

//     const marks = students.map((s) => s.obtainedMarks);
//     const average = Math.round(
//       marks.reduce((sum, mark) => sum + mark, 0) / marks.length
//     );
//     const highest = Math.max(...marks);
//     const lowest = Math.min(...marks);
//     const passCount = marks.filter(
//       (mark) => (mark / testExamDetails.totalMarks) * 100 >= 60
//     ).length;

//     return { average, highest, lowest, passCount };
//   };

//   const getGradeBadge = (obtained: number, total: number) => {
//     const percentage = Math.round((obtained / total) * 100);
//     let grade = "F";
//     let gradeColor = "bg-red-100 text-red-800";

//     if (percentage >= 90) {
//       grade = "A+";
//       gradeColor = "bg-green-100 text-green-800";
//     } else if (percentage >= 85) {
//       grade = "A";
//       gradeColor = "bg-green-100 text-green-800";
//     } else if (percentage >= 80) {
//       grade = "B+";
//       gradeColor = "bg-blue-100 text-blue-800";
//     } else if (percentage >= 75) {
//       grade = "B";
//       gradeColor = "bg-blue-100 text-blue-800";
//     } else if (percentage >= 70) {
//       grade = "C+";
//       gradeColor = "bg-yellow-100 text-yellow-800";
//     } else if (percentage >= 65) {
//       grade = "C";
//       gradeColor = "bg-yellow-100 text-yellow-800";
//     } else if (percentage >= 60) {
//       grade = "D";
//       gradeColor = "bg-orange-100 text-orange-800";
//     }

//     return (
//       <Badge className={`${gradeColor} hover:${gradeColor}`}>{grade}</Badge>
//     );
//   };

//   const stats = calculateStats();
//   const classAssessments = savedAssessments.filter(
//     (assessment) => assessment.classId === selectedClass
//   );

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       <Sidebar userRole="teacher" selectOption="Marks" />
//       <main className="flex-1 p-6 ml-64 ">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-2xl font-semibold text-gray-900">
//               Welcome back, Ms. Johnson
//             </h1>
//             <p className="text-gray-600 mt-1">
//               Create, update, and manage test scores for your classes
//             </p>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="text-right">
//               <p className="text-sm text-gray-500">Today</p>
//               <p className="text-sm font-medium">March 15, 2024</p>
//             </div>
//             <Avatar className="w-10 h-10">
//               <AvatarImage src="/placeholder.svg?height=40&width=40" />
//               <AvatarFallback>SJ</AvatarFallback>
//             </Avatar>
//           </div>
//         </div>

//         {/* Mark Tests/Exams Section */}
//         <div className="space-y-6">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Mark Tests & Exams
//           </h2>

//           {/* Class Selection */}
//           <Card className="bg-white">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex-1 max-w-md">
//                   <Label
//                     htmlFor="class-select"
//                     className="text-sm font-medium text-gray-700 mb-2 block"
//                   >
//                     Select Class:
//                   </Label>
//                   <Select
//                     value={selectedClass}
//                     onValueChange={handleClassChange}
//                   >
//                     <SelectTrigger className="w-full">
//                       <SelectValue placeholder="Choose a class..." />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {classes.map((className) => (
//                         <SelectItem key={className} value={className}>
//                           {className}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 {selectedClass && (
//                   <div className="flex gap-2">
//                     <Button
//                       onClick={handleAddNewAssessment}
//                       className="bg-blue-600 hover:bg-blue-700 text-white"
//                       variant={viewMode === "create" ? "default" : "outline"}
//                     >
//                       <Plus className="w-4 h-4 mr-2" />
//                       Add New
//                     </Button>
//                     <Button
//                       onClick={handleViewExisting}
//                       variant={viewMode === "existing" ? "default" : "outline"}
//                       className={
//                         viewMode === "existing"
//                           ? "bg-blue-600 hover:bg-blue-700 text-white"
//                           : "bg-transparent"
//                       }
//                     >
//                       <History className="w-4 h-4 mr-2" />
//                       View Existing
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Existing Assessments List */}
//           {viewMode === "existing" && selectedClass && (
//             <Card className="bg-white">
//               <CardHeader>
//                 <CardTitle className="text-lg font-semibold">
//                   Existing Assessments - {selectedClass}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {classAssessments.length > 0 ? (
//                   <div className="space-y-4">
//                     {classAssessments.map((assessment) => (
//                       <div
//                         key={assessment.id}
//                         className="border rounded-lg p-4 hover:bg-gray-50"
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1">
//                             <div className="flex items-center gap-3 mb-2">
//                               <h3 className="font-semibold text-gray-900">
//                                 {assessment.details.title}
//                               </h3>
//                               <Badge
//                                 variant="outline"
//                                 className="bg-blue-50 text-blue-700"
//                               >
//                                 {assessment.details.type === "test"
//                                   ? "Test"
//                                   : "Exam"}
//                               </Badge>
//                             </div>
//                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
//                               <div>
//                                 <span className="font-medium">
//                                   Total Marks:
//                                 </span>{" "}
//                                 {assessment.details.totalMarks}
//                               </div>
//                               <div>
//                                 <span className="font-medium">Date:</span>{" "}
//                                 {new Date(
//                                   assessment.details.date
//                                 ).toLocaleDateString()}
//                               </div>
//                               <div>
//                                 <span className="font-medium">Students:</span>{" "}
//                                 {assessment.students.length}
//                               </div>
//                               <div>
//                                 <span className="font-medium">
//                                   Last Updated:
//                                 </span>{" "}
//                                 {new Date(
//                                   assessment.updatedAt
//                                 ).toLocaleDateString()}
//                               </div>
//                             </div>
//                           </div>
//                           <div className="flex gap-2">
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={() =>
//                                 handlePreviewAssessment(assessment)
//                               }
//                               className="bg-transparent"
//                             >
//                               <Eye className="w-4 h-4 mr-1" />
//                               Preview
//                             </Button>
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={() => handleEditAssessment(assessment)}
//                               className="bg-transparent"
//                             >
//                               <Edit className="w-4 h-4 mr-1" />
//                               Edit
//                             </Button>
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={() => handleDeleteAssessment(assessment)}
//                               className="bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
//                             >
//                               <Trash2 className="w-4 h-4 mr-1" />
//                               Delete
//                             </Button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-gray-500">
//                     <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
//                     <p>No assessments found for this class.</p>
//                     <p className="text-sm">
//                       Create your first assessment to get started.
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           )}

//           {/* Add/Edit Assessment Form */}
//           {showAddForm && (
//             <Card className="bg-white">
//               <CardHeader>
//                 <CardTitle className="text-lg font-semibold">
//                   {editingAssessment
//                     ? "Edit Assessment"
//                     : "Create New Assessment"}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label
//                       htmlFor="assessment-type"
//                       className="text-sm font-medium text-gray-700"
//                     >
//                       Assessment Type *
//                     </Label>
//                     <Select
//                       value={testExamDetails.type}
//                       onValueChange={(value: "test" | "exam") =>
//                         setTestExamDetails((prev) => ({ ...prev, type: value }))
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="test">Test</SelectItem>
//                         <SelectItem value="exam">Exam</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label
//                       htmlFor="title"
//                       className="text-sm font-medium text-gray-700"
//                     >
//                       Title *
//                     </Label>
//                     <Input
//                       id="title"
//                       value={testExamDetails.title}
//                       onChange={(e) =>
//                         setTestExamDetails((prev) => ({
//                           ...prev,
//                           title: e.target.value,
//                         }))
//                       }
//                       placeholder="e.g., Midterm Exam, Chapter 5 Test"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label
//                       htmlFor="total-marks"
//                       className="text-sm font-medium text-gray-700"
//                     >
//                       Total Marks *
//                     </Label>
//                     <Input
//                       id="total-marks"
//                       type="number"
//                       value={testExamDetails.totalMarks}
//                       onChange={(e) =>
//                         setTestExamDetails((prev) => ({
//                           ...prev,
//                           totalMarks: Number.parseInt(e.target.value) || 100,
//                         }))
//                       }
//                       min="1"
//                       max="1000"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label
//                       htmlFor="date"
//                       className="text-sm font-medium text-gray-700"
//                     >
//                       Date *
//                     </Label>
//                     <Input
//                       id="date"
//                       type="date"
//                       value={testExamDetails.date}
//                       onChange={(e) =>
//                         setTestExamDetails((prev) => ({
//                           ...prev,
//                           date: e.target.value,
//                         }))
//                       }
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label
//                       htmlFor="duration"
//                       className="text-sm font-medium text-gray-700"
//                     >
//                       Duration
//                     </Label>
//                     <Input
//                       id="duration"
//                       value={testExamDetails.duration}
//                       onChange={(e) =>
//                         setTestExamDetails((prev) => ({
//                           ...prev,
//                           duration: e.target.value,
//                         }))
//                       }
//                       placeholder="e.g., 2 hours, 90 minutes"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="description"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     Description
//                   </Label>
//                   <Textarea
//                     id="description"
//                     value={testExamDetails.description}
//                     onChange={(e) =>
//                       setTestExamDetails((prev) => ({
//                         ...prev,
//                         description: e.target.value,
//                       }))
//                     }
//                     placeholder="Additional notes about the assessment..."
//                     rows={3}
//                   />
//                 </div>

//                 <div className="flex gap-4">
//                   <Button
//                     onClick={handleFormSubmit}
//                     className="bg-blue-600 hover:bg-blue-700 text-white"
//                   >
//                     <Save className="w-4 h-4 mr-2" />
//                     {editingAssessment
//                       ? "Update Assessment"
//                       : "Create Assessment"}
//                   </Button>
//                   <Button
//                     variant="outline"
//                     onClick={() => setShowAddForm(false)}
//                     className="bg-transparent"
//                   >
//                     Cancel
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Assessment Details & Stats */}
//           {isFormSubmitted && (
//             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//               <Card className="bg-white">
//                 <CardContent className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">
//                         Total Students
//                       </p>
//                       <p className="text-2xl font-bold text-gray-900">
//                         {students.length}
//                       </p>
//                     </div>
//                     <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
//                       <Users className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white">
//                 <CardContent className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">
//                         Class Average
//                       </p>
//                       <p className="text-2xl font-bold text-green-600">
//                         {stats.average}%
//                       </p>
//                     </div>
//                     <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
//                       <Calculator className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white">
//                 <CardContent className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">
//                         Highest Score
//                       </p>
//                       <p className="text-2xl font-bold text-purple-600">
//                         {stats.highest}/{testExamDetails.totalMarks}
//                       </p>
//                     </div>
//                     <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
//                       <BookOpen className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white">
//                 <CardContent className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
//                       <p className="text-2xl font-bold text-orange-600">
//                         {students.length > 0
//                           ? Math.round(
//                               (stats.passCount / students.length) * 100
//                             )
//                           : 0}
//                         %
//                       </p>
//                     </div>
//                     <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
//                       <BookOpen className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           )}

//           {/* Assessment Info Card */}
//           {isFormSubmitted && (
//             <Card className="bg-white">
//               <CardHeader>
//                 <CardTitle className="flex items-center justify-between">
//                   <span>
//                     {testExamDetails.title} - {selectedClass}
//                     {editingAssessment && (
//                       <span className="text-sm font-normal text-gray-500 ml-2">
//                         (Editing)
//                       </span>
//                     )}
//                   </span>
//                   <div className="flex items-center gap-2">
//                     <Badge
//                       variant="outline"
//                       className="bg-blue-50 text-blue-700"
//                     >
//                       {testExamDetails.type === "test" ? "Test" : "Exam"}
//                     </Badge>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         setEditingAssessmentDetails(!editingAssessmentDetails)
//                       }
//                       className="bg-transparent"
//                     >
//                       <Edit className="w-4 h-4 mr-1" />
//                       {editingAssessmentDetails ? "Cancel" : "Edit Details"}
//                     </Button>
//                   </div>
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {editingAssessmentDetails ? (
//                   <div className="space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div className="space-y-2">
//                         <Label
//                           htmlFor="edit-title"
//                           className="text-sm font-medium text-gray-700"
//                         >
//                           Title *
//                         </Label>
//                         <Input
//                           id="edit-title"
//                           value={testExamDetails.title}
//                           onChange={(e) =>
//                             setTestExamDetails((prev) => ({
//                               ...prev,
//                               title: e.target.value,
//                             }))
//                           }
//                           placeholder="Assessment title"
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label
//                           htmlFor="edit-total-marks"
//                           className="text-sm font-medium text-gray-700"
//                         >
//                           Total Marks *
//                         </Label>
//                         <Input
//                           id="edit-total-marks"
//                           type="number"
//                           value={testExamDetails.totalMarks}
//                           onChange={(e) =>
//                             setTestExamDetails((prev) => ({
//                               ...prev,
//                               totalMarks:
//                                 Number.parseInt(e.target.value) || 100,
//                             }))
//                           }
//                           min="1"
//                           max="1000"
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label
//                           htmlFor="edit-date"
//                           className="text-sm font-medium text-gray-700"
//                         >
//                           Date *
//                         </Label>
//                         <Input
//                           id="edit-date"
//                           type="date"
//                           value={testExamDetails.date}
//                           onChange={(e) =>
//                             setTestExamDetails((prev) => ({
//                               ...prev,
//                               date: e.target.value,
//                             }))
//                           }
//                         />
//                       </div>
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label
//                           htmlFor="edit-duration"
//                           className="text-sm font-medium text-gray-700"
//                         >
//                           Duration
//                         </Label>
//                         <Input
//                           id="edit-duration"
//                           value={testExamDetails.duration}
//                           onChange={(e) =>
//                             setTestExamDetails((prev) => ({
//                               ...prev,
//                               duration: e.target.value,
//                             }))
//                           }
//                           placeholder="e.g., 2 hours, 90 minutes"
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label
//                           htmlFor="edit-type"
//                           className="text-sm font-medium text-gray-700"
//                         >
//                           Assessment Type *
//                         </Label>
//                         <Select
//                           value={testExamDetails.type}
//                           onValueChange={(value: "test" | "exam") =>
//                             setTestExamDetails((prev) => ({
//                               ...prev,
//                               type: value,
//                             }))
//                           }
//                         >
//                           <SelectTrigger>
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="test">Test</SelectItem>
//                             <SelectItem value="exam">Exam</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label
//                         htmlFor="edit-description"
//                         className="text-sm font-medium text-gray-700"
//                       >
//                         Description
//                       </Label>
//                       <Textarea
//                         id="edit-description"
//                         value={testExamDetails.description}
//                         onChange={(e) =>
//                           setTestExamDetails((prev) => ({
//                             ...prev,
//                             description: e.target.value,
//                           }))
//                         }
//                         placeholder="Additional notes about the assessment..."
//                         rows={2}
//                       />
//                     </div>
//                     <div className="flex gap-2 pt-2">
//                       <Button
//                         onClick={() => {
//                           setEditingAssessmentDetails(false);
//                           // Optionally auto-save or show save confirmation
//                           alert("Assessment details updated!");
//                         }}
//                         className="bg-green-600 hover:bg-green-700 text-white"
//                         size="sm"
//                       >
//                         <Save className="w-4 h-4 mr-1" />
//                         Save Changes
//                       </Button>
//                       <Button
//                         variant="outline"
//                         onClick={() => setEditingAssessmentDetails(false)}
//                         className="bg-transparent"
//                         size="sm"
//                       >
//                         Cancel
//                       </Button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
//                     <div>
//                       <span className="text-gray-600">Total Marks:</span>
//                       <span className="ml-2 font-semibold">
//                         {testExamDetails.totalMarks}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-gray-600">Date:</span>
//                       <span className="ml-2 font-semibold">
//                         {new Date(testExamDetails.date).toLocaleDateString()}
//                       </span>
//                     </div>
//                     {testExamDetails.duration && (
//                       <div>
//                         <span className="text-gray-600">Duration:</span>
//                         <span className="ml-2 font-semibold">
//                           {testExamDetails.duration}
//                         </span>
//                       </div>
//                     )}
//                     <div>
//                       <span className="text-gray-600">Students:</span>
//                       <span className="ml-2 font-semibold">
//                         {students.length}
//                       </span>
//                     </div>
//                     {testExamDetails.description && (
//                       <div className="md:col-span-4 mt-2">
//                         <span className="text-gray-600">Description:</span>
//                         <p className="mt-1 text-gray-900">
//                           {testExamDetails.description}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           )}

//           {/* Student Marks Table */}
//           {isFormSubmitted && students.length > 0 && (
//             <Card className="bg-white">
//               <CardHeader className="bg-blue-600 text-white">
//                 <CardTitle className="text-lg font-semibold text-center">
//                   {editingAssessment
//                     ? "Update Student Marks"
//                     : "Student Marks Entry"}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-0">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-16 text-center">#</TableHead>
//                       <TableHead>Student Name</TableHead>
//                       <TableHead className="text-center">Roll Number</TableHead>
//                       <TableHead className="text-center">
//                         Obtained Marks
//                       </TableHead>
//                       <TableHead className="text-center">Percentage</TableHead>
//                       <TableHead className="text-center">Grade</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {students.map((student, index) => {
//                       const percentage = Math.round(
//                         (student.obtainedMarks / testExamDetails.totalMarks) *
//                           100
//                       );

//                       return (
//                         <TableRow key={student.id} className="hover:bg-gray-50">
//                           <TableCell className="text-center font-medium">
//                             {index + 1}
//                           </TableCell>
//                           <TableCell className="font-medium">
//                             {student.name}
//                           </TableCell>
//                           <TableCell className="text-center">
//                             {student.rollNumber}
//                           </TableCell>
//                           <TableCell className="text-center">
//                             <Input
//                               type="number"
//                               value={student.obtainedMarks || ""}
//                               onChange={(e) =>
//                                 handleMarksChange(student.id, e.target.value)
//                               }
//                               className="w-20 text-center"
//                               min="0"
//                               max={testExamDetails.totalMarks}
//                               placeholder="0"
//                             />
//                           </TableCell>
//                           <TableCell className="text-center font-semibold">
//                             {student.obtainedMarks > 0 ? `${percentage}%` : "-"}
//                           </TableCell>
//                           <TableCell className="text-center">
//                             {student.obtainedMarks > 0
//                               ? getGradeBadge(
//                                   student.obtainedMarks,
//                                   testExamDetails.totalMarks
//                                 )
//                               : "-"}
//                           </TableCell>
//                         </TableRow>
//                       );
//                     })}
//                   </TableBody>
//                 </Table>

//                 {/* Submit Button */}
//                 <div className="p-6 border-t bg-gray-50">
//                   <div className="flex justify-between items-center">
//                     <div className="text-sm text-gray-600">
//                       <span>
//                         Marks entered:{" "}
//                         {students.filter((s) => s.obtainedMarks > 0).length} /{" "}
//                         {students.length}
//                       </span>
//                     </div>
//                     <Button
//                       onClick={handleSubmitMarks}
//                       className="bg-green-600 hover:bg-green-700 text-white"
//                     >
//                       <Save className="w-4 h-4 mr-2" />
//                       {editingAssessment
//                         ? "Update All Marks"
//                         : "Submit All Marks"}
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Delete Confirmation Dialog */}
//           <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//             <DialogContent className="max-w-md">
//               <DialogHeader>
//                 <DialogTitle className="text-xl font-semibold text-red-600">
//                   Delete Assessment
//                 </DialogTitle>
//               </DialogHeader>
//               <div className="space-y-4">
//                 <p className="text-gray-700">
//                   Are you sure you want to delete "
//                   {assessmentToDelete?.details.title}"?
//                 </p>
//                 <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                   <p className="text-red-800 text-sm font-medium">⚠️ Warning</p>
//                   <p className="text-red-700 text-sm mt-1">
//                     This action cannot be undone. All student marks and
//                     assessment data will be permanently deleted.
//                   </p>
//                 </div>
//                 <div className="flex gap-3 justify-end">
//                   <Button
//                     variant="outline"
//                     onClick={cancelDeleteAssessment}
//                     className="bg-transparent"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={confirmDeleteAssessment}
//                     className="bg-red-600 hover:bg-red-700 text-white"
//                   >
//                     <Trash2 className="w-4 h-4 mr-2" />
//                     Delete Assessment
//                   </Button>
//                 </div>
//               </div>
//             </DialogContent>
//           </Dialog>

//           {/* Preview Modal */}
//           <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
//             <DialogContent className="w-[70vw] max-h-[80vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle className="text-xl font-semibold">
//                   {selectedAssessment?.details.title} - Preview
//                 </DialogTitle>
//               </DialogHeader>
//               {selectedAssessment && (
//                 <div className="space-y-6">
//                   {/* Assessment Details */}
//                   <Card>
//                     <CardHeader>
//                       <CardTitle className="flex items-center justify-between text-lg">
//                         Assessment Details
//                         <Badge
//                           variant="outline"
//                           className="bg-blue-50 text-blue-700"
//                         >
//                           {selectedAssessment.details.type === "test"
//                             ? "Test"
//                             : "Exam"}
//                         </Badge>
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                         <div>
//                           <span className="text-gray-600">Class:</span>
//                           <p className="font-semibold">
//                             {selectedAssessment.classId}
//                           </p>
//                         </div>
//                         <div>
//                           <span className="text-gray-600">Total Marks:</span>
//                           <p className="font-semibold">
//                             {selectedAssessment.details.totalMarks}
//                           </p>
//                         </div>
//                         <div>
//                           <span className="text-gray-600">Date:</span>
//                           <p className="font-semibold">
//                             {new Date(
//                               selectedAssessment.details.date
//                             ).toLocaleDateString()}
//                           </p>
//                         </div>
//                         <div>
//                           <span className="text-gray-600">Duration:</span>
//                           <p className="font-semibold">
//                             {selectedAssessment.details.duration || "N/A"}
//                           </p>
//                         </div>
//                       </div>
//                       {selectedAssessment.details.description && (
//                         <div className="mt-4">
//                           <span className="text-gray-600">Description:</span>
//                           <p className="mt-1">
//                             {selectedAssessment.details.description}
//                           </p>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>

//                   {/* Student Results */}
//                   <Card>
//                     <CardHeader>
//                       <CardTitle className="text-lg">Student Results</CardTitle>
//                     </CardHeader>
//                     <CardContent className="p-0">
//                       <Table>
//                         <TableHeader>
//                           <TableRow>
//                             <TableHead className="w-16 text-center">
//                               #
//                             </TableHead>
//                             <TableHead>Student Name</TableHead>
//                             <TableHead className="text-center">
//                               Roll Number
//                             </TableHead>
//                             <TableHead className="text-center">
//                               Obtained Marks
//                             </TableHead>
//                             <TableHead className="text-center">
//                               Percentage
//                             </TableHead>
//                             <TableHead className="text-center">Grade</TableHead>
//                           </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                           {selectedAssessment.students.map((student, index) => {
//                             const percentage = Math.round(
//                               (student.obtainedMarks /
//                                 selectedAssessment.details.totalMarks) *
//                                 100
//                             );
//                             return (
//                               <TableRow key={student.id}>
//                                 <TableCell className="text-center font-medium">
//                                   {index + 1}
//                                 </TableCell>
//                                 <TableCell className="font-medium">
//                                   {student.name}
//                                 </TableCell>
//                                 <TableCell className="text-center">
//                                   {student.rollNumber}
//                                 </TableCell>
//                                 <TableCell className="text-center font-semibold">
//                                   {student.obtainedMarks}
//                                 </TableCell>
//                                 <TableCell className="text-center font-semibold">
//                                   {percentage}%
//                                 </TableCell>
//                                 <TableCell className="text-center">
//                                   {getGradeBadge(
//                                     student.obtainedMarks,
//                                     selectedAssessment.details.totalMarks
//                                   )}
//                                 </TableCell>
//                               </TableRow>
//                             );
//                           })}
//                         </TableBody>
//                       </Table>
//                     </CardContent>
//                   </Card>
//                 </div>
//               )}
//             </DialogContent>
//           </Dialog>

//           {/* Instructions */}
//           {!selectedClass && (
//             <Card className="bg-blue-50 border-blue-200">
//               <CardContent className="p-4">
//                 <p className="text-blue-800 text-sm">
//                   📝 Please select a class to start creating, editing, or
//                   viewing assessments.
//                 </p>
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
