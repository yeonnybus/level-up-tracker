import { Navigation } from "@/components/Navigation";
import React from "react";
import { Outlet } from "react-router-dom";

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
