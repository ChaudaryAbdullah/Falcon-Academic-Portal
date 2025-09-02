import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import LoginForm from "./pages/login";
import AdminDashboard from "./pages/adminDashboard";

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* <Route path="/" element={<LoginForm />}></Route> */}
          <Route path="/admin" element={<AdminDashboard />}></Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
