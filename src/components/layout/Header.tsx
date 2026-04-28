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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : "Admin";
  const initials = user
    ? getInitials(user.firstName, user.lastName)
    : "A";
  const role = user?.role || "admin";

  return (
    <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center justify-between border-b border-gray-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-sm">
      {/* Left: Title & Breadcrumbs */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-gray-600 transition-colors"
                  >
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
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h1>
        )}
      </div>

      {/* Right: Search, Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 ml-4">
        {/* Search - hidden on small screens */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className={cn(
              "w-48 lg:w-64 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900",
              "placeholder:text-gray-400",
              "transition-colors focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            )}
          />
        </div>

        {/* Search icon for mobile */}
        <button className="md:hidden rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <Search className="h-5 w-5" />
        </button>

        {/* Extra actions slot */}
        {actions}

        {/* Notification bell */}
        <button
          className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        {/* Divider - hidden on very small screens */}
        <div className="hidden sm:block h-8 w-px bg-gray-200" />

        {/* Profile dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 sm:gap-3 rounded-lg p-1.5 transition-colors hover:bg-gray-50"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-lg z-50">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
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
