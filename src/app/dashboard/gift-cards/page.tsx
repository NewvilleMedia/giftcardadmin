"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Star,
  Tag,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  X,
  ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Modal } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GiftCard {
  _id: string;
  name: string;
  brandName: string;
  description?: string;
  category: string;
  provider: string;
  image?: string;
  priceType: "fixed" | "variable";
  fixedAmounts?: number[];
  minAmount?: number;
  maxAmount?: number;
  currency: string;
  isAvailable: boolean;
  featured: boolean;
  discount?: number;
  popularity: number;
  createdAt?: string;
  updatedAt?: string;
}

interface GiftCardsResponse {
  giftCards: GiftCard[];
  total: number;
  page: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_GIFT_CARDS: GiftCard[] = [
  {
    _id: "gc001",
    name: "Amazon Gift Card",
    brandName: "Amazon",
    description: "Shop millions of products on Amazon with this gift card.",
    category: "Shopping",
    provider: "runa",
    image: "",
    priceType: "variable",
    minAmount: 5,
    maxAmount: 500,
    currency: "USD",
    isAvailable: true,
    featured: true,
    discount: 2,
    popularity: 98,
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-03-01T12:00:00Z",
  },
  {
    _id: "gc002",
    name: "Starbucks Gift Card",
    brandName: "Starbucks",
    description: "Enjoy your favorite coffee and beverages at any Starbucks location.",
    category: "Food & Drink",
    provider: "tremendous",
    image: "",
    priceType: "fixed",
    fixedAmounts: [10, 25, 50, 100],
    currency: "USD",
    isAvailable: true,
    featured: false,
    discount: 0,
    popularity: 85,
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-02-28T12:00:00Z",
  },
  {
    _id: "gc003",
    name: "Target Gift Card",
    brandName: "Target",
    description: "Shop everything from home essentials to fashion at Target.",
    category: "Shopping",
    provider: "tango",
    image: "",
    priceType: "variable",
    minAmount: 10,
    maxAmount: 300,
    currency: "USD",
    isAvailable: true,
    featured: true,
    discount: 3,
    popularity: 76,
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-03-05T12:00:00Z",
  },
  {
    _id: "gc004",
    name: "Apple Gift Card",
    brandName: "Apple",
    description: "Use for apps, games, music, movies, iCloud, and more from Apple.",
    category: "Technology",
    provider: "runa",
    image: "",
    priceType: "fixed",
    fixedAmounts: [25, 50, 100, 200],
    currency: "USD",
    isAvailable: false,
    featured: false,
    discount: 0,
    popularity: 90,
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-02-15T12:00:00Z",
  },
  {
    _id: "gc005",
    name: "Netflix Gift Card",
    brandName: "Netflix",
    description: "Stream movies and TV shows with a Netflix subscription gift card.",
    category: "Entertainment",
    provider: "tremendous",
    image: "",
    priceType: "fixed",
    fixedAmounts: [15, 30, 50],
    currency: "USD",
    isAvailable: true,
    featured: true,
    discount: 5,
    popularity: 92,
    createdAt: "2025-01-25T10:00:00Z",
    updatedAt: "2025-03-08T12:00:00Z",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CATEGORIES = ["All", "Shopping", "Food & Drink", "Technology", "Entertainment", "Gaming", "Travel", "Health"];
const PROVIDERS = ["all", "runa", "tremendous", "tango"] as const;
const ACTIVE_FILTERS = ["all", "active", "inactive"] as const;

function getProviderBadgeVariant(provider: string): "blue" | "purple" | "orange" {
  switch (provider) {
    case "runa":
      return "blue";
    case "tremendous":
      return "purple";
    case "tango":
      return "orange";
    default:
      return "blue";
  }
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

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("all");
  const [activeFilter, setActiveFilter] = useState<(typeof ACTIVE_FILTERS)[number]>("all");

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<GiftCard | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number; total: number } | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    featured: false,
    isAvailable: true,
    discount: 0,
    fixedAmounts: "",
    minAmount: 0,
    maxAmount: 0,
  });
  const [saving, setSaving] = useState(false);

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

  /* ---- Fetch gift cards ---- */
  const fetchGiftCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (search) params.search = search;
    if (category !== "All") params.category = category;
    if (provider !== "all") params.provider = provider;
    if (activeFilter !== "all") params.active = activeFilter === "active" ? "true" : "false";

