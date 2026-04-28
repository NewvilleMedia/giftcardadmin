"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  DollarSign,
  CheckCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  AlertCircle,
  X,
  Receipt,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Modal } from "@/components/ui";
import { formatCurrency, formatDateTime, truncate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TransactionUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Transaction {
  _id: string;
  userId: TransactionUser | string;
  type:
    | "purchase"
    | "subscription"
    | "refund"
    | "wallet_credit"
    | "wallet_debit"
    | "transfer"
    | "campaign_spend";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentProvider?: string;
  paymentIntentId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  refundReason?: string;
  giftCard?: {
    _id?: string;
    productName?: string;
    brandName?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  stats?: {
    totalRevenue: number;
    completed: number;
    pending: number;
    refunded: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    _id: "txn_64a1b2c3d4e5f678900001",
    userId: {
      _id: "usr001",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
    },
    type: "purchase",
    amount: 50.0,
    currency: "USD",
    status: "completed",
    paymentProvider: "stripe",
    paymentIntentId: "pi_3N1a2b3c4d5e6f",
    description: "Amazon Gift Card purchase",
    giftCard: { _id: "gc001", productName: "Amazon Gift Card", brandName: "Amazon" },
    createdAt: "2026-03-10T14:30:00Z",
    updatedAt: "2026-03-10T14:30:05Z",
  },
  {
    _id: "txn_64a1b2c3d4e5f678900002",
    userId: {
      _id: "usr002",
      firstName: "Marcus",
      lastName: "Williams",
      email: "marcus.w@example.com",
    },
    type: "subscription",
    amount: 9.99,
    currency: "USD",
    status: "completed",
    paymentProvider: "stripe",
    paymentIntentId: "pi_4O2b3c4d5e6f7g",
    description: "Premium subscription - Monthly",
    createdAt: "2026-03-09T09:15:00Z",
    updatedAt: "2026-03-09T09:15:03Z",
  },
  {
    _id: "txn_64a1b2c3d4e5f678900003",
    userId: {
      _id: "usr003",
      firstName: "Emily",
      lastName: "Chen",
      email: "emily.chen@example.com",
    },
    type: "wallet_credit",
    amount: 100.0,
    currency: "USD",
    status: "pending",
    paymentProvider: "paypal",
    description: "Wallet top-up via PayPal",
    createdAt: "2026-03-10T11:45:00Z",
    updatedAt: "2026-03-10T11:45:00Z",
  },
  {
    _id: "txn_64a1b2c3d4e5f678900004",
    userId: {
      _id: "usr004",
      firstName: "David",
      lastName: "Kim",
      email: "david.kim@example.com",
    },
    type: "refund",
    amount: -25.0,
    currency: "USD",
    status: "refunded",
    paymentProvider: "stripe",
    paymentIntentId: "pi_5P3c4d5e6f7g8h",
    description: "Refund for Starbucks Gift Card",
    refundReason: "Customer requested refund - card not delivered",
    createdAt: "2026-03-08T16:20:00Z",
    updatedAt: "2026-03-08T16:25:00Z",
  },
  {
    _id: "txn_64a1b2c3d4e5f678900005",
    userId: {
      _id: "usr005",
      firstName: "Lisa",
      lastName: "Patel",
      email: "lisa.patel@example.com",
    },
    type: "campaign_spend",
    amount: -250.0,
    currency: "USD",
    status: "completed",
    paymentProvider: "wallet",
    description: "Employee rewards campaign - Q1 2026",
    createdAt: "2026-03-07T08:00:00Z",
    updatedAt: "2026-03-07T08:00:02Z",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TRANSACTION_TYPES = [
  "all",
  "purchase",
  "subscription",
  "refund",
  "wallet_credit",
  "wallet_debit",
  "transfer",
  "campaign_spend",
] as const;

const TRANSACTION_STATUSES = ["all", "pending", "completed", "failed", "refunded"] as const;

function getTypeBadgeVariant(
  type: string
): "blue" | "purple" | "red" | "green" | "orange" | "indigo" | "yellow" | "gray" {
  switch (type) {
    case "purchase":
      return "blue";
    case "subscription":
      return "purple";
    case "refund":
      return "red";
    case "wallet_credit":
      return "green";
    case "wallet_debit":
      return "orange";
    case "transfer":
      return "indigo";
    case "campaign_spend":
      return "yellow";
    default:
      return "gray";
  }
}

function getStatusBadgeVariant(status: string): "green" | "yellow" | "red" | "purple" | "gray" {
  switch (status) {
    case "completed":
      return "green";
    case "pending":
      return "yellow";
    case "failed":
      return "red";
    case "refunded":
      return "purple";
    default:
      return "gray";
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "purchase":
      return <CreditCard className="h-3.5 w-3.5" />;
    case "refund":
      return <RotateCcw className="h-3.5 w-3.5" />;
    case "wallet_credit":
      return <ArrowDownLeft className="h-3.5 w-3.5" />;
    case "wallet_debit":
      return <ArrowUpRight className="h-3.5 w-3.5" />;
    case "subscription":
      return <Receipt className="h-3.5 w-3.5" />;
    case "transfer":
      return <ArrowUpRight className="h-3.5 w-3.5" />;
    case "campaign_spend":
      return <Wallet className="h-3.5 w-3.5" />;
    default:
      return <DollarSign className="h-3.5 w-3.5" />;
  }
}

function formatTypeLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getUserInfo(userId: TransactionUser | string | undefined): { name: string; email: string } {
  if (!userId) {
    return { name: "Unknown User", email: "N/A" };
  }
  if (typeof userId === "string") {
    return { name: "Unknown User", email: userId };
  }
  return {
    name: `${userId.firstName} ${userId.lastName}`,
    email: userId.email,
  };
}

function isDebitType(type: string): boolean {
  return ["refund", "wallet_debit", "campaign_spend"].includes(type);
}

/* ------------------------------------------------------------------ */
/*  Toast Component                                                    */
/* ------------------------------------------------------------------ */

interface ToastData {
  id: number;
  message: string;
  type: "success" | "error";
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)} className="ml-2 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [refundedCount, setRefundedCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TRANSACTION_TYPES)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof TRANSACTION_STATUSES)[number]>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundingTransaction, setRefundingTransaction] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  /* ---- Toast helpers ---- */
  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ---- Fetch transactions ---- */
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (search) params.search = search;
    if (typeFilter !== "all") params.type = typeFilter;
    if (statusFilter !== "all") params.status = statusFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      const data = (await api.getTransactions(params)) as unknown as TransactionsResponse;
      setTransactions(data.transactions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.stats) {
        setTotalRevenue(data.stats.totalRevenue);
        setCompletedCount(data.stats.completed);
        setPendingCount(data.stats.pending);
        setRefundedCount(data.stats.refunded);
      }
    } catch {
      setTransactions(MOCK_TRANSACTIONS);
      setTotal(MOCK_TRANSACTIONS.length);
      setTotalPages(1);
      setTotalRevenue(
        MOCK_TRANSACTIONS.filter((t) => t.status === "completed" && t.amount > 0).reduce(
          (sum, t) => sum + t.amount,
          0
        )
      );
      setCompletedCount(MOCK_TRANSACTIONS.filter((t) => t.status === "completed").length);
      setPendingCount(MOCK_TRANSACTIONS.filter((t) => t.status === "pending").length);
      setRefundedCount(MOCK_TRANSACTIONS.filter((t) => t.status === "refunded").length);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  /* ---- Search debounce ---- */
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ---- View details ---- */
  const openDetails = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setDetailsModalOpen(true);
  };

  /* ---- Refund handlers ---- */
  const openRefundModal = (txn: Transaction) => {
    setRefundingTransaction(txn);
    setRefundReason("");
    setRefundModalOpen(true);
  };

  const handleRefund = async () => {
    if (!refundingTransaction || !refundReason.trim()) return;
    setRefunding(true);

    try {
      await api.refundTransaction(refundingTransaction._id, refundReason.trim());
      addToast("Transaction refunded successfully", "success");
      setRefundModalOpen(false);
      setRefundingTransaction(null);
      setRefundReason("");
      fetchTransactions();
    } catch {
      addToast("Failed to process refund", "error");
    } finally {
      setRefunding(false);
    }
  };

  /* ---- Export handler ---- */
  const handleExport = () => {
    const csvHeaders = ["Transaction ID", "User", "Type", "Amount", "Status", "Provider", "Date"];
    const csvRows = transactions.map((txn) => {
      const userInfo = getUserInfo(txn.userId);
      return [
        txn._id,
        userInfo.name,
        formatTypeLabel(txn.type),
        txn.amount.toFixed(2),
        txn.status,
        txn.paymentProvider || "N/A",
        new Date(txn.createdAt).toISOString(),
      ].join(",");
    });
    const csv = [csvHeaders.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Transactions exported successfully", "success");
  };

  /* ---- Animation variants ---- */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500">
          View and manage all platform transactions, process refunds, and export reports.
        </p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {[
          {
            label: "Total Transactions",
            value: total.toLocaleString(),
            icon: Receipt,
            color: "text-indigo-600 bg-indigo-50",
          },
          {
            label: "Total Revenue",
            value: formatCurrency(totalRevenue),
            icon: TrendingUp,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Completed",
            value: completedCount.toLocaleString(),
            icon: CheckCircle,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Pending",
            value: pendingCount.toLocaleString(),
            icon: Clock,
            color: "text-yellow-600 bg-yellow-50",
          },
          {
            label: "Refunded",
            value: refundedCount.toLocaleString(),
            icon: RotateCcw,
            color: "text-purple-600 bg-purple-50",
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="flex items-center gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-sm">
              <Input
                placeholder="Search transactions..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as (typeof TRANSACTION_TYPES)[number]);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All Types" : formatTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as (typeof TRANSACTION_STATUSES)[number]);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {TRANSACTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Export */}
          <Button
            variant="secondary"
            onClick={handleExport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
        </Card>
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden !p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-sm text-gray-500">Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={fetchTransactions}>
                Retry
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Receipt className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {transactions.map((txn, index) => {
                      const userInfo = getUserInfo(txn.userId);
                      const isDebit = isDebitType(txn.type) || txn.amount < 0;

                      return (
                        <motion.tr
                          key={txn._id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ delay: index * 0.03 }}
                          className="group transition-colors hover:bg-gray-50/50"
                        >
                          {/* Transaction ID */}
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs text-gray-600">
                              {truncate(txn._id, 16)}
                            </span>
                          </td>

                          {/* User */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                              <p className="text-xs text-gray-500">{userInfo.email}</p>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4">
                            <Badge variant={getTypeBadgeVariant(txn.type)}>
                              <span className="mr-1 inline-flex">{getTypeIcon(txn.type)}</span>
                              {formatTypeLabel(txn.type)}
                            </Badge>
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`text-sm font-semibold ${
                                isDebit ? "text-red-600" : "text-gray-900"
                              }`}
                            >
                              {isDebit && txn.amount > 0 ? "-" : ""}
                              {formatCurrency(Math.abs(txn.amount), txn.currency)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <Badge variant={getStatusBadgeVariant(txn.status)}>
                              {txn.status}
                            </Badge>
                          </td>

                          {/* Provider */}
                          <td className="px-6 py-4">
                            <span className="text-sm capitalize text-gray-700">
                              {txn.paymentProvider || "N/A"}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {formatDateTime(txn.createdAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openDetails(txn)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {txn.status === "completed" && txn.type !== "refund" && (
                                <button
                                  onClick={() => openRefundModal(txn)}
                                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  title="Refund"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 sm:px-6 py-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium">{(page - 1) * limit + 1}</span>
                {" "}&ndash;{" "}
                <span className="font-medium">{Math.min(page * limit, total)}</span>
                {" "}of{" "}
                <span className="font-medium">{total}</span> transactions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? "bg-indigo-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ---- Transaction Details Modal ---- */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
        title="Transaction Details"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-5">
            {/* Status header */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div>
                <p className="text-xs text-gray-500">Transaction ID</p>
                <p className="font-mono text-sm text-gray-900">{selectedTransaction._id}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedTransaction.status)}>
                {selectedTransaction.status}
              </Badge>
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-xs text-gray-500">Amount</p>
              <p
                className={`text-3xl font-bold ${
                  isDebitType(selectedTransaction.type) || selectedTransaction.amount < 0
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
              >
                {isDebitType(selectedTransaction.type) && selectedTransaction.amount > 0 ? "-" : ""}
                {formatCurrency(Math.abs(selectedTransaction.amount), selectedTransaction.currency)}
              </p>
              <Badge variant={getTypeBadgeVariant(selectedTransaction.type)} className="mt-2">
                {formatTypeLabel(selectedTransaction.type)}
              </Badge>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4">
              {/* User */}
              <div>
                <p className="text-xs text-gray-500">User</p>
                <p className="text-sm font-medium text-gray-900">
                  {getUserInfo(selectedTransaction.userId).name}
                </p>
                <p className="text-xs text-gray-500">
                  {getUserInfo(selectedTransaction.userId).email}
                </p>
              </div>

              {/* Payment Provider */}
              <div>
                <p className="text-xs text-gray-500">Payment Provider</p>
                <p className="text-sm font-medium capitalize text-gray-900">
                  {selectedTransaction.paymentProvider || "N/A"}
                </p>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900">
                  {formatDateTime(selectedTransaction.createdAt)}
                </p>
              </div>

              {/* Updated */}
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">
                  {selectedTransaction.updatedAt ? formatDateTime(selectedTransaction.updatedAt) : "N/A"}
                </p>
              </div>

              {/* Payment Intent */}
              {selectedTransaction.paymentIntentId && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Payment Intent ID</p>
                  <p className="font-mono text-sm text-gray-900">
                    {selectedTransaction.paymentIntentId}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedTransaction.description && (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Description</p>
                <p className="mt-1 text-sm text-gray-900">{selectedTransaction.description}</p>
              </div>
            )}

            {/* Gift Card Info */}
            {selectedTransaction.giftCard && (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Gift Card</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {selectedTransaction.giftCard.productName}
                </p>
                <p className="text-xs text-gray-500">{selectedTransaction.giftCard.brandName}</p>
              </div>
            )}

            {/* Refund Reason */}
            {selectedTransaction.refundReason && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-medium text-red-600">Refund Reason</p>
                <p className="mt-1 text-sm text-red-800">{selectedTransaction.refundReason}</p>
              </div>
            )}

            {/* Metadata */}
            {selectedTransaction.metadata &&
              Object.keys(selectedTransaction.metadata).length > 0 && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="mb-2 text-xs text-gray-500">Metadata</p>
                  <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedTransaction(null);
                }}
              >
                Close
              </Button>
              {selectedTransaction.status === "completed" &&
                selectedTransaction.type !== "refund" && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      openRefundModal(selectedTransaction);
                    }}
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                  >
                    Refund
                  </Button>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Refund Modal ---- */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => {
          if (!refunding) {
            setRefundModalOpen(false);
            setRefundingTransaction(null);
            setRefundReason("");
          }
        }}
        title="Process Refund"
        size="md"
      >
        {refundingTransaction && (
          <div className="space-y-5">
            {/* Refund summary */}
            <div className="rounded-lg bg-red-50 border border-red-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900">
                    Refund {formatCurrency(Math.abs(refundingTransaction.amount), refundingTransaction.currency)}
                  </p>
                  <p className="text-xs text-red-700">
                    Transaction: {truncate(refundingTransaction._id, 20)}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">User</p>
                <p className="font-medium text-gray-900">
                  {getUserInfo(refundingTransaction.userId).name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Provider</p>
                <p className="font-medium capitalize text-gray-900">
                  {refundingTransaction.paymentProvider || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="font-medium text-gray-900">
                  {formatTypeLabel(refundingTransaction.type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(refundingTransaction.createdAt)}
                </p>
              </div>
            </div>

            {/* Reason input */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Refund Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter the reason for this refund..."
                rows={3}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="secondary"
                disabled={refunding}
                onClick={() => {
                  setRefundModalOpen(false);
                  setRefundingTransaction(null);
                  setRefundReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRefund}
                loading={refunding}
                disabled={!refundReason.trim()}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Confirm Refund
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
