// "use client";

// import { useState } from "react";
// import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import { Badge } from "../components/ui/badge";
// import { Button } from "../components/ui/button";
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
// import { Label } from "../components/ui/label";
// import { BookOpen, TrendingUp, Award, Download } from "lucide-react";
// import Sidebar from "../components/Sidebar";

// interface TestResult {
//   id: number;
//   testNumber: number;
//   obtainedMarks: number;
//   totalMarks: number;
//   date: string;
// }

// interface ExamResult {
//   id: number;
//   title: string;
//   obtainedMarks: number;
//   totalMarks: number;
//   date: string;
//   type: "midterm" | "final" | "quiz";
// }

// export function StudentMarksPage() {
//   const [selectedSubject, setSelectedSubject] = useState("");

//   const subjects = [
//     "Mathematics",
//     "Physics",
//     "Chemistry",
//     "English",
//     "History",
//     "Biology",
//   ];

//   const subjectData = {
//     Mathematics: {
//       tests: [
//         {
//           id: 1,
//           testNumber: 1,
//           obtainedMarks: 85,
//           totalMarks: 100,
//           date: "2024-02-15",
//         },
//         {
//           id: 2,
//           testNumber: 2,
//           obtainedMarks: 92,
//           totalMarks: 100,
//           date: "2024-02-28",
//         },
//         {
//           id: 3,
//           testNumber: 3,
//           obtainedMarks: 78,
//           totalMarks: 100,
//           date: "2024-03-10",
//         },
//       ],
//       exams: [
//         {
//           id: 1,
//           title: "Midterm Exam",
//           obtainedMarks: 88,
//           totalMarks: 100,
//           date: "2024-02-20",
//           type: "midterm" as const,
//         },
//         {
//           id: 2,
//           title: "Final Exam",
//           obtainedMarks: -1,
//           totalMarks: 100,
//           date: "2024-04-15",
//           type: "final" as const,
//         },
//       ],
//     },
//     Physics: {
//       tests: [
//         {
//           id: 1,
//           testNumber: 1,
//           obtainedMarks: 76,
//           totalMarks: 100,
//           date: "2024-02-12",
//         },
//         {
//           id: 2,
//           testNumber: 2,
//           obtainedMarks: 84,
//           totalMarks: 100,
//           date: "2024-02-26",
//         },
//         {
//           id: 3,
//           testNumber: 3,
//           obtainedMarks: 90,
//           totalMarks: 100,
//           date: "2024-03-12",
//         },
//       ],
//       exams: [
//         {
//           id: 1,
//           title: "Midterm Exam",
//           obtainedMarks: 82,
//           totalMarks: 100,
//           date: "2024-02-22",
//           type: "midterm" as const,
//         },
//         {
//           id: 2,
//           title: "Final Exam",
//           obtainedMarks: -1,
//           totalMarks: 100,
//           date: "2024-04-18",
//           type: "final" as const,
//         },
//       ],
//     },
//     Chemistry: {
//       tests: [
//         {
//           id: 1,
//           testNumber: 1,
//           obtainedMarks: 88,
//           totalMarks: 100,
//           date: "2024-02-14",
//         },
//         {
//           id: 2,
//           testNumber: 2,
//           obtainedMarks: 79,
//           totalMarks: 100,
//           date: "2024-03-01",
//         },
//         {
//           id: 3,
//           testNumber: 3,
//           obtainedMarks: 86,
//           totalMarks: 100,
//           date: "2024-03-14",
//         },
//       ],
//       exams: [
//         {
//           id: 1,
//           title: "Midterm Exam",
//           obtainedMarks: 85,
//           totalMarks: 100,
//           date: "2024-02-25",
//           type: "midterm" as const,
//         },
//         {
//           id: 2,
//           title: "Final Exam",
//           obtainedMarks: -1,
//           totalMarks: 100,
//           date: "2024-04-20",
//           type: "final" as const,
//         },
//       ],
//     },
//     English: {
//       tests: [
//         {
//           id: 1,
//           testNumber: 1,
//           obtainedMarks: 94,
//           totalMarks: 100,
//           date: "2024-02-16",
//         },
//         {
//           id: 2,
//           testNumber: 2,
//           obtainedMarks: 87,
//           totalMarks: 100,
//           date: "2024-03-02",
//         },
//         {
//           id: 3,
//           testNumber: 3,
//           obtainedMarks: 91,
//           totalMarks: 100,
//           date: "2024-03-16",
//         },
//       ],
//       exams: [
//         {
//           id: 1,
//           title: "Midterm Exam",
//           obtainedMarks: 89,
//           totalMarks: 100,
//           date: "2024-02-27",
//           type: "midterm" as const,
//         },
//         {
//           id: 2,
//           title: "Final Exam",
//           obtainedMarks: -1,
//           totalMarks: 100,
//           date: "2024-04-22",
//           type: "final" as const,
//         },
//       ],
//     },
//     History: {
//       tests: [
//         {
//           id: 1,
//           testNumber: 1,
//           obtainedMarks: 82,
//           totalMarks: 100,
//           date: "2024-02-18",
//         },
//         {
//           id: 2,
//           testNumber: 2,
//           obtainedMarks: 88,
//           totalMarks: 100,
//           date: "2024-03-04",
//         },
//         {
//           id: 3,
//           testNumber: 3,
//           obtainedMarks: 85,
//           totalMarks: 100,
//           date: "2024-03-18",
//         },
//       ],
//       exams: [
//         {
//           id: 1,
//           title: "Midterm Exam",
//           obtainedMarks: 86,
//           totalMarks: 100,
//           date: "2024-03-01",
//           type: "midterm" as const,
//         },
//         {
//           id: 2,
//           title: "Final Exam",
//           obtainedMarks: -1,
//           totalMarks: 100,
//           date: "2024-04-25",
//           type: "final" as const,
//         },
//       ],
//     },
//     Biology: {
//       tests: [
//         {
//           id: 1,
//           testNumber: 1,
//           obtainedMarks: 77,
//           totalMarks: 100,
//           date: "2024-02-20",
//         },
//         {
//           id: 2,
//           testNumber: 2,
//           obtainedMarks: 83,
//           totalMarks: 100,
//           date: "2024-03-06",
//         },
//         {
//           id: 3,
//           testNumber: 3,
//           obtainedMarks: 89,
//           totalMarks: 100,
//           date: "2024-03-20",
//         },
//       ],
//       exams: [
//         {
//           id: 1,
//           title: "Midterm Exam",
//           obtainedMarks: 81,
//           totalMarks: 100,
//           date: "2024-03-05",
//           type: "midterm" as const,
//         },
//         {
//           id: 2,
//           title: "Final Exam",
//           obtainedMarks: -1,
//           totalMarks: 100,
//           date: "2024-04-28",
//           type: "final" as const,
//         },
//       ],
//     },
//   };

