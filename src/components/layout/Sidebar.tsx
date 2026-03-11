"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Gift,
  ArrowLeftRight,
  Megaphone,
  Ticket,
  ScrollText,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Businesses", href: "/dashboard/businesses", icon: Building2 },
  { label: "Gift Cards", href: "/dashboard/gift-cards", icon: Gift },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Promo Codes", href: "/dashboard/promo-codes", icon: Ticket },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText },
];

const sidebarVariants = {
  expanded: { width: 256 },
  collapsed: { width: 72 },
};

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col",
        "border-r border-white/20",
        "bg-white/70 backdrop-blur-xl shadow-lg"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-gray-200/50 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/25">
          <Gift className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-lg font-bold text-gray-900">GiftIt</h1>
              <p className="-mt-0.5 text-xs text-gray-500">Admin Portal</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center rounded-lg text-sm font-medium transition-colors",
                    collapsed
                      ? "justify-center px-0 py-2.5"
                      : "gap-3 px-3 py-2.5",
                    isActive
                      ? "text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-indigo-50 border border-indigo-100/50"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.4,
                      }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "relative z-10 h-5 w-5 shrink-0",
                      isActive
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="relative z-10 overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200/50 p-3 space-y-1">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100/70 hover:text-gray-700",
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">Collapse</span>
            </>
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700",
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut
            className={cn(
              "h-5 w-5 shrink-0",
              "text-gray-400 group-hover:text-red-500"
            )}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
