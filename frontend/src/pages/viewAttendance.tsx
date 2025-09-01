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
// import { Progress } from "../components/ui/progress";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "../components/ui/dialog";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";
// import {
//   Calendar,
//   CheckCircle,
//   XCircle,
//   Clock,
//   TrendingUp,
//   Download,
//   Eye,
// } from "lucide-react";
// import Sidebar from "../components/Sidebar";

// interface AttendanceRecord {
//   id: number;
//   date: string;
//   subject: string;
//   status: "present" | "absent" | "late";
//   time: string;
//   teacher: string;
// }

// interface SubjectAttendanceDetail {
//   date: string;
//   status: "present" | "absent" | "late";
// }

// export function StudentAttendancePage() {
//   const [selectedMonth, setSelectedMonth] = useState("march-2024");
//   const [selectedSubjectForModal, setSelectedSubjectForModal] = useState<
//     string | null
//   >(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const attendanceStats = {
//     totalClasses: 120,
//     present: 108,
//     absent: 8,
//     late: 4,
//     percentage: 90,
//   };

//   const subjectWiseAttendance = [
//     { subject: "Mathematics", total: 25, present: 23, percentage: 92 },
//     { subject: "Physics", total: 20, present: 18, percentage: 90 },
//     { subject: "Chemistry", total: 22, present: 19, percentage: 86 },
//     { subject: "English", total: 18, present: 17, percentage: 94 },
//     { subject: "History", total: 15, present: 14, percentage: 93 },
//     { subject: "Biology", total: 20, present: 17, percentage: 85 },
//   ];

//   // Sample detailed attendance data for each subject
//   const subjectAttendanceDetails: Record<string, SubjectAttendanceDetail[]> = {
//     Mathematics: [
//       { date: "2024-03-15", status: "present" },
//       { date: "2024-03-14", status: "present" },
//       { date: "2024-03-13", status: "absent" },
//       { date: "2024-03-12", status: "present" },
//       { date: "2024-03-11", status: "late" },
//       { date: "2024-03-08", status: "present" },
//       { date: "2024-03-07", status: "present" },
//       { date: "2024-03-06", status: "present" },
//       { date: "2024-03-05", status: "present" },
//       { date: "2024-03-04", status: "absent" },
//     ],
//     Physics: [
//       { date: "2024-03-15", status: "present" },
//       { date: "2024-03-14", status: "present" },
//       { date: "2024-03-12", status: "present" },
//       { date: "2024-03-11", status: "present" },
//       { date: "2024-03-08", status: "absent" },
//       { date: "2024-03-07", status: "late" },
//       { date: "2024-03-05", status: "present" },
//       { date: "2024-03-04", status: "present" },
//     ],
//     Chemistry: [
//       { date: "2024-03-14", status: "late" },
//       { date: "2024-03-13", status: "present" },
//       { date: "2024-03-11", status: "present" },
//       { date: "2024-03-08", status: "absent" },
//       { date: "2024-03-07", status: "present" },
//       { date: "2024-03-06", status: "absent" },
//       { date: "2024-03-04", status: "present" },
//       { date: "2024-03-01", status: "present" },
//     ],
//     English: [
//       { date: "2024-03-14", status: "present" },
//       { date: "2024-03-12", status: "present" },
//       { date: "2024-03-10", status: "present" },
//       { date: "2024-03-08", status: "present" },
//       { date: "2024-03-06", status: "absent" },
//       { date: "2024-03-04", status: "present" },
//       { date: "2024-03-02", status: "present" },
//     ],
//     History: [
//       { date: "2024-03-13", status: "present" },
//       { date: "2024-03-11", status: "present" },
//       { date: "2024-03-08", status: "present" },
//       { date: "2024-03-06", status: "present" },
//       { date: "2024-03-04", status: "absent" },
//       { date: "2024-03-01", status: "present" },
//     ],
//     Biology: [
//       { date: "2024-03-12", status: "present" },
//       { date: "2024-03-10", status: "present" },
//       { date: "2024-03-08", status: "absent" },
//       { date: "2024-03-06", status: "present" },
//       { date: "2024-03-04", status: "late" },
//       { date: "2024-03-02", status: "present" },
//       { date: "2024-03-01", status: "absent" },
//     ],
//   };

