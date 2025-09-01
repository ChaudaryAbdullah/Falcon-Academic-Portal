// import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// import { Card, CardContent } from "../components/ui/card";
// import { Badge } from "../components/ui/badge";
// import Sidebar from "../components/Sidebar";
// import { User, BookOpen, Users } from "lucide-react";
// import { useState, useEffect } from "react";

// export default function TeacherDashboard() {
//   const todaysSchedule = [
//     {
//       id: 1,
//       title: "Grade 10A - Algebra",
//       time: "9:00 AM - 9:45 AM",
//       room: "Room 204",
//       isActive: true,
//     },
//     {
//       id: 2,
//       title: "Grade 9B - Geometry",
//       time: "10:00 AM - 10:45 AM",
//       room: "Room 204",
//       isActive: false,
//     },
//     {
//       id: 3,
//       title: "Grade 11C - Calculus",
//       time: "2:00 PM - 2:45 PM",
//       room: "Room 204",
//       isActive: false,
//     },
//   ];

//   const teacherInfo = {
//     name: "Sarah Johnson",
//     subject: "Mathematics",
//     classes: todaysSchedule.length,
//   };

//   const [currentTime, setCurrentTime] = useState(new Date());

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 60000); // update every minute
//     return () => clearInterval(interval);
//   }, []);

//   // Helper to parse time range string to Date objects (today's date)
//   function parseTimeRange(timeRange: string) {
//     const [start, end] = timeRange.split(" - ");
//     const today = new Date();
//     const parse = (t: string) => {
//       const [time, modifier] = t.split(" ");
//       let [hours, minutes] = time.split(":").map(Number);
//       if (modifier === "PM" && hours !== 12) hours += 12;
//       if (modifier === "AM" && hours === 12) hours = 0;
//       const d = new Date(today);
//       d.setHours(hours, minutes, 0, 0);
//       return d;
//     };
//     return { start: parse(start), end: parse(end) };
//   }

//   // Determine which schedule is active
//   const scheduleWithActive = todaysSchedule.map((schedule) => {
//     const { start, end } = parseTimeRange(schedule.time);
//     const isActive = currentTime >= start && currentTime <= end;
//     return { ...schedule, isActive };
//   });

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       <Sidebar userRole="teacher" selectOption="Dashboard" />

//       <main className="flex-1 p-6 ml-64">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-2xl font-semibold text-gray-900">
//               Welcome back, Ms. Johnson
//             </h1>
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

//         {/* Teacher Information */}
//         <div className="mb-8">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">
//             Teacher Information
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
//                       {teacherInfo.name}
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-orange-50 border-orange-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
//                     <BookOpen className="w-5 h-5 text-orange-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Subject</p>
//                     <p className="font-semibold text-gray-900">
//                       {teacherInfo.subject}
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-green-50 border-green-200">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
//                     <Users className="w-5 h-5 text-green-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Classes</p>
//                     <p className="font-semibold text-gray-900">
//                       {teacherInfo.classes}
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
//             {scheduleWithActive.map((schedule) => (
//               <Card
//                 key={schedule.id}
//                 className={`${
//                   schedule.isActive
//                     ? "border-l-4 border-l-blue-500 bg-blue-50"
//                     : "bg-white"
//                 }`}
//               >
//                 <CardContent className="p-4">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <h3 className="font-semibold text-gray-900">
//                         {schedule.title}
//                       </h3>
//                       <p className="text-sm text-gray-600">{schedule.time}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm text-gray-600">{schedule.room}</p>
//                       {schedule.isActive && (
//                         <Badge
//                           variant="secondary"
//                           className="bg-blue-100 text-blue-700"
//                         >
//                           Current
//                         </Badge>
//                       )}
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