    try {
      const data = (await api.getGiftCards(params)) as unknown as GiftCardsResponse;
      setGiftCards(data.giftCards);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setGiftCards(MOCK_GIFT_CARDS);
      setTotal(MOCK_GIFT_CARDS.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, provider, activeFilter]);

  useEffect(() => {
    fetchGiftCards();
  }, [fetchGiftCards]);

  /* ---- Computed stats ---- */
  const stats = {
    total: total,
    active: giftCards.filter((gc) => gc.isAvailable).length,
    featured: giftCards.filter((gc) => gc.featured).length,
    categories: [...new Set(giftCards.map((gc) => gc.category))].length,
  };

  /* ---- Search debounce ---- */
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ---- Edit handlers ---- */
  const openEditModal = (card: GiftCard) => {
    setEditingCard(card);
    setEditForm({
      name: card.name,
      description: card.description || "",
      category: card.category,
      featured: card.featured,
      isAvailable: card.isAvailable,
      discount: card.discount || 0,
      fixedAmounts: card.fixedAmounts?.join(", ") || "",
      minAmount: card.minAmount || 0,
      maxAmount: card.maxAmount || 0,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    setSaving(true);

    const updateData: Partial<GiftCard> = {
      name: editForm.name,
      description: editForm.description,
      category: editForm.category,
      featured: editForm.featured,
      isAvailable: editForm.isAvailable,
      discount: editForm.discount,
    };

    if (editingCard.priceType === "fixed") {
      updateData.fixedAmounts = editForm.fixedAmounts
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));
    } else {
      updateData.minAmount = editForm.minAmount;
      updateData.maxAmount = editForm.maxAmount;
    }

    try {
      await api.updateGiftCard(editingCard._id, updateData as Record<string, unknown>);
      addToast("Gift card updated successfully", "success");
      setEditModalOpen(false);
      setEditingCard(null);
      fetchGiftCards();
    } catch {
      addToast("Failed to update gift card", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Toggle active / featured ---- */
  const toggleActive = async (card: GiftCard) => {
    try {
      await api.updateGiftCard(card._id, { isAvailable: !card.isAvailable });
      addToast(
        `${card.name} is now ${!card.isAvailable ? "active" : "inactive"}`,
        "success"
      );
      fetchGiftCards();
    } catch {
      addToast("Failed to update status", "error");
    }
  };

  const toggleFeatured = async (card: GiftCard) => {
    try {
      await api.updateGiftCard(card._id, { featured: !card.featured });
      addToast(
        `${card.name} ${!card.featured ? "is now featured" : "removed from featured"}`,
        "success"
      );
      fetchGiftCards();
    } catch {
      addToast("Failed to update featured status", "error");
    }
  };

  /* ---- Sync handler ---- */
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncModalOpen(true);

    try {
      const result = (await api.syncGiftCards()) as unknown as { added: number; updated: number; total: number };
      setSyncResult(result);
      addToast("Gift cards synced successfully", "success");
      fetchGiftCards();
    } catch {
      setSyncResult({ added: 0, updated: 0, total: 0 });
      addToast("Failed to sync gift cards", "error");
    } finally {
      setSyncing(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Gift Card Management</h1>
        <p className="text-sm text-gray-500">
          Manage gift card catalog, sync from providers, and control availability.
        </p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Total Gift Cards", value: stats.total, icon: CreditCard, color: "text-indigo-600 bg-indigo-50" },
          { label: "Active Cards", value: stats.active, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "Featured Cards", value: stats.featured, icon: Star, color: "text-yellow-600 bg-yellow-50" },
          { label: "Categories", value: stats.categories, icon: Tag, color: "text-purple-600 bg-purple-50" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search gift cards..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>

            {/* Provider Filter */}
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as (typeof PROVIDERS)[number]);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All Providers" : p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>

            {/* Active Status Filter */}
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as (typeof ACTIVE_FILTERS)[number]);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sync Button */}
          <Button
            onClick={handleSync}
            loading={syncing}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Sync from Provider
          </Button>
        </Card>
      </motion.div>

      {/* Gift Cards Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden !p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-sm text-gray-500">Loading gift cards...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={fetchGiftCards}>
                Retry
              </Button>
            </div>
          ) : giftCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <CreditCard className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No gift cards found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Gift Card
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Price Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Popularity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {giftCards.map((card, index) => (
                      <motion.tr
                        key={card._id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Gift Card */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                              {card.image ? (
                                <img
                                  src={card.image}
                                  alt={card.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{card.name}</p>
                              <p className="text-xs text-gray-500">{card.brandName}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{card.category}</span>
                        </td>

                        {/* Provider */}
                        <td className="px-6 py-4">
                          <Badge variant={getProviderBadgeVariant(card.provider)}>
                            {card.provider}
                          </Badge>
                        </td>

                        {/* Price Type */}
                        <td className="px-6 py-4">
                          {card.priceType === "fixed" && card.fixedAmounts ? (
                            <div className="flex flex-wrap gap-1">
                              {card.fixedAmounts.map((amt) => (
                                <span
                                  key={amt}
                                  className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700"
                                >
                                  {formatCurrency(amt, card.currency)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-700">
                              {formatCurrency(card.minAmount || 0, card.currency)} &ndash;{" "}
                              {formatCurrency(card.maxAmount || 0, card.currency)}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge variant={card.isAvailable ? "green" : "red"}>
                            {card.isAvailable ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        {/* Featured */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleFeatured(card)}
                            className="inline-flex items-center justify-center transition-transform hover:scale-110"
                            title={card.featured ? "Remove from featured" : "Mark as featured"}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                card.featured
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        </td>

                        {/* Popularity */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-700">{card.popularity}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(card)}
                              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(card)}
                              className={`rounded-lg p-1.5 transition-colors ${
                                card.isAvailable
                                  ? "text-green-500 hover:bg-red-50 hover:text-red-600"
                                  : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                              }`}
                              title={card.isAvailable ? "Deactivate" : "Activate"}
                            >
                              {card.isAvailable ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && giftCards.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium">{(page - 1) * limit + 1}</span>
                {" "}&ndash;{" "}
                <span className="font-medium">{Math.min(page * limit, total)}</span>
                {" "}of{" "}
                <span className="font-medium">{total}</span> gift cards
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

      {/* ---- Edit Gift Card Modal ---- */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCard(null);
        }}
        title="Edit Gift Card"
        size="lg"
      >
        {editingCard && (
          <div className="space-y-5">
            <Input
              label="Name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Discount (%)"
                type="number"
                min={0}
                max={100}
                value={String(editForm.discount)}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    discount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            {editingCard.priceType === "fixed" ? (
              <Input
                label="Fixed Amounts (comma separated)"
                value={editForm.fixedAmounts}
                onChange={(e) => setEditForm((f) => ({ ...f, fixedAmounts: e.target.value }))}
                placeholder="10, 25, 50, 100"
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Amount"
                  type="number"
                  min={0}
                  value={String(editForm.minAmount)}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      minAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
                <Input
                  label="Max Amount"
                  type="number"
                  min={0}
                  value={String(editForm.maxAmount)}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      maxAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            )}

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isAvailable}
                  onChange={(e) => setEditForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.featured}
                  onChange={(e) => setEditForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Featured
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingCard(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Sync Confirmation Modal ---- */}
      <Modal
        isOpen={syncModalOpen}
        onClose={() => {
          if (!syncing) {
            setSyncModalOpen(false);
            setSyncResult(null);
          }
        }}
        title="Sync Gift Cards from Provider"
        size="sm"
      >
        <div className="flex flex-col items-center text-center">
          {syncing ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Syncing...</h3>
              <p className="mt-1 text-sm text-gray-500">
                Fetching latest gift card catalog from providers. This may take a moment.
              </p>
            </>
          ) : syncResult ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sync Complete</h3>
              <div className="mt-4 w-full space-y-2 rounded-lg bg-gray-50 p-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">New cards added</span>
                  <span className="font-medium text-gray-900">{syncResult.added}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Cards updated</span>
                  <span className="font-medium text-gray-900">{syncResult.updated}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Total in catalog</span>
                  <span className="font-semibold text-gray-900">{syncResult.total}</span>
                </div>
              </div>
              <Button
                className="mt-5 w-full"
                onClick={() => {
                  setSyncModalOpen(false);
                  setSyncResult(null);
                }}
              >
                Done
              </Button>
            </>
          ) : null}
        </div>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
