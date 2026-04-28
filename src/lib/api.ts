const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

// ===== Types =====

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: "user" | "business" | "admin" | "superadmin";
  isEmailVerified: boolean;
  isActive: boolean;
  isBanned?: boolean;
  banReason?: string;
  mustChangePassword?: boolean;
  businessId?: string;
  wallet: {
    balance: number;
    currency: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Business {
  _id: string;
  name: string;
  companyName?: string;
  slug?: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string;
  description?: string;
  industry?: string;
  size?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  ownerId?: string | { _id: string; firstName: string; lastName: string; email: string };
  admins?: string[];
  isVerified?: boolean;
  isActive?: boolean;
  isSuspended?: boolean;
  suspendReason?: string;
  totalSpent?: number;
  monthlyBudget?: number;
  monthlySpent?: number;
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GiftCard {
  _id: string;
  provider: string;
  providerId: string;
  brandName: string;
  brandSlug: string;
  brandLogo?: string;
  name: string;
  description?: string;
  image: string;
  category: string;
  priceType: "fixed" | "variable";
  fixedAmounts?: number[];
  minAmount?: number;
  maxAmount?: number;
  currency: string;
  discount?: number;
  isAvailable: boolean;
  countries: string[];
  redemptionType: string;
  redemptionInstructions?: string;
  popularity: number;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  _id: string;
  userId?: string | { _id: string; firstName: string; lastName: string; email: string };
  businessId?: string | { _id: string; name: string };
  recipient?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  giftCard?: {
    _id?: string;
    productName?: string;
    brandName?: string;
  };
  type: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  description?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Campaign {
  _id: string;
  businessId: string | { _id: string; name: string };
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  name: string;
  description?: string;
  type?: "birthday" | "holiday" | "anniversary" | "recognition" | "milestone" | "onboarding" | "custom";
  amount?: number;
  currency?: string;
  recipientCount?: number;
  sentCount?: number;
  redeemedCount?: number;
  totalBudget?: number;
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

export interface PromoCode {
  _id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  startDate?: string;
  expiresAt?: string;
  applicableCategories?: string[];
  applicableBrands?: string[];
  createdBy?: string | { _id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  _id: string;
  userId: string | { _id: string; firstName: string; lastName: string; email: string };
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalBusinesses: number;
  totalTransactions: number;
  totalRevenue: number;
  activeGiftCards: number;
  activeCampaigns: number;
  recentTransactions?: Transaction[];
  recentUsers?: User[];
  userGrowth?: { date: string; count: number }[];
  revenueByDay?: { date: string; amount: number }[];
}

interface BackendDashboardStats {
  users?: { total?: number; active?: number };
  businesses?: { total?: number };
  giftCards?: { total?: number };
  purchases?: { total?: number };
  subscriptions?: { active?: number };
  revenue?: {
    total?: number;
    transactions?: number;
    monthly?: Array<{ month?: string; date?: string; amount?: number; total?: number }>;
  };
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// ===== API Client =====

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("giftit_admin_token");
    }
  }

  setToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("giftit_admin_token", token);
      } else {
        localStorage.removeItem("giftit_admin_token");
      }
    }
  }

  getToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "An error occurred");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";
    return this.request<T>(`${endpoint}${queryString}`, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Helper to unwrap API response
  private unwrap<T>(response: ApiResponse<T>): T {
    if (response.data) {
      return response.data;
    }
    return response as unknown as T;
  }

  // ===== Auth =====

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const response = await this.post<{ accessToken: string; refreshToken: string; user: User }>("/auth/login", { email, password });
    return this.unwrap(response);
  }

  async getMe(): Promise<{ user: User }> {
    const response = await this.get<{ user: User }>("/auth/me");
    return this.unwrap(response);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>("/auth/change-password", { currentPassword, newPassword });
    return this.unwrap(response);
  }

  // ===== Dashboard =====

  async getDashboard(): Promise<DashboardStats> {
    const response = await this.get<{ stats?: BackendDashboardStats } | DashboardStats>("/admin/dashboard");
    const raw = this.unwrap(response) as { stats?: BackendDashboardStats } & Partial<DashboardStats>;
    const s = raw.stats;
    if (!s) {
      return raw as DashboardStats;
    }
    return {
      totalUsers: s.users?.total ?? 0,
      totalBusinesses: s.businesses?.total ?? 0,
      totalTransactions: s.purchases?.total ?? 0,
      totalRevenue: s.revenue?.total ?? 0,
      activeGiftCards: s.giftCards?.total ?? 0,
      activeCampaigns: s.subscriptions?.active ?? 0,
      revenueByDay: (s.revenue?.monthly ?? []).map((m) => ({ date: m.month ?? m.date ?? "", amount: m.amount ?? m.total ?? 0 })),
    };
  }

  // ===== Users =====

  async getUsers(params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }): Promise<{ users: User[]; pagination: Pagination }> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.role) queryParams.role = params.role;
    if (params?.status) queryParams.status = params.status;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await this.get<{ users: User[]; pagination: Pagination }>("/admin/users", queryParams);
    return this.unwrap(response);
  }

  async getUser(userId: string): Promise<{ user: User }> {
    const response = await this.get<{ user: User }>(`/admin/users/${userId}`);
    return this.unwrap(response);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<{ user: User }> {
    const response = await this.put<{ user: User }>(`/admin/users/${userId}`, data);
    return this.unwrap(response);
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>(`/admin/users/${userId}`);
    return this.unwrap(response);
  }

  async banUser(userId: string, reason?: string): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>(`/admin/users/${userId}/ban`, { reason });
    return this.unwrap(response);
  }

  async unbanUser(userId: string): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>(`/admin/users/${userId}/unban`);
    return this.unwrap(response);
  }

  // ===== Businesses =====

  async getBusinesses(params?: { search?: string; industry?: string; verified?: string; page?: number; limit?: number }): Promise<{ businesses: Business[]; pagination: Pagination }> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.industry) queryParams.industry = params.industry;
    if (params?.verified) queryParams.verified = params.verified;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await this.get<{ businesses: Business[]; pagination: Pagination }>("/admin/businesses", queryParams);
    return this.unwrap(response);
  }

  async verifyBusiness(businessId: string): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>(`/admin/businesses/${businessId}/verify`);
    return this.unwrap(response);
  }

  async suspendBusiness(businessId: string, reason?: string): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>(`/admin/businesses/${businessId}/suspend`, { reason });
    return this.unwrap(response);
  }

  async unsuspendBusiness(businessId: string): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>(`/admin/businesses/${businessId}/unsuspend`);
    return this.unwrap(response);
  }

  // ===== Gift Cards =====

  async getGiftCards(params?: { search?: string; category?: string; provider?: string; active?: string; page?: number; limit?: number }): Promise<{ giftCards: GiftCard[]; pagination: Pagination }> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.category) queryParams.category = params.category;
    if (params?.provider) queryParams.provider = params.provider;
    if (params?.active) queryParams.active = params.active;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await this.get<{ giftCards: GiftCard[]; pagination: Pagination }>("/admin/gift-cards", queryParams);
    return this.unwrap(response);
  }

  async updateGiftCard(giftCardId: string, data: Partial<GiftCard>): Promise<{ giftCard: GiftCard }> {
    const response = await this.put<{ giftCard: GiftCard }>(`/admin/gift-cards/${giftCardId}`, data);
    return this.unwrap(response);
  }

  async syncGiftCards(): Promise<{ message: string; synced: number }> {
    const response = await this.post<{ message: string; synced: number }>("/admin/gift-cards/sync");
    return this.unwrap(response);
  }

  // ===== Transactions =====

  async getTransactions(params?: { type?: string; status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<{ transactions: Transaction[]; pagination: Pagination }> {
    const queryParams: Record<string, string> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.status) queryParams.status = params.status;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await this.get<{ transactions: Transaction[]; pagination: Pagination }>("/admin/transactions", queryParams);
    return this.unwrap(response);
  }

  async refundTransaction(transactionId: string, reason?: string): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>(`/admin/transactions/${transactionId}/refund`, { reason });
    return this.unwrap(response);
  }

  // ===== Campaigns =====

  async getCampaigns(params?: { status?: string; type?: string; page?: number; limit?: number }): Promise<{ campaigns: Campaign[]; pagination: Pagination }> {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.type) queryParams.type = params.type;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await this.get<{ campaigns: Campaign[]; pagination: Pagination }>("/admin/campaigns", queryParams);
    return this.unwrap(response);
  }

  // ===== Promo Codes =====

  async getPromoCodes(params?: { page?: number; limit?: number; includeExpired?: boolean }): Promise<{ promoCodes: PromoCode[]; pagination: Pagination }> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.includeExpired !== undefined) queryParams.includeExpired = String(params.includeExpired);
    const response = await this.get<{ promoCodes: PromoCode[]; pagination: Pagination }>("/admin/promo-codes", queryParams);
    return this.unwrap(response);
  }

  async getPromoCode(promoCodeId: string): Promise<{ promoCode: PromoCode }> {
    const response = await this.get<{ promoCode: PromoCode }>(`/admin/promo-codes/${promoCodeId}`);
    return this.unwrap(response);
  }

  async createPromoCode(data: Partial<PromoCode>): Promise<{ promoCode: PromoCode }> {
    const response = await this.post<{ promoCode: PromoCode }>("/admin/promo-codes", data);
    return this.unwrap(response);
  }

  async updatePromoCode(promoCodeId: string, data: Partial<PromoCode>): Promise<{ promoCode: PromoCode }> {
    const response = await this.put<{ promoCode: PromoCode }>(`/admin/promo-codes/${promoCodeId}`, data);
    return this.unwrap(response);
  }

  async deletePromoCode(promoCodeId: string): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>(`/admin/promo-codes/${promoCodeId}`);
    return this.unwrap(response);
  }

  async validatePromoCode(code: string, userId: string, purchaseAmount: number): Promise<{ valid: boolean; discount?: number; message?: string }> {
    const response = await this.post<{ valid: boolean; discount?: number; message?: string }>("/admin/promo-codes/validate", { code, userId, purchaseAmount });
    return this.unwrap(response);
  }

  // ===== Settings =====

  async getSettings(category?: string): Promise<{ settings: Record<string, unknown> }> {
    const queryParams: Record<string, string> = {};
    if (category) queryParams.category = category;
    const response = await this.get<{ settings: Record<string, unknown> }>("/admin/settings", queryParams);
    return this.unwrap(response);
  }

  async updateSettings(settings: Record<string, unknown>): Promise<{ settings: Record<string, unknown> }> {
    const response = await this.put<{ settings: Record<string, unknown> }>("/admin/settings", settings);
    return this.unwrap(response);
  }

  async initializeSettings(): Promise<{ message: string; settings: Record<string, unknown> }> {
    const response = await this.post<{ message: string; settings: Record<string, unknown> }>("/admin/settings/initialize");
    return this.unwrap(response);
  }

  // ===== Audit Logs =====

  async getAuditLogs(params?: { userId?: string; action?: string; resourceType?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<{ auditLogs: AuditLog[]; pagination: Pagination }> {
    const queryParams: Record<string, string> = {};
    if (params?.userId) queryParams.userId = params.userId;
    if (params?.action) queryParams.action = params.action;
    if (params?.resourceType) queryParams.resourceType = params.resourceType;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await this.get<{ auditLogs: AuditLog[]; pagination: Pagination }>("/admin/audit-logs", queryParams);
    return this.unwrap(response);
  }

  // ===== Notifications =====

  async broadcastNotification(data: { title: string; message: string; targetAudience?: string; target?: string; targetRole?: string; targetUsers?: string[] }): Promise<{ message: string; sent: number }> {
    const response = await this.post<{ message: string; sent: number }>("/admin/notifications/broadcast", data);
    return this.unwrap(response);
  }

  // ===== Reports =====

  async getRevenueReport(period?: string): Promise<{ report: { totalRevenue: number; revenueByDay: { date: string; amount: number }[]; revenueByCategory: { category: string; amount: number }[] } }> {
    const queryParams: Record<string, string> = {};
    if (period) queryParams.period = period;
    const response = await this.get<{ report: { totalRevenue: number; revenueByDay: { date: string; amount: number }[]; revenueByCategory: { category: string; amount: number }[] } }>("/admin/reports/revenue", queryParams);
    return this.unwrap(response);
  }

  async getUserGrowthReport(period?: string): Promise<{ report: { totalUsers: number; newUsers: number; growthByDay: { date: string; count: number }[]; usersByRole: { role: string; count: number }[] } }> {
    const queryParams: Record<string, string> = {};
    if (period) queryParams.period = period;
    const response = await this.get<{ report: { totalUsers: number; newUsers: number; growthByDay: { date: string; count: number }[]; usersByRole: { role: string; count: number }[] } }>("/admin/reports/user-growth", queryParams);
    return this.unwrap(response);
  }

  async getGiftCardReport(): Promise<{ report: { totalCards: number; activeCards: number; topBrands: { brand: string; count: number; revenue: number }[]; byCategory: { category: string; count: number }[] } }> {
    const response = await this.get<{ report: { totalCards: number; activeCards: number; topBrands: { brand: string; count: number; revenue: number }[]; byCategory: { category: string; count: number }[] } }>("/admin/reports/gift-cards");
    return this.unwrap(response);
  }
}

export const api = new ApiClient(API_BASE_URL);
