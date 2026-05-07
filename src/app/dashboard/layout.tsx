"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-800 border-t-transparent" />
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold">
            Loading dashboard
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <span className="leaf-logo" />
          <span className="text-sm font-bold tracking-tight text-gray-900">GiftIt Admin</span>
        </div>
      </div>

      <div className="pt-14 lg:pt-0 lg:pl-[248px]">
        <Header />
        <main className="px-6 sm:px-10 py-8 sm:py-10 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
