"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Megaphone,
  Play,
  CheckCircle2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Users,
  Gift,
  Clock,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { api, type Campaign as ApiCampaign, type Pagination } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime, truncate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Extended Campaign type (for richer mock data and modal display)     */
/* ------------------------------------------------------------------ */

interface CampaignExtended extends ApiCampaign {
  business?: { _id: string; name: string };
  giftCard?: { _id: string; name: string; brand: string };
  amountPerRecipient?: number;
  schedule?: {
    type: "immediate" | "scheduled" | "recurring";
    date?: string;
    recurring?: { frequency: string; interval: number };
  };
  budget?: { total: number; spent: number; remaining: number };
  recipients?: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    redeemed: number;
  };
  approval?: {
    status: "pending" | "approved" | "rejected";
    approvedBy?: string;
    approvedAt?: string;
    rejectedReason?: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_CAMPAIGNS: CampaignExtended[] = [
  {
    _id: "camp_001",
    businessId: "biz_001",
    name: "Holiday Gift Blitz 2026",
    description: "End-of-year holiday appreciation campaign for all premium customers with personalized gift cards and seasonal messaging.",
    type: "holiday",
    status: "active",
    business: { _id: "biz_001", name: "TechCorp Solutions" },
    giftCard: { _id: "gc_001", name: "Amazon eGift", brand: "Amazon" },
    amount: 50,
    amountPerRecipient: 50,
    recipientCount: 500,
    sentCount: 290,
    redeemedCount: 198,
    schedule: { type: "scheduled", date: "2026-12-20T09:00:00Z" },
    budget: { total: 25000, spent: 14500, remaining: 10500 },
    totalBudget: 25000,
    recipients: { total: 500, sent: 290, delivered: 285, failed: 5, redeemed: 198 },
    approval: { status: "approved", approvedBy: "admin@giftit.com", approvedAt: "2026-11-15T10:30:00Z" },
    createdAt: "2026-11-10T08:00:00Z",
    updatedAt: "2026-12-01T14:22:00Z",
  },
  {
    _id: "camp_002",
    businessId: "biz_002",
    name: "New Hire Welcome Pack",
    description: "Onboarding gift card for every new employee joining the company in Q1 2026.",
    type: "onboarding",
    status: "completed",
    business: { _id: "biz_002", name: "StartupHub Inc" },
    giftCard: { _id: "gc_002", name: "Visa Prepaid", brand: "Visa" },
    amount: 100,
    amountPerRecipient: 100,
    recipientCount: 100,
    sentCount: 100,
    redeemedCount: 95,
    schedule: { type: "recurring", recurring: { frequency: "monthly", interval: 1 } },
    budget: { total: 10000, spent: 10000, remaining: 0 },
    totalBudget: 10000,
    recipients: { total: 100, sent: 100, delivered: 98, failed: 2, redeemed: 95 },
    approval: { status: "approved", approvedBy: "admin@giftit.com", approvedAt: "2026-01-02T09:00:00Z" },
    createdAt: "2025-12-28T11:00:00Z",
    updatedAt: "2026-03-31T23:59:00Z",
  },
  {
    _id: "camp_003",
    businessId: "biz_003",
    name: "Birthday Surprises - March",
    description: "Monthly birthday gift cards for team members celebrating in March.",
    type: "birthday",
    status: "draft",
    giftCard: { _id: "gc_003", name: "Starbucks Gift Card", brand: "Starbucks" },
    amount: 25,
    amountPerRecipient: 25,
    recipientCount: 30,
    sentCount: 0,
    redeemedCount: 0,
    schedule: { type: "scheduled", date: "2026-03-01T08:00:00Z" },
    budget: { total: 750, spent: 0, remaining: 750 },
    totalBudget: 750,
    recipients: { total: 30, sent: 0, delivered: 0, failed: 0, redeemed: 0 },
    createdAt: "2026-02-20T16:45:00Z",
    updatedAt: "2026-02-20T16:45:00Z",
  },
];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "birthday", label: "Birthday" },
  { value: "holiday", label: "Holiday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "recognition", label: "Recognition" },
  { value: "milestone", label: "Milestone" },
  { value: "onboarding", label: "Onboarding" },
  { value: "custom", label: "Custom" },
];

type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";
type CampaignType = "birthday" | "holiday" | "anniversary" | "recognition" | "milestone" | "onboarding" | "custom";

const STATUS_BADGE_MAP: Record<CampaignStatus, "gray" | "blue" | "green" | "yellow" | "purple" | "red"> = {
  draft: "gray",
  scheduled: "blue",
  active: "green",
  paused: "yellow",
  completed: "purple",
  cancelled: "red",
};

const TYPE_BADGE_MAP: Record<CampaignType, "blue" | "red" | "purple" | "orange" | "green" | "indigo" | "gray"> = {
  birthday: "purple",
  holiday: "red",
  anniversary: "blue",
  recognition: "orange",
  milestone: "green",
  onboarding: "indigo",
  custom: "gray",
};

