"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Bell, Search, ChevronRight, LogOut } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  notificationCount?: number;
  actions?: ReactNode;
}

export function Header({
  title,
  breadcrumbs,
  notificationCount = 0,
  actions,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Admin";
  const initials = user ? getInitials(user.firstName, user.lastName) : "A";
  const role = user?.role || "admin";

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-gray-200 bg-white px-6 sm:px-10">
      {/* Left: Title & Breadcrumbs */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-gray-600">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-500">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {title && (
          <h1 className="truncate text-[15px] font-bold tracking-tight text-gray-900">
            {title}
          </h1>
        )}
        {!title && !breadcrumbs && (
          <span className="deck-meta">GIFTIT · ADMIN PORTAL</span>
        )}
      </div>

      {/* Right: Search, Actions, Notifications, Profile */}
      <div className="ml-4 flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search…"
            className={cn(
              "w-56 rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900",
              "placeholder:text-gray-400",
              "transition-colors focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/15"
            )}
          />
        </div>

        <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 md:hidden">
          <Search className="h-5 w-5" />
        </button>

        {actions}

        <button
          className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        <div className="hidden h-8 w-px bg-gray-200 sm:block" />

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-50 sm:gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-800 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500 font-semibold">
                {role}
              </p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-md">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500 font-semibold">
                  {role}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
