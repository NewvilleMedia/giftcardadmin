"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  BadgeCheck,
  Clock,
  ShieldOff,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Users as UsersIcon,
} from "lucide-react";
import { api, type Business } from "@/lib/api";
import { Card, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Modal } from "@/components/ui";
import { formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock Data (uses the API Business type with its field names)
// ---------------------------------------------------------------------------

const mockBusinesses: Business[] = [
  {
    _id: "b1",
    name: "TechCorp Solutions",
    email: "info@techcorp.com",
    phone: "+1 555-0201",
    address: "123 Innovation Dr, San Francisco, CA 94105",
    industry: "technology",
    description: "Leading enterprise software solutions provider specializing in cloud infrastructure and DevOps tooling.",
    employeeCount: 250,
    monthlyBudget: 50000,
    totalSpent: 32450.75,
    isVerified: true,
    isActive: true,
    ownerId: { _id: "u1", firstName: "Bob", lastName: "Smith", email: "bob@techcorp.com" },
    createdAt: "2025-03-15T10:00:00Z",
    updatedAt: "2026-03-01T09:45:00Z",
  },
  {
    _id: "b2",
    name: "Fresh Bites Catering",
    email: "hello@freshbites.com",
    phone: "+1 555-0202",
    address: "456 Culinary Ave, Austin, TX 78701",
    industry: "food",
    description: "Premium corporate catering service with farm-to-table approach.",
    employeeCount: 45,
    monthlyBudget: 10000,
    totalSpent: 8750.0,
    isVerified: true,
    isActive: true,
    ownerId: { _id: "u2", firstName: "Maria", lastName: "Garcia", email: "maria@freshbites.com" },
    createdAt: "2025-05-20T14:30:00Z",
    updatedAt: "2026-02-18T11:15:00Z",
  },
  {
    _id: "b3",
    name: "HealthFirst Clinic",
    email: "admin@healthfirst.com",
    phone: "+1 555-0203",
    address: "789 Wellness Blvd, Boston, MA 02108",
    industry: "healthcare",
    description: "Multi-specialty healthcare clinic focused on preventive care and employee wellness programs.",
    employeeCount: 120,
    monthlyBudget: 25000,
    totalSpent: 15200.5,
    isVerified: false,
    isActive: true,
    ownerId: { _id: "u3", firstName: "James", lastName: "Park", email: "james@healthfirst.com" },
    createdAt: "2025-08-10T09:00:00Z",
    updatedAt: "2026-03-05T16:20:00Z",
  },
  {
    _id: "b4",
    name: "EduLearn Academy",
    email: "contact@edulearn.com",
    phone: "+1 555-0204",
    address: "321 Campus Way, Chicago, IL 60601",
    industry: "education",
    description: "Online learning platform offering professional development courses and certifications.",
    employeeCount: 30,
    monthlyBudget: 8000,
    totalSpent: 4200.0,
    isVerified: true,
    isActive: true,
    ownerId: { _id: "u4", firstName: "Sarah", lastName: "Chen", email: "sarah@edulearn.com" },
    createdAt: "2025-06-01T12:00:00Z",
    updatedAt: "2026-02-28T10:00:00Z",
  },
  {
    _id: "b5",
    name: "ShopMart Retail",
    email: "support@shopmart.com",
    phone: "+1 555-0205",
    address: "555 Commerce St, New York, NY 10001",
    industry: "retail",
    description: "National retail chain specializing in electronics and home goods.",
    employeeCount: 500,
    monthlyBudget: 75000,
    totalSpent: 62800.25,
    isVerified: false,
    isActive: false,
    isSuspended: true,
    suspendReason: "Non-compliance with platform terms of service regarding gift card resale.",
    ownerId: { _id: "u5", firstName: "Tom", lastName: "Anderson", email: "tom@shopmart.com" },
    createdAt: "2025-02-14T08:30:00Z",
    updatedAt: "2026-01-20T14:45:00Z",
  },
  {
    _id: "b6",
    name: "FinanceHub Advisors",
    email: "info@financehub.com",
    phone: "+1 555-0206",
    address: "888 Wall St, New York, NY 10005",
    industry: "finance",
    description: "Financial advisory firm providing wealth management and corporate finance services.",
    employeeCount: 85,
    monthlyBudget: 40000,
    totalSpent: 22100.0,
    isVerified: false,
    isActive: true,
    ownerId: { _id: "u6", firstName: "Lisa", lastName: "Wong", email: "lisa@financehub.com" },
    createdAt: "2025-09-28T15:00:00Z",
    updatedAt: "2026-03-08T08:30:00Z",
  },
  {
    _id: "b7",
    name: "GreenEnergy Co",
    email: "hello@greenenergy.com",
    phone: "+1 555-0207",
    address: "100 Solar Way, Denver, CO 80202",
    industry: "technology",
    description: "Renewable energy solutions for commercial and residential markets.",
    employeeCount: 150,
    monthlyBudget: 30000,
    totalSpent: 18500.0,
    isVerified: true,
    isActive: true,
    ownerId: { _id: "u7", firstName: "Mike", lastName: "Green", email: "mike@greenenergy.com" },
    createdAt: "2025-04-22T10:15:00Z",
    updatedAt: "2026-02-25T13:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type VerificationStatus = "verified" | "pending" | "suspended";

function getVerificationStatus(business: Business): VerificationStatus {
  if (business.isSuspended) return "suspended";
  if (business.isVerified) return "verified";
  return "pending";
}

const verificationBadgeVariant: Record<VerificationStatus, "success" | "warning" | "danger"> = {
  verified: "success",
  pending: "warning",
  suspended: "danger",
};

const verificationLabel: Record<VerificationStatus, string> = {
  verified: "Verified",
  pending: "Pending",
  suspended: "Suspended",
};

const industryLabels: Record<string, string> = {
  technology: "Technology",
  retail: "Retail",
  food: "Food & Beverage",
  healthcare: "Healthcare",
  finance: "Finance",
  education: "Education",
  other: "Other",
};

function getBusinessInitials(name: string): string {
  const words = name.split(" ");
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getOwnerInfo(ownerId: Business["ownerId"]): { firstName: string; lastName: string; email: string } | null {
  if (!ownerId) return null;
  if (typeof ownerId === "string") return null;
  return ownerId;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Actions Dropdown
// ---------------------------------------------------------------------------

function ActionsDropdown({
  business,
  onView,
  onVerify,
  onSuspend,
}: {
  business: Business;
  onView: () => void;
  onVerify: () => void;
  onSuspend: () => void;
}) {
  const [open, setOpen] = useState(false);
  const status = getVerificationStatus(business);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            >
              <button
                onClick={() => { setOpen(false); onView(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" /> View Details
              </button>
              {status === "pending" && (
                <button
                  onClick={() => { setOpen(false); onVerify(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Verify
                </button>
              )}
              <button
                onClick={() => { setOpen(false); onSuspend(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {status === "suspended" ? (
                  <><CheckCircle2 className="h-4 w-4" /> Unsuspend</>
                ) : (
                  <><ShieldOff className="h-4 w-4" /> Suspend</>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View Business Modal
// ---------------------------------------------------------------------------

function ViewBusinessModal({
  business,
  open,
  onClose,
}: {
  business: Business | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!business) return null;

  const status = getVerificationStatus(business);
  const owner = getOwnerInfo(business.ownerId);
  const fullAddress = [business.address, business.city, business.state, business.zipCode, business.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Modal open={open} onClose={onClose} title="Business Details" size="lg">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-600">
          {getBusinessInitials(business.name)}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
          <Badge variant={verificationBadgeVariant[status]} dot>
            {verificationLabel[status]}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {business.description && (
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Description</p>
          <p className="text-sm text-gray-700">{business.description}</p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-start gap-2">
          <Mail className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Email</p>
            <p className="text-sm text-gray-900">{business.email}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Phone className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Phone</p>
            <p className="text-sm text-gray-900">{business.phone || "N/A"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Address</p>
            <p className="text-sm text-gray-900">{fullAddress || "N/A"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Industry</p>
            <p className="text-sm text-gray-900">{industryLabels[business.industry ?? ""] || business.industry || "N/A"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <UsersIcon className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Employees</p>
            <p className="text-sm text-gray-900">{(business.employeeCount ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <DollarSign className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Monthly Budget</p>
            <p className="text-sm text-gray-900">{formatCurrency(business.monthlyBudget ?? 0)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <DollarSign className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Spent</p>
            <p className="text-sm text-gray-900">{formatCurrency(business.totalSpent ?? 0)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Created</p>
            <p className="text-sm text-gray-900">{business.createdAt ? formatDateTime(business.createdAt) : "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Owner info */}
      {owner && (
        <div className="mb-6 rounded-lg border border-gray-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Business Owner</p>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-800">
              {getInitials(owner.firstName, owner.lastName)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {owner.firstName} {owner.lastName}
              </p>
              <p className="text-xs text-gray-500">{owner.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Suspend reason */}
      {business.suspendReason && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-red-600 mb-1">Suspension Reason</p>
          <p className="text-sm text-red-800">{business.suspendReason}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Verify Business Modal
// ---------------------------------------------------------------------------

function VerifyBusinessModal({
  business,
  open,
  onClose,
  onConfirm,
}: {
  business: Business | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!business) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Verify Business">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 shrink-0" />
          <div className="text-sm text-green-800">
            <p>
              Are you sure you want to verify <strong>{business.name}</strong>? This will grant them full
              access to all business features on the platform.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Industry</p>
              <p className="text-gray-900">{industryLabels[business.industry ?? ""] || business.industry || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Employees</p>
              <p className="text-gray-900">{(business.employeeCount ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
              <p className="text-gray-900">{business.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Created</p>
              <p className="text-gray-900">{business.createdAt ? formatDate(business.createdAt) : "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} loading={loading}>
            Verify Business
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Suspend Business Modal
// ---------------------------------------------------------------------------

function SuspendBusinessModal({
  business,
  open,
  onClose,
  onConfirm,
}: {
  business: Business | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!business) return null;

  const isSuspended = !!business.isSuspended;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={isSuspended ? "Unsuspend Business" : "Suspend Business"}>
      <div className="space-y-4">
        <div className={`flex items-start gap-3 rounded-lg p-4 ${
          isSuspended ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
        }`}>
          <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${
            isSuspended ? "text-green-600" : "text-yellow-600"
          }`} />
          <div className={`text-sm ${isSuspended ? "text-green-800" : "text-yellow-800"}`}>
            {isSuspended ? (
              <p>
                Are you sure you want to unsuspend <strong>{business.name}</strong>? They will regain
                access to their business account and all associated features.
              </p>
            ) : (
              <p>
                Are you sure you want to suspend <strong>{business.name}</strong>? They will immediately
                lose access to all business features, and any active campaigns will be paused.
              </p>
            )}
          </div>
        </div>

        {!isSuspended && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Suspension Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for suspending this business..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              required
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant={isSuspended ? "primary" : "danger"}
            onClick={handleConfirm}
            loading={loading}
            disabled={!isSuspended && !reason.trim()}
          >
            {isSuspended ? "Unsuspend Business" : "Suspend Business"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function PaginationControl({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("ellipsis");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-4 sm:px-6 py-4">
      <Button
        variant="secondary"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Previous
      </Button>
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-green-800 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  // Modals
  const [viewBusiness, setViewBusiness] = useState<Business | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<Business | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Business | null>(null);

  const limit = 8;

  // ---- Fetch businesses ----
  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { page: number; limit: number; search?: string; industry?: string; verified?: string } = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (industryFilter !== "all") params.industry = industryFilter;
      if (verifiedFilter !== "all") params.verified = verifiedFilter;

      const data = await api.getBusinesses(params);
      setBusinesses(data.businesses);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch {
      // Fallback to mock data
      const filtered = mockBusinesses.filter((b) => {
        const matchSearch =
          !search.trim() ||
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.email.toLowerCase().includes(search.toLowerCase());
        const matchIndustry = industryFilter === "all" || b.industry === industryFilter;
        const status = getVerificationStatus(b);
        const matchVerified =
          verifiedFilter === "all" ||
          (verifiedFilter === "verified" && status === "verified") ||
          (verifiedFilter === "unverified" && status !== "verified");
        return matchSearch && matchIndustry && matchVerified;
      });
      setBusinesses(filtered);
      setTotal(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));
      setError("Using demo data — API unavailable");
    } finally {
      setLoading(false);
    }
  }, [page, search, industryFilter, verifiedFilter]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, industryFilter, verifiedFilter]);

  // ---- Stats ----
  const stats = {
    total: total,
    verified: businesses.filter((b) => b.isVerified && !b.isSuspended).length,
    pending: businesses.filter((b) => !b.isVerified && !b.isSuspended).length,
    suspended: businesses.filter((b) => b.isSuspended).length,
  };

  // ---- Handlers ----
  const handleVerifyConfirm = async () => {
    if (!verifyTarget) return;
    try {
      await api.verifyBusiness(verifyTarget._id);
      setVerifyTarget(null);
      fetchBusinesses();
    } catch {
      // Optimistically update local state
      setBusinesses((prev) =>
        prev.map((b) =>
          b._id === verifyTarget._id
            ? { ...b, isVerified: true }
            : b
        )
      );
      setVerifyTarget(null);
    }
  };

  const handleSuspendConfirm = async (reason: string) => {
    if (!suspendTarget) return;
    try {
      if (suspendTarget.isSuspended) {
        await api.unsuspendBusiness(suspendTarget._id);
      } else {
        await api.suspendBusiness(suspendTarget._id, reason);
      }
      setSuspendTarget(null);
      fetchBusinesses();
    } catch {
      // Optimistically update local state
      setBusinesses((prev) =>
        prev.map((b) =>
          b._id === suspendTarget._id
            ? {
                ...b,
                isSuspended: !suspendTarget.isSuspended,
                isActive: suspendTarget.isSuspended ? true : false,
                suspendReason: suspendTarget.isSuspended ? undefined : reason,
              }
            : b
        )
      );
      setSuspendTarget(null);
    }
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage registered businesses, verify accounts, and handle suspensions.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard icon={Building2} label="Total Businesses" value={stats.total} color="bg-green-700" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard icon={BadgeCheck} label="Verified" value={stats.verified} color="bg-green-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard icon={Clock} label="Pending Verification" value={stats.pending} color="bg-yellow-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard icon={ShieldOff} label="Suspended" value={stats.suspended} color="bg-red-500" />
        </motion.div>
      </div>

      {/* Filters + Table Card */}
      <Card>
        {/* Filters bar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 px-4 sm:px-6 py-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="all">All Industries</option>
              <option value="technology">Technology</option>
              <option value="retail">Retail</option>
              <option value="food">Food & Beverage</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-green-700" />
                      <p className="text-sm text-gray-500">Loading businesses...</p>
                    </div>
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="h-10 w-10 text-gray-300" />
                      <p className="text-sm text-gray-500">No businesses found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {businesses.map((business, idx) => {
                    const status = getVerificationStatus(business);
                    return (
                      <motion.tr
                        key={business._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Business cell */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-600">
                              {getBusinessInitials(business.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{business.name}</p>
                              <p className="text-xs text-gray-500">{business.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Industry */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {industryLabels[business.industry ?? ""] || business.industry || "N/A"}
                        </td>
                        {/* Verification Status */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge variant={verificationBadgeVariant[status]} dot>
                            {verificationLabel[status]}
                          </Badge>
                        </td>
                        {/* Employees */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {(business.employeeCount ?? 0).toLocaleString()}
                        </td>
                        {/* Total Spent */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {formatCurrency(business.totalSpent ?? 0)}
                        </td>
                        {/* Created */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {business.createdAt ? formatDate(business.createdAt) : "N/A"}
                        </td>
                        {/* Actions */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <ActionsDropdown
                            business={business}
                            onView={() => setViewBusiness(business)}
                            onVerify={() => setVerifyTarget(business)}
                            onSuspend={() => setSuspendTarget(business)}
                          />
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <PaginationControl page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </Card>

      {/* Modals */}
      <ViewBusinessModal business={viewBusiness} open={!!viewBusiness} onClose={() => setViewBusiness(null)} />
      <VerifyBusinessModal
        business={verifyTarget}
        open={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        onConfirm={handleVerifyConfirm}
      />
      <SuspendBusinessModal
        business={suspendTarget}
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleSuspendConfirm}
      />
    </div>
  );
}