//   const getGradeColor = (obtained: number, total: number) => {
//     const percentage = (obtained / total) * 100;
//     if (percentage >= 90) return "text-green-600";
//     if (percentage >= 80) return "text-blue-600";
//     if (percentage >= 70) return "text-yellow-600";
//     if (percentage >= 60) return "text-orange-600";
//     return "text-red-600";
//   };

//   const getGradeBadge = (obtained: number, total: number) => {
//     const percentage = (obtained / total) * 100;
//     let grade = "F";
//     let color = "bg-red-100 text-red-800";

//     if (percentage >= 90) {
//       grade = "A+";
//       color = "bg-green-100 text-green-800";
//     } else if (percentage >= 85) {
//       grade = "A";
//       color = "bg-green-100 text-green-800";
//     } else if (percentage >= 80) {
//       grade = "B+";
//       color = "bg-blue-100 text-blue-800";
//     } else if (percentage >= 75) {
//       grade = "B";
//       color = "bg-blue-100 text-blue-800";
//     } else if (percentage >= 70) {
//       grade = "C+";
//       color = "bg-yellow-100 text-yellow-800";
//     } else if (percentage >= 65) {
//       grade = "C";
//       color = "bg-yellow-100 text-yellow-800";
//     } else if (percentage >= 60) {
//       grade = "D";
//       color = "bg-orange-100 text-orange-800";
//     }

