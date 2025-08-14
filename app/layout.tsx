import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";
import { Providers } from "./providers";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Casanova",
  description: "Proposal and Project Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Providers>
          <AuthGuard>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 overflow-auto bg-gray-100">{children}</div>
            </div>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
