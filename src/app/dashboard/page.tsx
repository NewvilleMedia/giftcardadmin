"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Gift,
  Megaphone,
  ShieldCheck,
  LifeBuoy,
  RefreshCw,
  Bell,
  FileBarChart,
  Tag,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api, type DashboardStats, type Transaction } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock / fallback data
// ---------------------------------------------------------------------------

const MOCK_REVENUE_CHART = [
  { month: "Jan", revenue: 12400 },
  { month: "Feb", revenue: 18200 },
  { month: "Mar", revenue: 22100 },
  { month: "Apr", revenue: 28500 },
  { month: "May", revenue: 35200 },
  { month: "Jun", revenue: 42800 },
  { month: "Jul", revenue: 48100 },
];

const MOCK_USER_GROWTH_CHART = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 185 },
  { month: "Mar", users: 240 },
  { month: "Apr", users: 310 },
  { month: "May", users: 425 },
  { month: "Jun", users: 520 },
  { month: "Jul", users: 680 },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    _id: "txn_001",
    type: "Gift Card Purchase",
    amount: 75.0,
    currency: "USD",
    status: "completed",
    createdAt: "2026-03-11T14:22:00Z",
    userId: { _id: "u1", firstName: "Sarah", lastName: "Mitchell", email: "sarah@example.com" },
  },
  {
    _id: "txn_002",
    type: "Business Redemption",
    amount: 150.0,
    currency: "USD",
    status: "completed",
    createdAt: "2026-03-11T13:45:00Z",
    userId: { _id: "u2", firstName: "James", lastName: "Rodriguez", email: "james@example.com" },
  },
  {
    _id: "txn_003",
    type: "Gift Card Purchase",
    amount: 50.0,
    currency: "USD",
    status: "pending",
    createdAt: "2026-03-11T12:10:00Z",
    userId: { _id: "u3", firstName: "Emily", lastName: "Chen", email: "emily@example.com" },
  },
  {
    _id: "txn_004",
    type: "Refund",
    amount: 25.0,
    currency: "USD",
    status: "failed",
    createdAt: "2026-03-11T11:30:00Z",
    userId: { _id: "u4", firstName: "Michael", lastName: "Brown", email: "michael@example.com" },
  },
  {
    _id: "txn_005",
    type: "Gift Card Purchase",
    amount: 200.0,
    currency: "USD",
    status: "completed",
    createdAt: "2026-03-11T10:05:00Z",
    userId: { _id: "u5", firstName: "Olivia", lastName: "Davis", email: "olivia@example.com" },
  },
];

const MOCK_STATS: DashboardStats = {
  totalUsers: 52480,
  totalBusinesses: 1234,
  totalTransactions: 38920,
  totalRevenue: 2418500,
  activeGiftCards: 4820,
  activeCampaigns: 18,
  recentTransactions: MOCK_TRANSACTIONS,
  userGrowth: MOCK_USER_GROWTH_CHART.map((d) => ({ date: d.month, count: d.users })),
  revenueByDay: MOCK_REVENUE_CHART.map((d) => ({ date: d.month, amount: d.revenue })),
};

