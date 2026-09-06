import React from "react";
import { CreatorSidebar } from "@/components/creator/CreatorSidebar";
import { CreatorGuard } from "@/components/creator/CreatorGuard";

export const metadata = {
  title: "EVO Creator Studio — Dashboard & Upload Pipeline",
  description: "Manage Hub branding, upload 4K HLS videos, build viewership and track long-form watch time.",
};

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreatorGuard>
      <div className="flex min-h-screen bg-gray-50/50">
        <CreatorSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {children}
        </div>
      </div>
    </CreatorGuard>
  );
}
