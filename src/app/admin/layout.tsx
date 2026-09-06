"use client";

import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminGuard } from "@/components/admin/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
