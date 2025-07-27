import { CheckSquare, Home, LogOut, Settings, Users } from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

export const Navigation: React.FC = () => {
  const navItems = [
    { to: "/", icon: Home, label: "대시보드" },
    { to: "/tasks", icon: CheckSquare, label: "태스크" },
    { to: "/groups", icon: Users, label: "그룹" },
    { to: "/settings", icon: Settings, label: "설정" },
  ];

  const handleSignOut = async () => {
    try {
      // TODO: 로그아웃 기능 구현
      console.log("로그아웃");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Level Up Tracker</h1>
      </div>

      <div className="space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon className="mr-3 h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <button
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </button>
      </div>
    </nav>
  );
};
