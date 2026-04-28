"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  CheckCircle2,
  X,
  Clock,
  User,
  Shield,
  Activity,
  Filter,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  _id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

interface AuditLogsResponse {
  auditLogs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: {
    totalLogs: number;
    todayActions: number;
    uniqueUsers: number;
    criticalActions: number;
  };
}

interface Filters {
  action: string;
  resourceType: string;
  startDate: string;
  endDate: string;
  userId: string;
}

const actionOptions = [
  "all",
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "ban",
  "unban",
  "verify",
  "suspend",
  "refund",
  "sync",
  "broadcast",
];

const resourceTypeOptions = [
  "all",
  "user",
  "business",
  "giftcard",
  "transaction",
  "campaign",
  "promocode",
  "settings",
  "notification",
];

const actionBadgeVariant: Record<string, "green" | "blue" | "red" | "gray" | "purple" | "yellow" | "orange"> = {
  create: "green",
  update: "blue",
  delete: "red",
  login: "gray",
  logout: "gray",
  ban: "red",
  unban: "green",
  verify: "green",
  suspend: "orange",
  refund: "purple",
  sync: "blue",
  broadcast: "yellow",
};

const mockLogs: AuditLog[] = [
  {
    _id: "log_001",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user: { id: "admin_01", name: "Xavier Lampkin", email: "xavier@giftit.com" },
    action: "ban",
    resourceType: "user",
    resourceId: "usr_4f8a2b1c",
    description: "Banned user for fraudulent activity. Multiple chargebacks detected.",
    details: { reason: "Fraudulent activity", chargebackCount: 3 },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    before: { status: "active" },
    after: { status: "banned" },
  },
  {
    _id: "log_002",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    user: { id: "admin_01", name: "Xavier Lampkin", email: "xavier@giftit.com" },
    action: "verify",
    resourceType: "business",
    resourceId: "biz_7e3d9f0a",
    description: "Verified business account after document review.",
    details: { documentsReviewed: ["businessLicense", "taxId"] },
    ipAddress: "192.168.1.100",
    before: { verified: false },
    after: { verified: true },
  },
  {
    _id: "log_003",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    user: null,
    action: "sync",
    resourceType: "giftcard",
    resourceId: "sync_batch_20260311",
    description: "Automated gift card catalog sync with Runa API. 47 cards updated, 3 new cards added.",
    details: { cardsUpdated: 47, cardsAdded: 3, cardsRemoved: 0, duration: "12.4s" },
  },
  {
    _id: "log_004",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    user: { id: "admin_02", name: "Sarah Chen", email: "sarah@giftit.com" },
    action: "refund",
    resourceType: "transaction",
    resourceId: "txn_9c1b5e8f",
    description: "Processed refund for duplicate charge. Customer reported being charged twice.",
    details: { amount: 50.0, currency: "USD", originalTransactionId: "txn_8a2c4d6e" },
    ipAddress: "10.0.0.55",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    before: { status: "completed", refunded: false },
    after: { status: "refunded", refunded: true, refundAmount: 50.0 },
  },
  {
    _id: "log_005",
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    user: { id: "admin_01", name: "Xavier Lampkin", email: "xavier@giftit.com" },
    action: "update",
    resourceType: "settings",
    resourceId: "settings_main",
    description: "Updated platform commission rate from 5% to 4.5%.",
    details: { field: "commissionRate", oldValue: 5, newValue: 4.5 },
    ipAddress: "192.168.1.100",
    before: { commissionRate: 5 },
    after: { commissionRate: 4.5 },
  },
];

