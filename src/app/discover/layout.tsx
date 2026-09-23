import React from "react";
import { ViewerNav } from "@/components/library/ViewerNav";

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ViewerNav />
      <main className="flex-grow">{children}</main>
    </div>
  );
}