//   const recentAttendance: AttendanceRecord[] = [
//     {
//       id: 1,
//       date: "2024-03-15",
//       subject: "Mathematics",
//       status: "present",
//       time: "09:00 AM",
//       teacher: "Ms. Johnson",
//     },
//     {
//       id: 2,
//       date: "2024-03-15",
//       subject: "Physics",
//       status: "present",
//       time: "10:30 AM",
//       teacher: "Mr. Smith",
//     },
//     {
//       id: 3,
//       date: "2024-03-14",
//       subject: "Chemistry",
//       status: "late",
//       time: "02:00 PM",
//       teacher: "Dr. Brown",
//     },
//     {
//       id: 4,
//       date: "2024-03-14",
//       subject: "English",
//       status: "present",
//       time: "11:00 AM",
//       teacher: "Mrs. Davis",
//     },
//     {
//       id: 5,
//       date: "2024-03-13",
//       subject: "Mathematics",
//       status: "absent",
//       time: "09:00 AM",
//       teacher: "Ms. Johnson",
//     },
//     {
//       id: 6,
//       date: "2024-03-13",
//       subject: "History",
//       status: "present",
//       time: "01:00 PM",
//       teacher: "Mr. Wilson",
//     },
//     {
//       id: 7,
//       date: "2024-03-12",
//       subject: "Biology",
//       status: "present",
//       time: "03:30 PM",
//       teacher: "Dr. Anderson",
//     },
//     {
//       id: 8,
//       date: "2024-03-12",
//       subject: "Physics",
//       status: "present",
//       time: "10:30 AM",
//       teacher: "Mr. Smith",
//     },
//   ];

//   const handleSubjectClick = (subject: string) => {
//     setSelectedSubjectForModal(subject);
//     setIsModalOpen(true);
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "present":
//         return <CheckCircle className="w-4 h-4 text-green-500" />;
//       case "absent":
//         return <XCircle className="w-4 h-4 text-red-500" />;
//       case "late":
//         return <Clock className="w-4 h-4 text-yellow-500" />;
//       default:
//         return null;
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "present":
//         return (
//           <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
//             Present
//           </Badge>
//         );
//       case "absent":
//         return (
//           <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
//             Absent
//           </Badge>
//         );
//       case "late":
//         return (
//           <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
//             Late
//           </Badge>
//         );
//       default:
//         return null;
//     }
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       weekday: "short",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   const formatDateForTable = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <Sidebar userRole="student" selectOption="Attendance"></Sidebar>
//       <main className="flex-1 p-6 ml-64 ">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-2xl font-semibold text-gray-900">
//               Welcome Back, Mrs. Johnson
//             </h1>
//             <p className="text-gray-600 mt-1">
//               Track your attendance and stay on top of your academic progress
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