const ITEMS_PER_PAGE = 10;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getBusinessName(c: CampaignExtended): string | null {
  if (c.business?.name) return c.business.name;
  if (typeof c.businessId === "object" && c.businessId !== null) {
    return (c.businessId as { name: string }).name;
  }
  return null;
}

function getRecipientCount(c: CampaignExtended): number {
  return c.recipients?.total ?? c.recipientCount ?? 0;
}

function getSentCount(c: CampaignExtended): number {
  return c.recipients?.sent ?? c.sentCount ?? 0;
}

function getDeliveredCount(c: CampaignExtended): number {
  return c.recipients?.delivered ?? c.sentCount ?? 0;
}

function getRedeemedCount(c: CampaignExtended): number {
  return c.recipients?.redeemed ?? c.redeemedCount ?? 0;
}

function getBudgetTotal(c: CampaignExtended): number {
  return c.budget?.total ?? c.totalBudget ?? 0;
}

function getBudgetSpent(c: CampaignExtended): number {
  return c.budget?.spent ?? 0;
}

function budgetPercent(c: CampaignExtended): number {
  const total = getBudgetTotal(c);
  if (!total) return 0;
  return Math.min(100, Math.round((getBudgetSpent(c) / total) * 100));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignExtended | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  /* ---- Data fetching ---- */
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: {
        page: number;
        limit: number;
        status?: string;
        type?: string;
      } = {
        page,
        limit: ITEMS_PER_PAGE,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.type = typeFilter;

      const data = await api.getCampaigns(params);
      const fetched = data.campaigns as CampaignExtended[];
      const filtered = search.trim()
        ? fetched.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              (c.description ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : fetched;
      setCampaigns(filtered);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch {
      setCampaigns(MOCK_CAMPAIGNS);
      setTotalPages(1);
      setTotalItems(MOCK_CAMPAIGNS.length);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  /* ---- Derived stats ---- */
  const stats = {
    total: totalItems,
    active: campaigns.filter((c) => c.status === "active").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    budgetSpent: campaigns.reduce((sum, c) => sum + getBudgetSpent(c), 0),
  };

  /* ---- Handlers ---- */
  const openDetails = (campaign: CampaignExtended) => {
    setSelectedCampaign(campaign);
    setDetailsOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCampaigns();
  };

  /* ---- Animation variants ---- */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and manage gift card distribution campaigns.
        </p>
      </div>

      {/* ---- Stats Row ---- */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <Megaphone className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Budget Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.budgetSpent)}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ---- Filters Bar ---- */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Card>

      {/* ---- Error State ---- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Table ---- */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-gray-500">Loading campaigns...</p>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Megaphone className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No campaigns found</p>
            <p className="mt-1 text-xs text-gray-400">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Campaign</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Business</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Recipients</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Budget</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Sent / Delivered / Redeemed</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Created</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                {campaigns.map((campaign) => (
                  <motion.tr
                    key={campaign._id}
                    variants={itemVariants}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    {/* Campaign */}
                    <td className="px-6 py-4">
                      <div className="max-w-[220px]">
                        <p className="font-medium text-gray-900">{campaign.name}</p>
                        {campaign.description && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {truncate(campaign.description, 60)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Business */}
                    <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                      {getBusinessName(campaign) ?? <span className="text-gray-400">--</span>}
                    </td>

                    {/* Type */}
                    <td className="whitespace-nowrap px-6 py-4">
                      {campaign.type ? (
                        <Badge variant={TYPE_BADGE_MAP[campaign.type]}>{campaign.type}</Badge>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>

                    {/* Recipients */}
                    <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                      {getRecipientCount(campaign).toLocaleString()}
                    </td>

                    {/* Budget */}
                    <td className="px-6 py-4">
                      <div className="min-w-[140px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {formatCurrency(getBudgetSpent(campaign))} / {formatCurrency(getBudgetTotal(campaign))}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <motion.div
                            className="h-full rounded-full bg-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${budgetPercent(campaign)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={STATUS_BADGE_MAP[campaign.status]}>{campaign.status}</Badge>
                    </td>

                    {/* Sent / Delivered / Redeemed */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-600">{getSentCount(campaign)}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-600">{getDeliveredCount(campaign)}</span>
                        <span className="text-gray-300">/</span>
                        <span className="font-medium text-green-600">{getRedeemedCount(campaign)}</span>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDate(campaign.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetails(campaign)}
                        leftIcon={<Eye className="h-4 w-4" />}
                      >
                        View Details
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}

        {/* ---- Pagination ---- */}
        {!loading && campaigns.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
            <p className="text-sm text-gray-500">
              Page <span className="font-medium">{page}</span> of{" "}
              <span className="font-medium">{totalPages}</span>{" "}
              <span className="text-gray-400">({totalItems} total)</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
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

      {/* ================================================================ */}
      {/*  CAMPAIGN DETAILS MODAL                                          */}
      {/* ================================================================ */}
      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Campaign Details"
        size="xl"
      >
        {selectedCampaign && (
          <div className="space-y-6">
            {/* ---- Header Info ---- */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCampaign.name}</h3>
                  {selectedCampaign.description && (
                    <p className="mt-1 text-sm text-gray-500">{selectedCampaign.description}</p>
                  )}
                </div>
                <Badge variant={STATUS_BADGE_MAP[selectedCampaign.status]}>
                  {selectedCampaign.status}
                </Badge>
              </div>
            </div>

            {/* ---- Grid: Campaign & Business ---- */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Campaign Info */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Megaphone className="h-4 w-4 text-indigo-500" />
                  Campaign Info
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Type</dt>
                    <dd>
                      {selectedCampaign.type ? (
                        <Badge variant={TYPE_BADGE_MAP[selectedCampaign.type]}>
                          {selectedCampaign.type}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Amount / Recipient</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrency(selectedCampaign.amountPerRecipient ?? selectedCampaign.amount ?? 0)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Business Info */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users className="h-4 w-4 text-indigo-500" />
                  Business
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Business Name</dt>
                    <dd className="font-medium text-gray-900">
                      {getBusinessName(selectedCampaign) ?? "N/A"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* ---- Gift Card Details ---- */}
            {selectedCampaign.giftCard && (
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Gift className="h-4 w-4 text-indigo-500" />
                  Gift Card Details
                </h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Card Name</dt>
                    <dd className="font-medium text-gray-900">{selectedCampaign.giftCard.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Brand</dt>
                    <dd className="font-medium text-gray-900">{selectedCampaign.giftCard.brand}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* ---- Schedule ---- */}
            {selectedCampaign.schedule && (
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Schedule
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Schedule Type</dt>
                    <dd className="font-medium capitalize text-gray-900">
                      {selectedCampaign.schedule.type}
                    </dd>
                  </div>
                  {selectedCampaign.schedule.date && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Scheduled Date</dt>
                      <dd className="font-medium text-gray-900">
                        {formatDateTime(selectedCampaign.schedule.date)}
                      </dd>
                    </div>
                  )}
                  {selectedCampaign.schedule.recurring && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Recurring</dt>
                      <dd className="font-medium capitalize text-gray-900">
                        Every {selectedCampaign.schedule.recurring.interval}{" "}
                        {selectedCampaign.schedule.recurring.frequency}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* ---- Budget Breakdown ---- */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <DollarSign className="h-4 w-4 text-indigo-500" />
                Budget Breakdown
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total Budget</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(getBudgetTotal(selectedCampaign))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Spent</dt>
                  <dd className="font-medium text-orange-600">
                    {formatCurrency(getBudgetSpent(selectedCampaign))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Remaining</dt>
                  <dd className="font-medium text-green-600">
                    {formatCurrency(
                      selectedCampaign.budget?.remaining ??
                        getBudgetTotal(selectedCampaign) - getBudgetSpent(selectedCampaign)
                    )}
                  </dd>
                </div>
              </dl>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Budget usage</span>
                  <span>{budgetPercent(selectedCampaign)}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    className="h-full rounded-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetPercent(selectedCampaign)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* ---- Recipient Stats ---- */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Recipient Stats
              </h4>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Total", value: getRecipientCount(selectedCampaign), color: "text-gray-900" },
                  { label: "Sent", value: getSentCount(selectedCampaign), color: "text-blue-600" },
                  { label: "Delivered", value: getDeliveredCount(selectedCampaign), color: "text-indigo-600" },
                  { label: "Failed", value: selectedCampaign.recipients?.failed ?? 0, color: "text-red-600" },
                  { label: "Redeemed", value: getRedeemedCount(selectedCampaign), color: "text-green-600" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center rounded-lg bg-gray-50 p-3 text-center"
                  >
                    <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                    <span className="mt-0.5 text-xs text-gray-500">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- Approval Status ---- */}
            {selectedCampaign.approval && (
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                  Approval
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Status</dt>
                    <dd>
                      <Badge
                        variant={
                          selectedCampaign.approval.status === "approved"
                            ? "green"
                            : selectedCampaign.approval.status === "rejected"
                              ? "red"
                              : "yellow"
                        }
                      >
                        {selectedCampaign.approval.status}
                      </Badge>
                    </dd>
                  </div>
                  {selectedCampaign.approval.approvedBy && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Approved By</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedCampaign.approval.approvedBy}
                      </dd>
                    </div>
                  )}
                  {selectedCampaign.approval.approvedAt && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Approved At</dt>
                      <dd className="font-medium text-gray-900">
                        {formatDateTime(selectedCampaign.approval.approvedAt)}
                      </dd>
                    </div>
                  )}
                  {selectedCampaign.approval.rejectedReason && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Rejection Reason</dt>
                      <dd className="font-medium text-red-600">
                        {selectedCampaign.approval.rejectedReason}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* ---- Dates ---- */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="h-4 w-4 text-indigo-500" />
                Dates
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Created</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDateTime(selectedCampaign.createdAt)}
                  </dd>
                </div>
                {selectedCampaign.updatedAt && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Last Updated</dt>
                    <dd className="font-medium text-gray-900">
                      {formatDateTime(selectedCampaign.updatedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* ---- Close ---- */}
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