function truncateId(id: string, length: number = 12): string {
  if (id.length <= length) return id;
  return id.slice(0, length) + "...";
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayActions: 0,
    uniqueUsers: 0,
    criticalActions: 0,
  });

  const [filters, setFilters] = useState<Filters>({
    action: "all",
    resourceType: "all",
    startDate: "",
    endDate: "",
    userId: "",
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(
    async (currentPage: number) => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: "15",
        };

        if (filters.action !== "all") params.action = filters.action;
        if (filters.resourceType !== "all") params.resourceType = filters.resourceType;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.userId.trim()) params.userId = filters.userId.trim();

        const data = (await api.getAuditLogs(params)) as unknown as AuditLogsResponse;

        if (data && data.auditLogs) {
          setLogs(data.auditLogs);
          setTotalPages(data.pagination?.pages || 1);
          setTotalLogs(data.pagination?.total || data.auditLogs.length);
          if (data.stats) {
            setStats(data.stats);
          }
        } else {
          setLogs(mockLogs);
          setTotalPages(1);
          setTotalLogs(mockLogs.length);
          setStats({
            totalLogs: mockLogs.length,
            todayActions: mockLogs.filter(
              (l) =>
                new Date(l.timestamp).toDateString() === new Date().toDateString()
            ).length,
            uniqueUsers: new Set(mockLogs.filter((l) => l.user).map((l) => l.user!.id))
              .size,
            criticalActions: mockLogs.filter((l) =>
              ["ban", "delete", "refund", "suspend"].includes(l.action)
            ).length,
          });
        }
      } catch {
        setLogs(mockLogs);
        setTotalPages(1);
        setTotalLogs(mockLogs.length);
        setStats({
          totalLogs: mockLogs.length,
          todayActions: mockLogs.filter(
            (l) =>
              new Date(l.timestamp).toDateString() === new Date().toDateString()
          ).length,
          uniqueUsers: new Set(mockLogs.filter((l) => l.user).map((l) => l.user!.id))
            .size,
          criticalActions: mockLogs.filter((l) =>
            ["ban", "delete", "refund", "suspend"].includes(l.action)
          ).length,
        });
        setError("Failed to load audit logs from server. Showing sample data.");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs(page);
      }, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, fetchLogs, page]);

  function clearFilters() {
    setFilters({
      action: "all",
      resourceType: "all",
      startDate: "",
      endDate: "",
      userId: "",
    });
    setPage(1);
  }

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const filtersActive =
    filters.action !== "all" ||
    filters.resourceType !== "all" ||
    filters.startDate !== "" ||
    filters.endDate !== "" ||
    filters.userId.trim() !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all administrative actions and system events.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Auto-refresh</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                autoRefresh ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoRefresh ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <Button
            variant="secondary"
            onClick={() => fetchLogs(page)}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Logs</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalLogs.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Actions</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.todayActions.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unique Users</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.uniqueUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Critical Actions</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.criticalActions.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-gray-500" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => {
                  setFilters({ ...filters, action: e.target.value });
                  setPage(1);
                }}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {actionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "all" ? "All Actions" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Resource Type
              </label>
              <select
                value={filters.resourceType}
                onChange={(e) => {
                  setFilters({ ...filters, resourceType: e.target.value });
                  setPage(1);
                }}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {resourceTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "all"
                      ? "All Resources"
                      : opt === "giftcard"
                      ? "Gift Card"
                      : opt === "promocode"
                      ? "Promo Code"
                      : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters({ ...filters, startDate: e.target.value });
                    setPage(1);
                  }}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters({ ...filters, endDate: e.target.value });
                    setPage(1);
                  }}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <Input
                label="User ID"
                value={filters.userId}
                onChange={(e) => {
                  setFilters({ ...filters, userId: e.target.value });
                  setPage(1);
                }}
                placeholder="Filter by user ID"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
          {filtersActive && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                leftIcon={<X className="h-3.5 w-3.5" />}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <FileText className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No audit logs found</p>
              <p className="text-xs mt-1">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Resource
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Resource ID
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Description
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log, index) => (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {log.user ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.user.name}
                            </p>
                            <p className="text-xs text-gray-500">{log.user.email}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                              <Activity className="h-3 w-3 text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-500 italic">System</span>
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={actionBadgeVariant[log.action] || "gray"}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm text-gray-700 capitalize">
                          {log.resourceType === "giftcard"
                            ? "Gift Card"
                            : log.resourceType === "promocode"
                            ? "Promo Code"
                            : log.resourceType}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-700">
                            {truncateId(log.resourceId)}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyId(log.resourceId);
                            }}
                            className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Copy full ID"
                          >
                            {copiedId === log.resourceId ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-xs truncate text-sm text-gray-600">
                          {log.description}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm text-gray-500 font-mono">
                          {log.ipAddress || "-"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Showing page {page} of {totalPages} ({totalLogs.toLocaleString()} total
            logs)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            {generatePageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 text-sm text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Detail"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timestamp
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(selectedLog.timestamp)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </p>
                <div className="mt-1">
                  <Badge
                    variant={actionBadgeVariant[selectedLog.action] || "gray"}
                  >
                    {selectedLog.action}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Resource Type
                </p>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedLog.resourceType === "giftcard"
                    ? "Gift Card"
                    : selectedLog.resourceType === "promocode"
                    ? "Promo Code"
                    : selectedLog.resourceType}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Resource ID
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
                    {selectedLog.resourceId}
                  </code>
                  <button
                    onClick={() => handleCopyId(selectedLog.resourceId)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    {copiedId === selectedLog.resourceId ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                Performed By
              </p>
              {selectedLog.user ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedLog.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedLog.user.email} (ID: {selectedLog.user.id})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
                    <Activity className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Automated System Action
                    </p>
                    <p className="text-xs text-gray-500">
                      This action was triggered automatically by the platform.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedLog.description}
              </p>
            </div>

            {/* Details */}
            {selectedLog.details &&
              Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                    Details
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-700">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

            {/* Before / After */}
            {(selectedLog.before || selectedLog.after) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedLog.before && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-red-500 mb-2">
                      Before
                    </p>
                    <pre className="overflow-x-auto rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-mono text-red-700">
                      {JSON.stringify(selectedLog.before, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.after && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-green-500 mb-2">
                      After
                    </p>
                    <pre className="overflow-x-auto rounded-lg border border-green-100 bg-green-50 p-3 text-xs font-mono text-green-700">
                      {JSON.stringify(selectedLog.after, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Network Info */}
            {(selectedLog.ipAddress || selectedLog.userAgent) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                  Network Information
                </p>
                <div className="space-y-2">
                  {selectedLog.ipAddress && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">IP Address:</span>
                      <code className="rounded bg-white px-2 py-0.5 text-xs font-mono text-gray-700 border border-gray-200">
                        {selectedLog.ipAddress}
                      </code>
                    </div>
                  )}
                  {selectedLog.userAgent && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-500 w-20 shrink-0 pt-0.5">
                        User Agent:
                      </span>
                      <p className="text-xs text-gray-600 break-all">
                        {selectedLog.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  if (total > 1) {
    pages.push(total);
  }

  return pages;
}
