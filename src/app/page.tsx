"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full mx-auto" style={{ animation: "spin 0.8s linear infinite" }} />
        <p className="mt-4 text-[var(--gray-500)]">Loading...</p>
      </div>
    </div>
  );
}
