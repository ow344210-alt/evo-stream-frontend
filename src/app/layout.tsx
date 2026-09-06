import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { GlobalToast } from "@/components/ui/GlobalToast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "EVO — Watch Bold. Watch Original. Watch EVO.",
  description:
    "EVO is the free, creator-driven video platform. Creators grow engaged audiences with long-form uploads, and consistent viewership builds content value that attracts advertisers to Hubs.",
  keywords: [
    "EVO",
    "video streaming",
    "creator platform",
    "long-form video",
    "creator hubs",
  ],
  authors: [{ name: "EVO Network" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-white text-evo-dark-text antialiased selection:bg-evo-red selection:text-white">
        <AuthProvider>
          {children}
          <GlobalToast />
        </AuthProvider>
      </body>
    </html>
  );
}
