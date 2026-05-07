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
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const navGroups: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Marketplace",
    items: [
      { label: "Users", href: "/dashboard/users", icon: Users },
      { label: "Businesses", href: "/dashboard/businesses", icon: Building2 },
      { label: "Gift Cards", href: "/dashboard/gift-cards", icon: Gift },
      { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { label: "Promo Codes", href: "/dashboard/promo-codes", icon: Ticket },
      { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText },
    ],
  },
  {
    section: "Account",
    items: [{ label: "Settings", href: "/dashboard/settings", icon: Settings }],
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarContent = (mobile: boolean) => (
    <>
      {/* Brand */}
      <div className="flex h-[68px] items-center justify-between border-b border-gray-200 px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={mobile ? onMobileClose : undefined}
        >
          <span className="leaf-logo lg" />
          {(mobile || !collapsed) && (
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold tracking-tight text-gray-900">GiftIt</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                Admin
              </span>
            </div>
          )}
        </Link>
        {mobile && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.section} className="mb-2">
            {(mobile || !collapsed) && (
              <div className="deck-nav-section">{group.section}</div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={mobile ? onMobileClose : undefined}
                      title={!mobile && collapsed ? item.label : undefined}
                      className={cn(
                        "deck-nav-link",
                        !mobile && collapsed && "justify-center px-0",
                        isActive && "active"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive ? "text-green-800" : "text-gray-400"
                        )}
                      />
                      {(mobile || !collapsed) && (
                        <span className="whitespace-nowrap">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 space-y-0.5">
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn("deck-nav-link w-full", collapsed && "justify-center px-0")}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-[18px] w-[18px] shrink-0 text-gray-400" />
            ) : (
              <>
                <ChevronsLeft className="h-[18px] w-[18px] shrink-0 text-gray-400" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={() => {
            logout();
            if (mobile) onMobileClose();
          }}
          className={cn(
            "deck-nav-link w-full hover:!bg-red-50 hover:!text-red-700",
            !mobile && collapsed && "justify-center px-0"
          )}
          title={!mobile && collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-400" />
          {(mobile || !collapsed) && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-gray-200 bg-white lg:hidden"
          >
            {sidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 248 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-gray-200 bg-white"
      >
        {sidebarContent(false)}
      </motion.aside>
    </>
  );
}
