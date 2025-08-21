import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./pages/login";
import StudentDashboard from "./pages/studentDashboard";
import TeacherDashboard from "./pages/teacherDasboard";
import { AttendancePage } from "./pages/takeAttendance";
import { StudentAttendancePage } from "./pages/viewAttendance";
import { StudentMarksPage } from "./pages/viewMarks";
import { TeacherMarksPage } from "./pages/giveMarks";
import AdminDashboard from "./pages/adminDashboard";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />}></Route>
          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          ></Route>
          <Route
            path="/teacher/dashboard"
            element={<TeacherDashboard />}
          ></Route>
          <Route
            path="/teacher/attendance"
            element={<AttendancePage />}
          ></Route>
          <Route path="/teacher/marks" element={<TeacherMarksPage />}></Route>
          <Route
            path="/student/attendance"
            element={<StudentAttendancePage />}
          ></Route>{" "}
          <Route path="/student/marks" element={<StudentMarksPage />}></Route>
          <Route path="/admin" element={<AdminDashboard />}></Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