//     return <Badge className={`${color} hover:${color}`}>{grade}</Badge>;
//   };

//   const calculateAverage = (
//     results: { obtainedMarks: number; totalMarks: number }[]
//   ) => {
//     if (results.length === 0) return 0;
//     const totalObtained = results.reduce(
//       (sum, result) => sum + result.obtainedMarks,
//       0
//     );
//     const totalPossible = results.reduce(
//       (sum, result) => sum + result.totalMarks,
//       0
//     );
//     return Math.round((totalObtained / totalPossible) * 100);
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   const currentSubjectData = selectedSubject
//     ? subjectData[selectedSubject as keyof typeof subjectData]
//     : null;

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       <Sidebar userRole="student" selectOption="Marks" />
//       <main className="flex-1 p-6 ml-64 ">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-2xl font-semibold text-gray-900">
//               Welcome Back, Mrs. Johnson
//             </h1>
//             <p className="text-gray-600 mt-1">
//               Track your academic performance and view your grades
//             </p>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="text-right">
//               <p className="text-sm text-gray-500">Today: March 15, 2024</p>
//             </div>
//             <Avatar className="w-10 h-10">
//               <AvatarImage src="/placeholder.svg?height=40&width=40" />
//               <AvatarFallback>SJ</AvatarFallback>
//             </Avatar>
//           </div>
//         </div>

//         {/* View Marks Section */}
//         <div className="space-y-6">
//           <h2 className="text-xl font-semibold text-gray-900">View Marks</h2>

//           {/* Subject Selection */}
//           <Card className="bg-white">
//             <CardContent className="p-6">
//               <div className="flex items-center gap-4">
//                 <div className="flex-1">
//                   <Label
//                     htmlFor="subject-select"
//                     className="text-sm font-medium text-gray-700 mb-2 block"
//                   >
//                     Select Subject:
//                   </Label>
//                   <Select
//                     value={selectedSubject}
//                     onValueChange={setSelectedSubject}
//                   >
//                     <SelectTrigger className="w-full max-w-md">
//                       <SelectValue placeholder="Choose a subject..." />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {subjects.map((subject) => (
//                         <SelectItem key={subject} value={subject}>
//                           {subject}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 {selectedSubject && (
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="mt-6 bg-transparent"
//                   >
//                     <Download className="w-4 h-4 mr-2" />
//                     Export
//                   </Button>
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Subject Overview Stats */}
//           {currentSubjectData && (
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <Card className="bg-white">
//                 <CardContent className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">Test Average</p>
//                       <p className="text-2xl font-bold text-blue-600">
//                         {calculateAverage(currentSubjectData.tests)}%
//                       </p>
//                     </div>
//                     <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
//                       <BookOpen className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white">
//                 <CardContent className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">Exam Average</p>
//                       <p className="text-2xl font-bold text-green-600">
//                         {calculateAverage(
//                           currentSubjectData.exams.filter(
//                             (exam) => exam.obtainedMarks > -1
//                           )
//                         )}
//                         %
//                       </p>
//                     </div>
//                     <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
//                       <Award className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white">
//                 <CardContent className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">
//                         Overall Average
//                       </p>
//                       <p className="text-2xl font-bold text-purple-600">
//                         {calculateAverage([
//                           ...currentSubjectData.tests,
//                           ...currentSubjectData.exams.filter(
//                             (exam) => exam.obtainedMarks > -1
//                           ),
//                         ])}
//                         %
//                       </p>
//                     </div>
//                     <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
//                       <TrendingUp className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           )}

