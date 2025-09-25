"use client";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
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
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

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

  // Enhanced screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize("mobile");
      } else {
        setScreenSize("desktop"); // Treat tablet and desktop the same
      }

      // Close mobile menu on larger screens
      if (width >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && screenSize === "mobile") {
        const target = event.target as HTMLElement;
        if (
          !target.closest(".mobile-sidebar") &&
          !target.closest(".hamburger-button")
        ) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen, screenSize]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (screenSize === "mobile") {
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    navigate("/login");
    if (screenSize === "mobile") {
      setIsMobileMenuOpen(false);
    }
  };

  // Mobile version (< 768px)
  if (screenSize === "mobile") {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base text-gray-900">
                  Falcon Portal
                </h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hamburger-button p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`mobile-sidebar fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white transform transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-2xl ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile Logo Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-gray-900">
                    Falcon Portal
                  </h1>
                  <p className="text-sm text-gray-500">Admin Panel</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <Button
                  key={item.label}
                  variant={activeTab === item.value ? "default" : "ghost"}
                  className={
                    activeTab === item.value
                      ? "w-full justify-start bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
                      : "w-full justify-start text-gray-600 hover:text-gray-900 h-12 text-base"
                  }
                  onClick={() => handleTabChange(item.value)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          </nav>

          {/* Mobile Logout */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 text-base"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Log Out
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar (same style as original, but with better height handling)
  return (
    <div className="fixed left-3 top-4 w-64 bg-white border-r rounded-xl border-gray-200 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
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
      <nav className="flex-1 p-4 overflow-y-auto min-h-0">
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
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
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