interface DashboardPageData {
  stats: DashboardStats;
  revenueChart: Array<{ month: string; revenue: number }>;
  userGrowthChart: Array<{ month: string; users: number }>;
  recentTransactions: Transaction[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTransactionUser(txn: Transaction): string {
  if (typeof txn.userId === "object" && txn.userId !== null && txn.userId !== undefined) {
    const u = txn.userId as { firstName: string; lastName: string };
    return `${u.firstName} ${u.lastName}`;
  }
  return String(txn.userId || "Unknown");
}

const statusBadge: Record<string, string> = {
  completed: "bg-[#d6f0e0] text-green-800",
  pending: "bg-amber-50 text-amber-800",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-amber-50 text-amber-800",
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function formatRevenue(n: number): { v: string; sm: string } {
  if (n >= 1_000_000) return { v: (n / 1_000_000).toFixed(2).replace(/\.?0+$/, ""), sm: "M" };
  if (n >= 1_000) return { v: (n / 1_000).toFixed(1).replace(/\.0$/, ""), sm: "K" };
  return { v: String(n), sm: "" };
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPageData>({
    stats: MOCK_STATS,
    revenueChart: MOCK_REVENUE_CHART,
    userGrowthChart: MOCK_USER_GROWTH_CHART,
    recentTransactions: MOCK_TRANSACTIONS,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboard() {
      try {
        const result = await api.getDashboard();
        if (!cancelled) {
          const revenueChart = result.revenueByDay
            ? result.revenueByDay.map((d) => ({ month: d.date, revenue: d.amount }))
            : MOCK_REVENUE_CHART;
          const userGrowthChart = result.userGrowth
            ? result.userGrowth.map((d) => ({ month: d.date, users: d.count }))
            : MOCK_USER_GROWTH_CHART;
          setData({
            stats: { ...MOCK_STATS, ...result },
            revenueChart,
            userGrowthChart,
            recentTransactions: result.recentTransactions || MOCK_TRANSACTIONS,
          });
        }
      } catch {
        /* keep mock data */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data.stats;
  const rev = formatRevenue(stats.totalRevenue);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ============ HERO ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>

        {/* Hero stat band */}
        <div className="deck-hero-stats mt-6">
          <div className="deck-hero-stat">
            <div className="v">{formatNum(stats.totalUsers)}</div>
            <div className="l">Total Users</div>
          </div>
          <div className="deck-hero-stat">
            <div className="v">
              <span className="sm">$</span>
              {rev.v}
              <span className="sm">{rev.sm}</span>
            </div>
            <div className="l">Total Revenue</div>
          </div>
          <div className="deck-hero-stat">
            <div className="v">{formatNum(stats.totalBusinesses)}</div>
            <div className="l">Active Businesses</div>
          </div>
          <div className="deck-hero-stat">
            <div className="v">{formatNum(stats.totalTransactions)}</div>
            <div className="l">Transactions</div>
          </div>
        </div>
      </motion.section>

      {/* ============ KPIs ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h2 className="mb-5 text-base font-semibold text-gray-900">Platform metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="deck-kpi">
            <div className="lbl">Active Gift Cards</div>
            <div className="v green">{formatNum(stats.activeGiftCards)}</div>
            <div className="delta">↑ 23.1% vs last month</div>
          </div>
          <div className="deck-kpi">
            <div className="lbl">Active Campaigns</div>
            <div className="v">{stats.activeCampaigns}</div>
            <div className="delta">↑ 8.7% vs last month</div>
          </div>
          <div className="deck-kpi">
            <div className="lbl">Pending Verifications</div>
            <div className="v">47</div>
            <div className="delta down">↑ 12 awaiting review</div>
          </div>
        </div>
      </motion.section>

      {/* ============ CHARTS ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <h2 className="mb-5 text-base font-semibold text-gray-900">Trends</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Revenue */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-1 flex items-center justify-between">
              <span className="deck-label">Revenue</span>
              <span className="text-xs font-semibold text-green-800">+18.2%</span>
            </div>
            <div className="mb-4 text-3xl font-bold tracking-tight text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a5d3a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1a5d3a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ebe9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#6b7d72" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7d72" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e8ebe9",
                      borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(13,31,23,0.06)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1a5d3a"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Growth */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-1 flex items-center justify-between">
              <span className="deck-label">User Growth</span>
              <span className="text-xs font-semibold text-green-800">+12.5%</span>
            </div>
            <div className="mb-4 text-3xl font-bold tracking-tight text-gray-900">
              {formatNum(stats.totalUsers)}
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.userGrowthChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ebe9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#6b7d72" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7d72" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e8ebe9",
                      borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(13,31,23,0.06)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="users" fill="#1a5d3a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ============ RECENT TRANSACTIONS ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="mb-5 text-base font-semibold text-gray-900">Recent transactions</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="deck-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Status</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.slice(0, 5).map((txn) => (
                <tr key={txn._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d6f0e0] text-[11px] font-semibold text-green-800">
                        {getTransactionUser(txn)
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="font-medium">{getTransactionUser(txn)}</span>
                    </div>
                  </td>
                  <td className="text-gray-600">{txn.type}</td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        statusBadge[txn.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="r">{formatCurrency(txn.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ============ FEATURE CARDS — QUICK ACTIONS ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <h2 className="mb-5 text-base font-semibold text-gray-900">Quick actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { num: "01", label: "Sync Gift Cards", desc: "Pull the latest catalog from Runa.", icon: <RefreshCw className="h-5 w-5" />, onClick: () => api.syncGiftCards().catch(() => {}) },
            { num: "02", label: "Broadcast Notification", desc: "Send a push to all users.", icon: <Bell className="h-5 w-5" />, onClick: () => {} },
            { num: "03", label: "View Reports", desc: "Revenue, growth, retention exports.", icon: <FileBarChart className="h-5 w-5" />, onClick: () => {} },
            { num: "04", label: "Manage Promo Codes", desc: "Create, edit, and validate codes.", icon: <Tag className="h-5 w-5" />, onClick: () => {} },
          ].map((a) => (
            <button
              key={a.num}
              onClick={a.onClick}
              className="deck-feature group cursor-pointer text-left transition-all hover:border-green-700 hover:shadow-sm"
            >
              <div className="num">{a.num}</div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-800">
                {a.icon}
              </div>
              <h4>{a.label}</h4>
              <p>{a.desc}</p>
              <ArrowRight className="mt-3 h-4 w-4 text-green-800 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </motion.section>

    </div>
  );
}
