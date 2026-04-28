"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Tag,
  CheckCircle2,
  Clock,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Percent,
  DollarSign,
  Truck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { api, type PromoCode as ApiPromoCode, type Pagination } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Extended PromoCode type (supports free_delivery and richer fields) */
/* ------------------------------------------------------------------ */

interface PromoCodeExtended extends Omit<ApiPromoCode, "discountType"> {
  discountType: "percentage" | "fixed" | "free_delivery";
  name?: string;
  usageLimit?: number;
  usageCount?: number;
  perUserLimit?: number;
  minimumPurchaseAmount?: number;
  startDate?: string;
  endDate?: string;
}

interface PromoFormData {
  code: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed" | "free_delivery";
  discountValue: number;
  maxDiscountAmount: string;
  usageLimit: string;
  perUserLimit: string;
  minimumPurchaseAmount: string;
  startDate: string;
  endDate: string;
  applicableCategories: string;
  isActive: boolean;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_PROMO_CODES: PromoCodeExtended[] = [
  {
    _id: "promo_001",
    code: "WELCOME20",
    name: "Welcome Discount",
    description: "20% off for new users on their first gift card purchase.",
    discountType: "percentage",
    discountValue: 20,
    maxDiscountAmount: 15,
    usageLimit: 1000,
    usageCount: 347,
    currentUses: 347,
    perUserLimit: 1,
    minimumPurchaseAmount: 25,
    minPurchaseAmount: 25,
    startDate: "2026-01-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
    expiresAt: "2026-06-30T23:59:59Z",
    applicableCategories: ["gift-cards", "e-gift"],
    isActive: true,
    createdAt: "2025-12-20T10:00:00Z",
    updatedAt: "2026-03-10T08:15:00Z",
  },
  {
    _id: "promo_002",
    code: "FIVEOFF",
    name: "Five Dollar Friday",
    description: "$5 off every order over $30 on Fridays.",
    discountType: "fixed",
    discountValue: 5,
    usageLimit: 500,
    usageCount: 500,
    currentUses: 500,
    perUserLimit: 3,
    minimumPurchaseAmount: 30,
    minPurchaseAmount: 30,
    startDate: "2026-02-01T00:00:00Z",
    endDate: "2026-02-28T23:59:59Z",
    expiresAt: "2026-02-28T23:59:59Z",
    applicableCategories: [],
    isActive: false,
    createdAt: "2026-01-25T14:00:00Z",
    updatedAt: "2026-02-28T23:59:59Z",
  },
  {
    _id: "promo_003",
    code: "FREESHIP",
    name: "Free Delivery March",
    description: "Free delivery on all physical gift card orders during March.",
    discountType: "free_delivery",
    discountValue: 0,
    usageLimit: 2000,
    usageCount: 128,
    currentUses: 128,
    minimumPurchaseAmount: 10,
    minPurchaseAmount: 10,
    startDate: "2026-03-01T00:00:00Z",
    endDate: "2026-03-31T23:59:59Z",
    expiresAt: "2026-03-31T23:59:59Z",
    applicableCategories: ["physical"],
    isActive: true,
    createdAt: "2026-02-25T09:30:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
  },
];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM: PromoFormData = {
  code: "",
  name: "",
  description: "",
  discountType: "percentage",
  discountValue: 0,
  maxDiscountAmount: "",
  usageLimit: "",
  perUserLimit: "",
  minimumPurchaseAmount: "",
  startDate: "",
  endDate: "",
  applicableCategories: "",
  isActive: true,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getUsageCount(p: PromoCodeExtended): number {
  return p.usageCount ?? p.currentUses ?? 0;
}

function getUsageLimit(p: PromoCodeExtended): number | undefined {
  return p.usageLimit ?? p.maxUses;
}

function getMinPurchase(p: PromoCodeExtended): number | undefined {
  return p.minimumPurchaseAmount ?? p.minPurchaseAmount;
}

function getEndDate(p: PromoCodeExtended): string | undefined {
  return p.endDate ?? p.expiresAt;
}

function discountLabel(promo: PromoCodeExtended): string {
  if (promo.discountType === "percentage") return `${promo.discountValue}%`;
  if (promo.discountType === "fixed") return formatCurrency(promo.discountValue);
  return "Free Delivery";
}

function discountIcon(type: PromoCodeExtended["discountType"]) {
  if (type === "percentage") return <Percent className="h-3.5 w-3.5" />;
  if (type === "fixed") return <DollarSign className="h-3.5 w-3.5" />;
  return <Truck className="h-3.5 w-3.5" />;
}

function promoStatus(promo: PromoCodeExtended): "active" | "expired" | "inactive" {
  if (!promo.isActive) return "inactive";
  const end = getEndDate(promo);
  if (end && new Date(end) < new Date()) return "expired";
  return "active";
}

function statusBadgeVariant(status: "active" | "expired" | "inactive"): "green" | "red" | "gray" {
  if (status === "active") return "green";
  if (status === "expired") return "red";
  return "gray";
}

function usagePercent(promo: PromoCodeExtended): number {
  const limit = getUsageLimit(promo);
  if (!limit) return 0;
  return Math.min(100, Math.round((getUsageCount(promo) / limit) * 100));
}

function toLocalDatetimeValue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCodeExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [includeExpired, setIncludeExpired] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCodeExtended | null>(null);
  const [formData, setFormData] = useState<PromoFormData>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---- Data fetching ---- */
  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getPromoCodes({
        page,
        limit: ITEMS_PER_PAGE,
        includeExpired,
      });
      const fetched = data.promoCodes as PromoCodeExtended[];
      const filtered = search.trim()
        ? fetched.filter(
            (p) =>
              p.code.toLowerCase().includes(search.toLowerCase()) ||
              (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
              (p.description ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : fetched;
      setPromoCodes(filtered);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch {
      setPromoCodes(MOCK_PROMO_CODES);
      setTotalPages(1);
      setTotalItems(MOCK_PROMO_CODES.length);
    } finally {
      setLoading(false);
    }
  }, [page, includeExpired, search]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  // Auto-dismiss success
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  /* ---- Derived stats ---- */
  const stats = {
    total: totalItems,
    active: promoCodes.filter((p) => promoStatus(p) === "active").length,
    expired: promoCodes.filter((p) => promoStatus(p) === "expired").length,
    totalUses: promoCodes.reduce((sum, p) => sum + getUsageCount(p), 0),
  };

  /* ---- Copy to clipboard ---- */
  const copyCode = async (promo: PromoCodeExtended) => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedId(promo._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard may be blocked */
    }
  };

  /* ---- Form helpers ---- */
  const updateField = (field: keyof PromoFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (promo: PromoCodeExtended) => {
    setSelectedPromo(promo);
    setFormData({
      code: promo.code,
      name: promo.name ?? "",
      description: promo.description ?? "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscountAmount: promo.maxDiscountAmount != null ? String(promo.maxDiscountAmount) : "",
      usageLimit: getUsageLimit(promo) != null ? String(getUsageLimit(promo)) : "",
      perUserLimit: promo.perUserLimit != null ? String(promo.perUserLimit) : "",
      minimumPurchaseAmount: getMinPurchase(promo) != null ? String(getMinPurchase(promo)) : "",
      startDate: toLocalDatetimeValue(promo.startDate),
      endDate: toLocalDatetimeValue(getEndDate(promo)),
      applicableCategories: (promo.applicableCategories ?? []).join(", "),
      isActive: promo.isActive,
    });
    setFormError(null);
    setEditOpen(true);
  };

  const openDelete = (promo: PromoCodeExtended) => {
    setSelectedPromo(promo);
    setFormError(null);
    setDeleteOpen(true);
  };

  const buildPayload = (): Partial<ApiPromoCode> => {
    const payload: Record<string, unknown> = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description.trim(),
      discountType: formData.discountType === "free_delivery" ? "fixed" : formData.discountType,
      discountValue: formData.discountType === "free_delivery" ? 0 : Number(formData.discountValue),
      isActive: formData.isActive,
    };
    if (formData.maxDiscountAmount) payload.maxDiscountAmount = Number(formData.maxDiscountAmount);
    if (formData.usageLimit) payload.maxUses = Number(formData.usageLimit);
    if (formData.minimumPurchaseAmount) payload.minPurchaseAmount = Number(formData.minimumPurchaseAmount);
    if (formData.startDate) payload.startDate = new Date(formData.startDate).toISOString();
    if (formData.endDate) payload.expiresAt = new Date(formData.endDate).toISOString();
    if (formData.applicableCategories.trim()) {
      payload.applicableCategories = formData.applicableCategories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }
    return payload as Partial<ApiPromoCode>;
  };

  const validateForm = (): string | null => {
    if (!formData.code.trim()) return "Code is required.";
    if (formData.discountType !== "free_delivery" && formData.discountValue <= 0)
      return "Discount value must be greater than zero.";
    if (!formData.startDate) return "Start date is required.";
    if (!formData.endDate) return "End date is required.";
    if (new Date(formData.endDate) <= new Date(formData.startDate))
      return "End date must be after start date.";
    return null;
  };

  /* ---- CRUD handlers ---- */
  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormLoading(true);
    setFormError(null);

    try {
      await api.createPromoCode(buildPayload());
      setCreateOpen(false);
      setSuccessMessage("Promo code created successfully.");
      fetchPromoCodes();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create promo code.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPromo) return;
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormLoading(true);
    setFormError(null);

    try {
      await api.updatePromoCode(selectedPromo._id, buildPayload());
      setEditOpen(false);
      setSuccessMessage("Promo code updated successfully.");
      fetchPromoCodes();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to update promo code.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPromo) return;
    setFormLoading(true);
    setFormError(null);

    try {
      await api.deletePromoCode(selectedPromo._id);
      setDeleteOpen(false);
      setSuccessMessage("Promo code deleted successfully.");
      fetchPromoCodes();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to delete promo code.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPromoCodes();
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
  /*  Shared Form Renderer                                             */
  /* ---------------------------------------------------------------- */

  const renderForm = () => (
    <div className="space-y-4">
      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code */}
      <Input
        label="Code"
        placeholder="e.g. SUMMER25"
        value={formData.code}
        onChange={(e) => updateField("code", e.target.value.toUpperCase())}
        className="font-mono uppercase"
      />

      {/* Name */}
      <Input
        label="Name"
        placeholder="Promo code name"
        value={formData.name}
        onChange={(e) => updateField("name", e.target.value)}
      />

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          rows={3}
          placeholder="Brief description of this promo code..."
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </div>

      {/* Discount Type & Value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Discount Type</label>
          <select
            value={formData.discountType}
            onChange={(e) => updateField("discountType", e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="free_delivery">Free Delivery</option>
          </select>
        </div>
        <Input
          label="Discount Value"
          type="number"
          min={0}
          step={formData.discountType === "percentage" ? 1 : 0.01}
          placeholder={formData.discountType === "percentage" ? "e.g. 20" : "e.g. 5.00"}
          value={formData.discountType === "free_delivery" ? "" : String(formData.discountValue)}
          onChange={(e) => updateField("discountValue", Number(e.target.value))}
          disabled={formData.discountType === "free_delivery"}
        />
      </div>

      {/* Max Discount Amount */}
      <Input
        label="Max Discount Amount (optional)"
        type="number"
        min={0}
        step={0.01}
        placeholder="e.g. 15.00"
        value={formData.maxDiscountAmount}
        onChange={(e) => updateField("maxDiscountAmount", e.target.value)}
      />

      {/* Usage Limits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Usage Limit (optional)"
          type="number"
          min={0}
          placeholder="e.g. 1000"
          value={formData.usageLimit}
          onChange={(e) => updateField("usageLimit", e.target.value)}
        />
        <Input
          label="Per User Limit (optional)"
          type="number"
          min={0}
          placeholder="e.g. 1"
          value={formData.perUserLimit}
          onChange={(e) => updateField("perUserLimit", e.target.value)}
        />
      </div>

      {/* Minimum Purchase */}
      <Input
        label="Minimum Purchase Amount (optional)"
        type="number"
        min={0}
        step={0.01}
        placeholder="e.g. 25.00"
        value={formData.minimumPurchaseAmount}
        onChange={(e) => updateField("minimumPurchaseAmount", e.target.value)}
      />

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="datetime-local"
          value={formData.startDate}
          onChange={(e) => updateField("startDate", e.target.value)}
        />
        <Input
          label="End Date"
          type="datetime-local"
          value={formData.endDate}
          onChange={(e) => updateField("endDate", e.target.value)}
        />
      </div>

      {/* Applicable Categories */}
      <Input
        label="Applicable Categories (comma-separated, optional)"
        placeholder="e.g. gift-cards, e-gift, physical"
        value={formData.applicableCategories}
        onChange={(e) => updateField("applicableCategories", e.target.value)}
      />

      {/* Active Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={formData.isActive}
          onClick={() => updateField("isActive", !formData.isActive)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            formData.isActive ? "bg-indigo-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              formData.isActive ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {formData.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create, edit, and manage promotional codes for gift card discounts.
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
                <Tag className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Promo Codes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Uses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUses.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ---- Success Message ---- */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ---- Action Bar ---- */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              placeholder="Search promo codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Include Expired Toggle */}
            <label className="flex cursor-pointer items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={includeExpired}
                onClick={() => {
                  setIncludeExpired((v) => !v);
                  setPage(1);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  includeExpired ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    includeExpired ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="whitespace-nowrap text-sm text-gray-600">Include Expired</span>
            </label>

            <Button
              type="button"
              onClick={openCreate}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Promo Code
            </Button>
          </div>
        </form>
      </Card>

      {/* ---- Table ---- */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-gray-500">Loading promo codes...</p>
            </div>
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Tag className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No promo codes found</p>
            <p className="mt-1 text-xs text-gray-400">Create your first promo code to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Code</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Discount</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Usage</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Per User Limit</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Min Purchase</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Valid Period</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                {promoCodes.map((promo) => {
                  const status = promoStatus(promo);
                  const limit = getUsageLimit(promo);
                  const count = getUsageCount(promo);
                  const minPurch = getMinPurchase(promo);
                  const start = promo.startDate;
                  const end = getEndDate(promo);

                  return (
                    <motion.tr
                      key={promo._id}
                      variants={itemVariants}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      {/* Code (copyable) */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-800">
                            {promo.code}
                          </span>
                          <button
                            onClick={() => copyCode(promo)}
                            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Copy code"
                          >
                            {copiedId === promo._id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                        {promo.name ?? <span className="text-gray-400">--</span>}
                      </td>

                      {/* Discount */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          {discountIcon(promo.discountType)}
                          <span className="font-medium">{discountLabel(promo)}</span>
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="px-6 py-4">
                        <div className="min-w-[120px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {count}
                              {limit != null && ` / ${limit}`}
                            </span>
                          </div>
                          {limit != null && (
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <motion.div
                                className={`h-full rounded-full ${
                                  usagePercent(promo) >= 90 ? "bg-red-500" : "bg-indigo-500"
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${usagePercent(promo)}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Per User Limit */}
                      <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                        {promo.perUserLimit != null ? promo.perUserLimit : <span className="text-gray-400">--</span>}
                      </td>

                      {/* Min Purchase */}
                      <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                        {minPurch != null ? (
                          formatCurrency(minPurch)
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>

                      {/* Valid Period */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-xs text-gray-500">
                          <div>{start ? formatDate(start) : "--"}</div>
                          <div className="text-gray-400">to</div>
                          <div>{end ? formatDate(end) : "--"}</div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(promo)}
                            leftIcon={<Pencil className="h-3.5 w-3.5" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(promo)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        )}

        {/* ---- Pagination ---- */}
        {!loading && promoCodes.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3">
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
      {/*  CREATE PROMO CODE MODAL                                         */}
      {/* ================================================================ */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Promo Code"
        size="lg"
      >
        {renderForm()}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={formLoading}>
            Create Promo Code
          </Button>
        </div>
      </Modal>

      {/* ================================================================ */}
      {/*  EDIT PROMO CODE MODAL                                           */}
      {/* ================================================================ */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Promo Code"
        size="lg"
      >
        {renderForm()}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} loading={formLoading}>
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* ================================================================ */}
      {/*  DELETE CONFIRMATION MODAL                                        */}
      {/* ================================================================ */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Promo Code"
        size="sm"
      >
        <div className="space-y-4">
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the promo code{" "}
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-gray-800">
                  {selectedPromo?.code}
                </span>
                ? This action cannot be undone.
              </p>
              {selectedPromo && getUsageCount(selectedPromo as PromoCodeExtended) > 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  This promo code has been used {getUsageCount(selectedPromo as PromoCodeExtended)} time
                  {getUsageCount(selectedPromo as PromoCodeExtended) !== 1 ? "s" : ""}.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={formLoading}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
