import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import RealtimeIndicatorToast from "@/components/RealtimeIndicatorToast";

export const metadata: Metadata = {
  title: "ThreatLens",
  description: "Threat intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            {children}
            <RealtimeIndicatorToast />
          </div>
        </div>
      </body>
    </html>
  );
}