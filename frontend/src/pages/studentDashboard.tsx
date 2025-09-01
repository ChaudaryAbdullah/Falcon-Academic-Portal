// import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// import { Card, CardContent } from "../components/ui/card";
// import { Badge } from "../components/ui/badge";
// import Sidebar from "../components/Sidebar";
// import { User, FileText, Calendar } from "lucide-react";

// export default function StudentDashboard() {
//   const todaysSchedule = [
//     {
//       id: 1,
//       title: "Grade 10A - Algebra",
//       startTime: "09:00",
//       endTime: "10:00",
//       room: "Room 101",
//     },
//     {
//       id: 2,
//       title: "Grade 10B - Geometry",
//       startTime: "10:30",
//       endTime: "11:30",
//       room: "Room 105",
//     },
//     {
//       id: 3,
//       title: "Grade 10A - Calculus",
//       startTime: "13:00",
//       endTime: "14:30",
//       room: "Room 102",
//     },
//     {
//       id: 4,
//       title: "Grade 10A - Statistics",
//       startTime: "14:30",
//       endTime: "15:30",
//       room: "Room 103",
//     },
//   ];
//   const studentInfo = {
//     name: "Sarah Johnson",
//     standard: "10TH",
//     totalClasses: todaysSchedule.length,
//   };

//   // Helper to get status
//   function getClassStatus(start: string, end: string) {
//     const now = new Date();
//     const [startHour, startMinute] = start.split(":").map(Number);
//     const [endHour, endMinute] = end.split(":").map(Number);
//     const startTime = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate(),
//       startHour,
//       startMinute
//     );
//     const endTime = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate(),
//       endHour,
//       endMinute
//     );
//     if (now < startTime) return "Upcoming";
//     if (now >= startTime && now <= endTime) return "On Going";
//     return "Ended";
//   }

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       <Sidebar userRole="student" selectOption="Dashboard" />

//       <main className="flex-1 p-6 ml-64">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-2xl font-semibold text-gray-900">
//               Welcome Back, Mrs. Johnson
//             </h1>
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

//         {/* Student Information */}
//         <div className="mb-8">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">
//             Student Information
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <Card className="bg-blue-50 border-blue-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                     <User className="w-5 h-5 text-blue-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Name</p>
//                     <p className="font-semibold text-gray-900">
//                       {studentInfo.name}
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-green-50 border-green-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
//                     <FileText className="w-5 h-5 text-green-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Standard</p>
//                     <p className="font-semibold text-gray-900">
//                       {studentInfo.standard}
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-purple-50 border-purple-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
//                     <Calendar className="w-5 h-5 text-purple-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Total Classes</p>
//                     <p className="font-semibold text-gray-900">
//                       {studentInfo.totalClasses}
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         {/* Today's Schedule */}
//         <div>
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">
//             {"Today's Schedule"}
//           </h2>
//           <div className="space-y-4">
//             {todaysSchedule.map((schedule) => {
//               const status = getClassStatus(
//                 schedule.startTime,
//                 schedule.endTime
//               );
//               return (
//                 <Card
//                   key={schedule.id}
//                   className={`${
//                     status === "On Going"
//                       ? "border-l-4 border-l-blue-500 bg-blue-50"
//                       : status === "Ended"
//                       ? "bg-gray-100"
//                       : "bg-white"
//                   }`}
//                 >
//                   <CardContent className="p-4">
//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center gap-4">
//                         <div className="text-sm font-medium text-blue-600 min-w-[80px]">
//                           {`${schedule.startTime} - ${schedule.endTime}`}
//                         </div>
//                         <div>
//                           <h3 className="font-semibold text-gray-900">
//                             {schedule.title}
//                           </h3>
//                           <p className="text-sm text-gray-600">
//                             {schedule.room}
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <Badge
//                           variant={
//                             status === "On Going"
//                               ? "default"
//                               : status === "Upcoming"
//                               ? "secondary"
//                               : "outline"
//                           }
//                           className={
//                             status === "On Going"
//                               ? "bg-blue-600"
//                               : status === "Upcoming"
//                               ? "bg-gray-100 text-gray-600"
//                               : "bg-gray-300 text-gray-500"
//                           }
//                         >
//                           {status}
//                         </Badge>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               );
//             })}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
