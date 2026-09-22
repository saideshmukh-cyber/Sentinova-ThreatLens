import type { Metadata } from "next";
import "./globals.css";
import SocShell from "@/components/SocShell";

export const metadata: Metadata = {
  title: "ThreatLens | CTI Operations",
  description: "Cyber threat intelligence operations dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#071018] text-slate-100 antialiased">
        <SocShell>{children}</SocShell>
      </body>
    </html>
  );
}
