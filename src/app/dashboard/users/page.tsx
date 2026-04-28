"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Shield,
  MoreHorizontal,
  Eye,
  Pencil,
  Ban,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { api, type User } from "@/lib/api";
import { Card, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Modal } from "@/components/ui";
import { formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockUsers: User[] = [
  {
    _id: "1",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    role: "user",
    isEmailVerified: true,
    isActive: true,
    wallet: { balance: 245.5, currency: "USD" },
    phone: "+1 555-0101",
    createdAt: "2025-06-15T10:30:00Z",
    updatedAt: "2026-02-20T14:00:00Z",
  },
  {
    _id: "2",
    firstName: "Bob",
    lastName: "Smith",
    email: "bob@techcorp.com",
    role: "business",
    isEmailVerified: true,
    isActive: true,
    wallet: { balance: 1200.0, currency: "USD" },
    phone: "+1 555-0102",
    createdAt: "2025-07-22T08:00:00Z",
    updatedAt: "2026-03-01T09:45:00Z",
  },
  {
    _id: "3",
    firstName: "Carol",
    lastName: "Davis",
    email: "carol@admin.giftit.com",
    role: "admin",
    isEmailVerified: true,
    isActive: true,
    wallet: { balance: 0, currency: "USD" },
    createdAt: "2025-04-10T12:00:00Z",
    updatedAt: "2026-01-15T16:30:00Z",
  },
  {
    _id: "4",
    firstName: "David",
    lastName: "Martinez",
    email: "david@example.com",
    role: "user",
    isEmailVerified: false,
    isActive: false,
    isBanned: true,
    banReason: "Fraudulent activity detected",
    wallet: { balance: 50.0, currency: "USD" },
    createdAt: "2025-09-01T07:20:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },
  {
    _id: "5",
    firstName: "Eva",
    lastName: "Wilson",
    email: "eva@superadmin.giftit.com",
    role: "superadmin",
    isEmailVerified: true,
    isActive: true,
    wallet: { balance: 0, currency: "USD" },
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-03-10T18:00:00Z",
  },
  {
    _id: "6",
    firstName: "Frank",
    lastName: "Brown",
    email: "frank@example.com",
    role: "user",
    isEmailVerified: false,
    isActive: false,
    wallet: { balance: 10.25, currency: "USD" },
    createdAt: "2025-11-12T14:45:00Z",
    updatedAt: "2026-01-02T09:00:00Z",
  },
  {
    _id: "7",
    firstName: "Grace",
    lastName: "Lee",
    email: "grace@retailshop.com",
    role: "business",
    isEmailVerified: true,
    isActive: true,
    wallet: { balance: 3400.75, currency: "USD" },
    phone: "+1 555-0107",
    createdAt: "2025-08-05T11:15:00Z",
    updatedAt: "2026-03-08T07:30:00Z",
  },
  {
    _id: "8",
    firstName: "Henry",
    lastName: "Clark",
    email: "henry@example.com",
    role: "user",
    isEmailVerified: true,
    isActive: true,
    wallet: { balance: 89.99, currency: "USD" },
    createdAt: "2025-12-20T16:00:00Z",
    updatedAt: "2026-03-05T12:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUserStatus(user: User): "active" | "inactive" | "banned" {
  if (user.isBanned) return "banned";
  if (user.isActive) return "active";
  return "inactive";
}

const roleBadgeVariant: Record<string, "default" | "info" | "purple" | "success" | "warning" | "danger"> = {
  user: "default",
  business: "info",
  admin: "purple",
  superadmin: "purple",
};

const statusBadgeVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "purple"> = {
  active: "success",
  inactive: "default",
  banned: "danger",
};

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
  user,
  onView,
  onEdit,
  onBan,
  onDelete,
}: {
  user: User;
  onView: () => void;
  onEdit: () => void;
  onBan: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

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
              <button
                onClick={() => { setOpen(false); onEdit(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => { setOpen(false); onBan(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Ban className="h-4 w-4" />
                {user.isBanned ? "Unban" : "Ban"}
              </button>
              <button
                onClick={() => { setOpen(false); onDelete(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View User Modal
// ---------------------------------------------------------------------------

function ViewUserModal({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  if (!user) return null;

  const status = getUserStatus(user);

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Full Name", value: `${user.firstName} ${user.lastName}` },
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone || "N/A" },
    {
      label: "Role",
      value: <Badge variant={roleBadgeVariant[user.role]} dot>{user.role}</Badge>,
    },
    {
      label: "Status",
      value: <Badge variant={statusBadgeVariant[status]} dot>{status}</Badge>,
    },
    {
      label: "Email Verified",
      value: user.isEmailVerified ? (
        <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> Verified</span>
      ) : (
        <span className="flex items-center gap-1 text-red-500"><XCircle className="h-4 w-4" /> Unverified</span>
      ),
    },
    { label: "Wallet Balance", value: formatCurrency(user.wallet.balance, user.wallet.currency) },
    { label: "Joined", value: user.createdAt ? formatDateTime(user.createdAt) : "N/A" },
    { label: "Last Updated", value: user.updatedAt ? formatDateTime(user.updatedAt) : "N/A" },
  ];

  if (user.banReason) {
    fields.push({ label: "Ban Reason", value: user.banReason });
  }

  return (
    <Modal open={open} onClose={onClose} title="User Details" size="lg">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
          {getInitials(user.firstName, user.lastName)}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">{f.label}</p>
            <div className="text-sm text-gray-900">{f.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Edit User Modal
// ---------------------------------------------------------------------------

function EditUserModal({
  user,
  open,
  onClose,
  onSave,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: { firstName: string; lastName: string; email: string; role: string }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ firstName, lastName, email, role });
    setSaving(false);
  };

  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="user">User</option>
            <option value="business">Business</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Ban User Modal
// ---------------------------------------------------------------------------

function BanUserModal({
  user,
  open,
  onClose,
  onConfirm,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!user) return null;

  const isBanned = !!user.isBanned;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={isBanned ? "Unban User" : "Ban User"}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600 shrink-0" />
          <div className="text-sm text-yellow-800">
            {isBanned ? (
              <p>Are you sure you want to unban <strong>{user.firstName} {user.lastName}</strong>? They will regain access to their account.</p>
            ) : (
              <p>Are you sure you want to ban <strong>{user.firstName} {user.lastName}</strong>? They will lose access to their account immediately.</p>
            )}
          </div>
        </div>
        {!isBanned && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ban Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for banning this user..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant={isBanned ? "primary" : "danger"}
            onClick={handleConfirm}
            loading={loading}
            disabled={!isBanned && !reason.trim()}
          >
            {isBanned ? "Unban User" : "Ban User"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Delete User Modal
// ---------------------------------------------------------------------------

function DeleteUserModal({
  user,
  open,
  onClose,
  onConfirm,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete User">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 shrink-0" />
          <div className="text-sm text-red-800">
            <p>
              This action is <strong>permanent and irreversible</strong>. All data for{" "}
              <strong>{user.firstName} {user.lastName}</strong> ({user.email}) will be permanently deleted.
            </p>
            <p className="mt-2">This action is restricted to superadmins only.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading}>
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Pagination({
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
                  ? "bg-indigo-600 text-white"
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [banTargetUser, setBanTargetUser] = useState<User | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);

  const limit = 8;

  // ---- Fetch users ----
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { page: number; limit: number; search?: string; role?: string; status?: string } = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await api.getUsers(params);
      setUsers(data.users);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch {
      // Fallback to mock data
      const filtered = mockUsers.filter((u) => {
        const matchSearch =
          !search.trim() ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        const userStatus = getUserStatus(u);
        const matchStatus = statusFilter === "all" || userStatus === statusFilter;
        return matchSearch && matchRole && matchStatus;
      });
      setUsers(filtered);
      setTotal(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));
      setError("Using demo data — API unavailable");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  // ---- Stats ----
  const stats = {
    total: total,
    active: users.filter((u) => u.isActive && !u.isBanned).length,
    banned: users.filter((u) => u.isBanned).length,
    admins: users.filter((u) => u.role === "admin" || u.role === "superadmin").length,
  };

  // ---- Handlers ----
  const handleEditSave = async (data: { firstName: string; lastName: string; email: string; role: string }) => {
    if (!editUser) return;
    try {
      await api.updateUser(editUser._id, data as Partial<User>);
      setEditUser(null);
      fetchUsers();
    } catch {
      // Optimistically update local state
      setUsers((prev) =>
        prev.map((u) =>
          u._id === editUser._id
            ? { ...u, firstName: data.firstName, lastName: data.lastName, email: data.email, role: data.role as User["role"] }
            : u
        )
      );
      setEditUser(null);
    }
  };

  const handleBanConfirm = async (reason: string) => {
    if (!banTargetUser) return;
    try {
      if (banTargetUser.isBanned) {
        await api.unbanUser(banTargetUser._id);
      } else {
        await api.banUser(banTargetUser._id, reason);
      }
      setBanTargetUser(null);
      fetchUsers();
    } catch {
      // Optimistically update local state
      setUsers((prev) =>
        prev.map((u) =>
          u._id === banTargetUser._id
            ? {
                ...u,
                isBanned: !banTargetUser.isBanned,
                isActive: banTargetUser.isBanned ? true : false,
                banReason: banTargetUser.isBanned ? undefined : reason,
              }
            : u
        )
      );
      setBanTargetUser(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetUser) return;
    try {
      await api.deleteUser(deleteTargetUser._id);
      setDeleteTargetUser(null);
      fetchUsers();
    } catch {
      // Optimistically remove from local state
      setUsers((prev) => prev.filter((u) => u._id !== deleteTargetUser._id));
      setTotal((prev) => prev - 1);
      setDeleteTargetUser(null);
    }
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage all registered users, update roles, and moderate accounts.
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
          <StatCard icon={Users} label="Total Users" value={stats.total} color="bg-indigo-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard icon={UserCheck} label="Active Users" value={stats.active} color="bg-green-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard icon={UserX} label="Banned Users" value={stats.banned} color="bg-red-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard icon={Shield} label="Admin Users" value={stats.admins} color="bg-purple-500" />
        </motion.div>
      </div>

      {/* Filters + Table Card */}
      <Card>
        {/* Filters bar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 px-4 sm:px-6 py-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="business">Business</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Email Verified</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Wallet Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <p className="text-sm text-gray-500">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-10 w-10 text-gray-300" />
                      <p className="text-sm text-gray-500">No users found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {users.map((user, idx) => {
                    const status = getUserStatus(user);
                    return (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        {/* User cell */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
                        </td>
                        {/* Status */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge variant={statusBadgeVariant[status]} dot>{status}</Badge>
                        </td>
                        {/* Email Verified */}
                        <td className="whitespace-nowrap px-6 py-4">
                          {user.isEmailVerified ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-300" />
                          )}
                        </td>
                        {/* Wallet Balance */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {formatCurrency(user.wallet.balance, user.wallet.currency)}
                        </td>
                        {/* Joined */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                        </td>
                        {/* Actions */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <ActionsDropdown
                            user={user}
                            onView={() => setViewUser(user)}
                            onEdit={() => setEditUser(user)}
                            onBan={() => setBanTargetUser(user)}
                            onDelete={() => setDeleteTargetUser(user)}
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </Card>

      {/* Modals */}
      <ViewUserModal user={viewUser} open={!!viewUser} onClose={() => setViewUser(null)} />
      <EditUserModal user={editUser} open={!!editUser} onClose={() => setEditUser(null)} onSave={handleEditSave} />
      <BanUserModal user={banTargetUser} open={!!banTargetUser} onClose={() => setBanTargetUser(null)} onConfirm={handleBanConfirm} />
      <DeleteUserModal user={deleteTargetUser} open={!!deleteTargetUser} onClose={() => setDeleteTargetUser(null)} onConfirm={handleDeleteConfirm} />
    </div>
  );
}
