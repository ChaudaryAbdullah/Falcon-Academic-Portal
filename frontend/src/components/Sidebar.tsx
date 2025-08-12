import { Button } from "./ui/button";
import { LayoutDashboard, Users, Star, LogOut, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  userRole: "teacher" | "student";
  selectOption: string;
}

export default function Sidebar({ userRole, selectOption }: SidebarProps) {
  const sidebarItems = [
    {
      icon: <LayoutDashboard className="w-4 h-4 mr-3" />,
      label: "Dashboard",
      path: `/${userRole}/dashboard`,
    },

    {
      icon: <Users className="w-4 h-4 mr-3" />,
      label: "Attendance",
      path: `/${userRole}/attendance`,
    },
    {
      icon: <Star className="w-4 h-4 mr-3" />,
      label: "Marks",
      path: `/${userRole}/marks`,
    },
  ];
  const navigate = useNavigate();

  return (
    <div className="fixed left-2 top-6 h-[70%] w-64 bg-white border-r rounded-xl border-gray-200 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Falcon Portal</h1>
            <p className="text-sm text-gray-500">
              {userRole === "teacher"
                ? `Teacher ${selectOption}`
                : `Student  ${selectOption}`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.label}
              variant={selectOption === item.label ? "default" : "ghost"}
              className={
                selectOption === item.label
                  ? "w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  : "w-full justify-start text-gray-600 hover:text-gray-900"
              }
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            navigate("/login");
          }}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