//           {/* Tests Table */}
//           {currentSubjectData && (
//             <Card className="bg-white">
//               <CardHeader className="bg-blue-600 text-white">
//                 <CardTitle className="text-lg font-semibold text-center">
//                   TESTS
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-0">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-16 text-center">#</TableHead>
//                       <TableHead>Test</TableHead>
//                       <TableHead className="text-center">
//                         Obtained Marks
//                       </TableHead>
//                       <TableHead className="text-center">Total Marks</TableHead>
//                       <TableHead className="text-center">Percentage</TableHead>
//                       <TableHead className="text-center">Grade</TableHead>
//                       <TableHead className="text-center">Date</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {currentSubjectData.tests.map((test, index) => (
//                       <TableRow key={test.id} className="hover:bg-gray-50">
//                         <TableCell className="text-center font-medium">
//                           {index + 1}
//                         </TableCell>
//                         <TableCell className="font-medium">
//                           Test {test.testNumber}
//                         </TableCell>
//                         <TableCell
//                           className={`text-center font-semibold ${getGradeColor(
//                             test.obtainedMarks,
//                             test.totalMarks
//                           )}`}
//                         >
//                           {test.obtainedMarks}
//                         </TableCell>
//                         <TableCell className="text-center">
//                           {test.totalMarks}
//                         </TableCell>
//                         <TableCell
//                           className={`text-center font-semibold ${getGradeColor(
//                             test.obtainedMarks,
//                             test.totalMarks
//                           )}`}
//                         >
//                           {Math.round(
//                             (test.obtainedMarks / test.totalMarks) * 100
//                           )}
//                           %
//                         </TableCell>
//                         <TableCell className="text-center">
//                           {getGradeBadge(test.obtainedMarks, test.totalMarks)}
//                         </TableCell>
//                         <TableCell className="text-center text-gray-600">
//                           {formatDate(test.date)}
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </CardContent>
//             </Card>
//           )}

//           {/* Exams Table */}
//           {currentSubjectData && (
//             <Card className="bg-white">
//               <CardHeader className="bg-blue-600 text-white">
//                 <CardTitle className="text-lg font-semibold text-center">
//                   EXAMS
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-0">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-16 text-center">#</TableHead>
//                       <TableHead>Title</TableHead>
//                       <TableHead className="text-center">
//                         Obtained Marks
//                       </TableHead>
//                       <TableHead className="text-center">Total Marks</TableHead>
//                       <TableHead className="text-center">Percentage</TableHead>
//                       <TableHead className="text-center">Grade</TableHead>
//                       <TableHead className="text-center">Date</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {currentSubjectData.exams.map((exam, index) => (
//                       <TableRow key={exam.id} className="hover:bg-gray-50">
//                         <TableCell className="text-center font-medium">
//                           {index + 1}
//                         </TableCell>
//                         <TableCell className="font-medium">
//                           {exam.title}
//                         </TableCell>
//                         <TableCell
//                           className={`text-center font-semibold ${
//                             exam.obtainedMarks < 0
//                               ? "text-gray-400"
//                               : getGradeColor(
//                                   exam.obtainedMarks,
//                                   exam.totalMarks
//                                 )
//                           }`}
//                         >
//                           {exam.obtainedMarks < 0
//                             ? "Pending"
//                             : exam.obtainedMarks}
//                         </TableCell>
//                         <TableCell className="text-center">
//                           {exam.totalMarks}
//                         </TableCell>
//                         <TableCell
//                           className={`text-center font-semibold ${
//                             exam.obtainedMarks === 0
//                               ? "text-gray-400"
//                               : getGradeColor(
//                                   exam.obtainedMarks,
//                                   exam.totalMarks
//                                 )
//                           }`}
//                         >
//                           {exam.obtainedMarks < 0
//                             ? "-"
//                             : `${Math.round(
//                                 (exam.obtainedMarks / exam.totalMarks) * 100
//                               )}%`}
//                         </TableCell>
//                         <TableCell className="text-center">
//                           {exam.obtainedMarks < 0 ? (
//                             <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
//                               Pending
//                             </Badge>
//                           ) : (
//                             getGradeBadge(exam.obtainedMarks, exam.totalMarks)
//                           )}
//                         </TableCell>
//                         <TableCell className="text-center text-gray-600">
//                           {formatDate(exam.date)}
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </CardContent>
//             </Card>
//           )}

//           {/* Instructions */}
//           {!selectedSubject && (
//             <Card className="bg-blue-50 border-blue-200">
//               <CardContent className="p-4">
//                 <p className="text-blue-800 text-sm">
//                   📊 Please select a subject to view your test scores and exam
//                   results.
//                 </p>
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
