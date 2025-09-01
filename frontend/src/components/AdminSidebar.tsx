"use client";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  LogOut,
  BookOpen,
  Receipt,
  LucideReceiptText,
  Percent,
  BarChart3,
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const sidebarItems = [
    {
      icon: <LayoutDashboard className="w-4 h-4 mr-3" />,
      label: "Dashboard",
      value: "dashboard",
    },
    {
      icon: <Users className="w-4 h-4 mr-3" />,
      label: "Teachers",
      value: "teachers",
    },
    {
      icon: <GraduationCap className="w-4 h-4 mr-3" />,
      label: "Students",
      value: "students",
    },
    {
      icon: <Percent className="w-4 h-4 mr-3" />,
      label: "Student Discount",
      value: "studentDiscount",
    },
    {
      icon: <LucideReceiptText className="w-4 h-4 mr-3" />,
      label: "Fee Structure",
      value: "feeStructure",
    },
    {
      icon: <BarChart3 className="w-4 h-4 mr-3" />,
      label: "Fee Reports",
      value: "fee-reports",
    },
    {
      icon: <Receipt className="w-4 h-4 mr-3" />,
      label: "Fee Management",
      value: "fees",
    },
    {
      icon: <Receipt className="w-4 h-4 mr-3" />,
      label: "Paper Fund Management",
      value: "paperFund",
    },
  ];

  return (
    <div className="fixed left-3 top-6 h-[70%] w-64 bg-white border-r rounded-xl border-gray-200 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Falcon Portal</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.label}
              variant={activeTab === item.value ? "default" : "ghost"}
              className={
                activeTab === item.value
                  ? "w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  : "w-full justify-start text-gray-600 hover:text-gray-900"
              }
              onClick={() => setActiveTab(item.value)}
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