//         {/* Attendance Overview Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <Card className="bg-white">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Total Classes</p>
//                   <p className="text-2xl font-bold text-gray-900">
//                     {attendanceStats.totalClasses}
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
//                   <Calendar className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="bg-white">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Present</p>
//                   <p className="text-2xl font-bold text-green-600">
//                     {attendanceStats.present}
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
//                   <CheckCircle className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="bg-white">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Absent</p>
//                   <p className="text-2xl font-bold text-red-600">
//                     {attendanceStats.absent}
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
//                   <XCircle className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="bg-white">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
//                   <p className="text-2xl font-bold text-blue-600">
//                     {attendanceStats.percentage}%
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
//                   <TrendingUp className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//           {/* Subject-wise Attendance */}
//           <Card className="lg:col-span-2 bg-white">
//             <CardHeader>
//               <CardTitle className="text-lg font-semibold">
//                 Subject-wise Attendance
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {subjectWiseAttendance.map((subject) => (
//                 <div key={subject.subject} className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <button
//                       onClick={() => handleSubjectClick(subject.subject)}
//                       className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer flex items-center gap-2 transition-colors"
//                     >
//                       {subject.subject}
//                       <Eye className="w-4 h-4" />
//                     </button>
//                     <div className="text-right">
//                       <span className="text-sm font-medium text-gray-900">
//                         {subject.percentage}%
//                       </span>
//                       <p className="text-xs text-gray-500">
//                         {subject.present}/{subject.total} classes
//                       </p>
//                     </div>
//                   </div>
//                   <Progress
//                     value={subject.percentage}
//                     className="h-2 [&>div]:bg-blue-500 "
//                   />
//                 </div>
//               ))}
//             </CardContent>
//           </Card>

//           {/* Attendance Summary */}
//           <Card className="bg-white">
//             <CardHeader>
//               <CardTitle className="text-lg font-semibold">
//                 Monthly Summary
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="text-center">
//                 <div className="w-24 h-24 mx-auto mb-4 relative">
//                   <svg
//                     className="w-24 h-24 transform -rotate-90"
//                     viewBox="0 0 100 100"
//                   >
//                     <circle
//                       cx="50"
//                       cy="50"
//                       r="40"
//                       stroke="#e5e7eb"
//                       strokeWidth="8"
//                       fill="transparent"
//                     />
//                     <circle
//                       cx="50"
//                       cy="50"
//                       r="40"
//                       stroke="#3b82f6"
//                       strokeWidth="8"
//                       fill="transparent"
//                       strokeDasharray={`${
//                         attendanceStats.percentage * 2.51
//                       } 251`}
//                       strokeLinecap="round"
//                     />
//                   </svg>
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <span className="text-xl font-bold text-gray-900">
//                       {attendanceStats.percentage}%
//                     </span>
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-600">Overall Attendance</p>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                     <span className="text-sm text-gray-600">Present</span>
//                   </div>
//                   <span className="text-sm font-medium">
//                     {attendanceStats.present}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//                     <span className="text-sm text-gray-600">Absent</span>
//                   </div>
//                   <span className="text-sm font-medium">
//                     {attendanceStats.absent}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//                     <span className="text-sm text-gray-600">Late</span>
//                   </div>
//                   <span className="text-sm font-medium">
//                     {attendanceStats.late}
//                   </span>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Recent Attendance Records */}
//         <Card className="bg-white">
//           <CardHeader className="flex flex-row items-center justify-between">
//             <CardTitle className="text-lg font-semibold">
//               Recent Attendance Records
//             </CardTitle>
//             <div className="flex gap-2">
//               <Select value={selectedMonth} onValueChange={setSelectedMonth}>
//                 <SelectTrigger className="w-40">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="march-2024">March 2024</SelectItem>
//                   <SelectItem value="february-2024">February 2024</SelectItem>
//                   <SelectItem value="january-2024">January 2024</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Button variant="outline" size="sm">
//                 <Download className="w-4 h-4 mr-2" />
//                 Export
//               </Button>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {recentAttendance.map((record) => (
//                 <div
//                   key={record.id}
//                   className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//                 >
//                   <div className="flex items-center gap-4">
//                     {getStatusIcon(record.status)}
//                     <div>
//                       <h3 className="font-medium text-gray-900">
//                         {record.subject}
//                       </h3>
//                       <p className="text-sm text-gray-600">
//                         {formatDate(record.date)} • {record.time} •{" "}
//                         {record.teacher}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     {getStatusBadge(record.status)}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Subject Attendance Modal */}
//         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle className="text-xl font-semibold">
//                 {selectedSubjectForModal} - Attendance Details
//               </DialogTitle>
//             </DialogHeader>
//             <div className="mt-4">
//               {selectedSubjectForModal &&
//                 subjectAttendanceDetails[selectedSubjectForModal] && (
//                   <div className="space-y-4">
//                     {/* Subject Stats */}
//                     <div className="grid grid-cols-3 gap-4 mb-6">
//                       <div className="text-center p-3 bg-green-50 rounded-lg">
//                         <p className="text-2xl font-bold text-green-600">
//                           {
//                             subjectAttendanceDetails[
//                               selectedSubjectForModal
//                             ].filter((record) => record.status === "present")
//                               .length
//                           }
//                         </p>
//                         <p className="text-sm text-gray-600">Present</p>
//                       </div>
//                       <div className="text-center p-3 bg-red-50 rounded-lg">
//                         <p className="text-2xl font-bold text-red-600">
//                           {
//                             subjectAttendanceDetails[
//                               selectedSubjectForModal
//                             ].filter((record) => record.status === "absent")
//                               .length
//                           }
//                         </p>
//                         <p className="text-sm text-gray-600">Absent</p>
//                       </div>
//                       <div className="text-center p-3 bg-yellow-50 rounded-lg">
//                         <p className="text-2xl font-bold text-yellow-600">
//                           {
//                             subjectAttendanceDetails[
//                               selectedSubjectForModal
//                             ].filter((record) => record.status === "late")
//                               .length
//                           }
//                         </p>
//                         <p className="text-sm text-gray-600">Late</p>
//                       </div>
//                     </div>

//                     {/* Attendance Table */}
//                     <div className="border rounded-lg">
//                       <Table>
//                         <TableHeader>
//                           <TableRow>
//                             <TableHead className="w-[200px]">Date</TableHead>
//                             <TableHead>Attendance Status</TableHead>
//                           </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                           {subjectAttendanceDetails[selectedSubjectForModal]
//                             .sort(
//                               (a, b) =>
//                                 new Date(b.date).getTime() -
//                                 new Date(a.date).getTime()
//                             )
//                             .map((record, index) => (
//                               <TableRow key={index}>
//                                 <TableCell className="font-medium">
//                                   {formatDateForTable(record.date)}
//                                 </TableCell>
//                                 <TableCell>
//                                   <div className="flex items-center gap-2">
//                                     {getStatusIcon(record.status)}
//                                     {getStatusBadge(record.status)}
//                                   </div>
//                                 </TableCell>
//                               </TableRow>
//                             ))}
//                         </TableBody>
//                       </Table>
//                     </div>
//                   </div>
//                 )}
//             </div>
//           </DialogContent>
//         </Dialog>
//       </main>
//     </div>
//   );
// }
