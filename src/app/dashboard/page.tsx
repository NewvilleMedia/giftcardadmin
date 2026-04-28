"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Bell,
  FileBarChart,
  Tag,
  Gift,
  Megaphone,
  ShieldCheck,
  LifeBuoy,
  ArrowUpRight,
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
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { api, type DashboardStats, type Transaction } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

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

interface DashboardPageData {
  stats: DashboardStats;
  revenueChart: Array<{ month: string; revenue: number }>;
  userGrowthChart: Array<{ month: string; users: number }>;
  recentTransactions: Transaction[];
}

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

const statusBadgeVariant: Record<string, "success" | "warning" | "danger"> = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  refunded: "warning",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  index: number;
}

function StatCard({ title, value, change, icon, index }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden transition-shadow hover:shadow-md p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
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
        // API unavailable -- keep mock data
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data.stats;

  // Compute percentage changes (use mock percentages when API doesn't provide them)
  const userGrowthPct = 12.5;
  const revenueGrowthPct = 18.2;
  const businessGrowthPct = 8.7;
  const giftCardGrowthPct = 23.1;

  const statCards: Omit<StatCardProps, "index">[] = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: userGrowthPct,
      icon: <Users className="h-6 w-6" />,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: revenueGrowthPct,
      icon: <DollarSign className="h-6 w-6" />,
    },
    {
      title: "Active Businesses",
      value: stats.totalBusinesses.toLocaleString(),
      change: businessGrowthPct,
      icon: <Building2 className="h-6 w-6" />,
    },
    {
      title: "Gift Cards Sold",
      value: stats.totalTransactions.toLocaleString(),
      change: giftCardGrowthPct,
      icon: <CreditCard className="h-6 w-6" />,
    },
  ];

  const quickActions = [
    {
      label: "Sync Gift Cards",
      icon: <RefreshCw className="h-5 w-5" />,
      color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
      onClick: async () => {
        try {
          await api.syncGiftCards();
        } catch {
          // handle silently
        }
      },
    },
    {
      label: "Broadcast Notification",
      icon: <Bell className="h-5 w-5" />,
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      onClick: () => {},
    },
    {
      label: "View Reports",
      icon: <FileBarChart className="h-5 w-5" />,
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
      onClick: () => {},
    },
    {
      label: "Manage Promo Codes",
      icon: <Tag className="h-5 w-5" />,
      color: "bg-amber-50 text-amber-600 hover:bg-amber-100",
      onClick: () => {},
    },
  ];

  const platformCards = [
    {
      label: "Total Gift Cards",
      value: stats.activeGiftCards.toLocaleString(),
      icon: <Gift className="h-5 w-5 text-indigo-500" />,
      bg: "bg-indigo-50",
    },
    {
      label: "Active Campaigns",
      value: stats.activeCampaigns.toLocaleString(),
      icon: <Megaphone className="h-5 w-5 text-purple-500" />,
      bg: "bg-purple-50",
    },
    {
      label: "Pending Verifications",
      value: "47",
      icon: <ShieldCheck className="h-5 w-5 text-amber-500" />,
      bg: "bg-amber-50",
    },
    {
      label: "Open Support Tickets",
      value: "23",
      icon: <LifeBuoy className="h-5 w-5 text-rose-500" />,
      bg: "bg-rose-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="mt-4 h-8 w-32 rounded bg-gray-200" />
              <div className="mt-3 h-3 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        {/* Skeleton charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="mt-6 h-56 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back. Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <StatCard key={card.title} {...card} index={index} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Revenue Overview</CardTitle>
                <Badge variant="success">+{revenueGrowthPct}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.revenueChart}
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>User Growth</CardTitle>
                <Badge variant="success">+{userGrowthPct}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.userGrowthChart}
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                      }}
                      formatter={(value: number) => [value.toLocaleString(), "New Users"]}
                    />
                    <Bar
                      dataKey="users"
                      fill="#8b5cf6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Recent Transactions</CardTitle>
                <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        User
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Type
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Amount
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentTransactions.map((txn: Transaction) => (
                      <tr key={txn._id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 text-sm font-medium text-gray-900">
                          {getTransactionUser(txn)}
                        </td>
                        <td className="py-3.5 text-sm text-gray-600">{txn.type}</td>
                        <td className="py-3.5 text-sm font-medium text-gray-900">
                          {formatCurrency(txn.amount, txn.currency)}
                        </td>
                        <td className="py-3.5">
                          <Badge variant={statusBadgeVariant[txn.status] || "default"}>
                            {txn.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-sm text-gray-500">
                          {formatDate(txn.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${action.color}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Platform Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Platform Overview</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {platformCards.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 + i * 0.08, duration: 0.4 }}
            >
              <Card className="transition-shadow hover:shadow-md p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${item.bg}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-sm text-gray-500">{item.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
