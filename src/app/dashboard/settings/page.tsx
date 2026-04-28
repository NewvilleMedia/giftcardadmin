"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Shield,
  Bell,
  Plug,
  Wrench,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  Database,
  Zap,
  Globe,
  Mail,
  DollarSign,
  Lock,
  Key,
  Clock,
  Users,
  Megaphone,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type TabId = "general" | "security" | "notifications" | "integrations" | "maintenance";

interface GeneralSettings {
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  defaultCurrency: string;
  commissionRate: number;
}

interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  requireEmailVerification: boolean;
  jwtTokenExpiry: string;
  rateLimitRequests: number;
  rateLimitWindow: number;
}

interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  welcomeEmailEnabled: boolean;
  purchaseConfirmationEmail: boolean;
  adminAlertThreshold: number;
}

interface IntegrationStatus {
  stripe: boolean;
  runa: boolean;
  firebase: boolean;
  awsS3: boolean;
  resend: boolean;
}

interface BroadcastForm {
  title: string;
  message: string;
  target: "all" | "users" | "business" | "verified";
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Settings className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "integrations", label: "Integrations", icon: <Plug className="h-4 w-4" /> },
  { id: "maintenance", label: "Maintenance", icon: <Wrench className="h-4 w-4" /> },
];

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NGN"];

function Toggle({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          enabled ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function StatusMessage({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        type === "success"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {message}
    </motion.div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [general, setGeneral] = useState<GeneralSettings>({
    platformName: "GiftIt",
    platformUrl: "https://giftit.com",
    supportEmail: "support@giftit.com",
    defaultCurrency: "USD",
    commissionRate: 5,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    passwordMinLength: 8,
    requireEmailVerification: true,
    jwtTokenExpiry: "7d",
    rateLimitRequests: 100,
    rateLimitWindow: 15,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    welcomeEmailEnabled: true,
    purchaseConfirmationEmail: true,
    adminAlertThreshold: 1000,
  });

  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    stripe: false,
    runa: false,
    firebase: false,
    awsS3: false,
    resend: false,
  });

  const [broadcast, setBroadcast] = useState<BroadcastForm>({
    title: "",
    message: "",
    target: "all",
  });

  const [syncingCards, setSyncingCards] = useState(false);
  const [initializingSettings, setInitializingSettings] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const showStatus = useCallback(
    (type: "success" | "error", message: string) => {
      setStatusMessage({ type, message });
      setTimeout(() => setStatusMessage(null), 4000);
    },
    []
  );

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = (await api.getSettings()) as Record<string, unknown>;
        if (data) {
          const g = data.general as Partial<GeneralSettings> | undefined;
          if (g) {
            setGeneral((prev) => ({
              platformName: g.platformName ?? prev.platformName,
              platformUrl: g.platformUrl ?? prev.platformUrl,
              supportEmail: g.supportEmail ?? prev.supportEmail,
              defaultCurrency: g.defaultCurrency ?? prev.defaultCurrency,
              commissionRate: g.commissionRate ?? prev.commissionRate,
            }));
          }
          const s = data.security as Partial<SecuritySettings> | undefined;
          if (s) {
            setSecurity((prev) => ({
              maxLoginAttempts: s.maxLoginAttempts ?? prev.maxLoginAttempts,
              lockoutDuration: s.lockoutDuration ?? prev.lockoutDuration,
              passwordMinLength: s.passwordMinLength ?? prev.passwordMinLength,
              requireEmailVerification:
                s.requireEmailVerification ?? prev.requireEmailVerification,
              jwtTokenExpiry: s.jwtTokenExpiry ?? prev.jwtTokenExpiry,
              rateLimitRequests: s.rateLimitRequests ?? prev.rateLimitRequests,
              rateLimitWindow: s.rateLimitWindow ?? prev.rateLimitWindow,
            }));
          }
          const n = data.notifications as Partial<NotificationSettings> | undefined;
          if (n) {
            setNotifications((prev) => ({
              emailNotificationsEnabled:
                n.emailNotificationsEnabled ?? prev.emailNotificationsEnabled,
              pushNotificationsEnabled:
                n.pushNotificationsEnabled ?? prev.pushNotificationsEnabled,
              welcomeEmailEnabled: n.welcomeEmailEnabled ?? prev.welcomeEmailEnabled,
              purchaseConfirmationEmail:
                n.purchaseConfirmationEmail ?? prev.purchaseConfirmationEmail,
              adminAlertThreshold: n.adminAlertThreshold ?? prev.adminAlertThreshold,
            }));
          }
          const i = data.integrations as Partial<IntegrationStatus> | undefined;
          if (i) {
            setIntegrations((prev) => ({
              stripe: i.stripe ?? prev.stripe,
              runa: i.runa ?? prev.runa,
              firebase: i.firebase ?? prev.firebase,
              awsS3: i.awsS3 ?? prev.awsS3,
              resend: i.resend ?? prev.resend,
            }));
          }
        }
      } catch {
        showStatus("error", "Failed to load settings. Using defaults.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [showStatus]);

  async function handleSaveGeneral() {
    try {
      setSaving(true);
      await api.updateSettings({ general });
      showStatus("success", "General settings saved successfully.");
    } catch {
      showStatus("error", "Failed to save general settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSecurity() {
    try {
      setSaving(true);
      await api.updateSettings({ security });
      showStatus("success", "Security settings saved successfully.");
    } catch {
      showStatus("error", "Failed to save security settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotifications() {
    try {
      setSaving(true);
      await api.updateSettings({ notifications });
      showStatus("success", "Notification settings saved successfully.");
    } catch {
      showStatus("error", "Failed to save notification settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleInitializeSettings() {
    try {
      setInitializingSettings(true);
      await api.initializeSettings();
      showStatus("success", "Settings initialized successfully.");
      const data = (await api.getSettings()) as Record<string, unknown>;
      if (data) {
        const g = data.general as GeneralSettings | undefined;
        if (g) setGeneral(g);
        const s = data.security as SecuritySettings | undefined;
        if (s) setSecurity(s);
        const n = data.notifications as NotificationSettings | undefined;
        if (n) setNotifications(n);
        const i = data.integrations as IntegrationStatus | undefined;
        if (i) setIntegrations(i);
      }
    } catch {
      showStatus("error", "Failed to initialize settings.");
    } finally {
      setInitializingSettings(false);
    }
  }

  async function handleSyncGiftCards() {
    try {
      setSyncingCards(true);
      await api.syncGiftCards();
      showStatus("success", "Gift cards synced successfully.");
    } catch {
      showStatus("error", "Failed to sync gift cards.");
    } finally {
      setSyncingCards(false);
    }
  }

  async function handleBroadcast() {
    if (!broadcast.title.trim() || !broadcast.message.trim()) {
      showStatus("error", "Please enter both a title and message.");
      return;
    }
    try {
      setSendingBroadcast(true);
      await api.broadcastNotification({
        title: broadcast.title,
        message: broadcast.message,
        targetAudience: broadcast.target,
      });
      showStatus("success", "Notification broadcast sent successfully.");
      setBroadcast({ title: "", message: "", target: "all" });
    } catch {
      showStatus("error", "Failed to send broadcast notification.");
    } finally {
      setSendingBroadcast(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading settings...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage platform configuration and system preferences.
        </p>
      </div>

      <AnimatePresence>
        {statusMessage && (
          <StatusMessage type={statusMessage.type} message={statusMessage.message} />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="md:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex whitespace-nowrap items-center gap-2 md:gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-indigo-600" />
                      General Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <Input
                      label="Platform Name"
                      value={general.platformName}
                      onChange={(e) =>
                        setGeneral({ ...general, platformName: e.target.value })
                      }
                      placeholder="GiftIt"
                    />
                    <Input
                      label="Platform URL"
                      value={general.platformUrl}
                      onChange={(e) =>
                        setGeneral({ ...general, platformUrl: e.target.value })
                      }
                      placeholder="https://giftit.com"
                      icon={<Globe className="h-4 w-4" />}
                    />
                    <Input
                      label="Support Email"
                      type="email"
                      value={general.supportEmail}
                      onChange={(e) =>
                        setGeneral({ ...general, supportEmail: e.target.value })
                      }
                      placeholder="support@giftit.com"
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Default Currency
                      </label>
                      <select
                        value={general.defaultCurrency}
                        onChange={(e) =>
                          setGeneral({ ...general, defaultCurrency: e.target.value })
                        }
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Commission Rate (%)
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={general.commissionRate}
                          onChange={(e) =>
                            setGeneral({
                              ...general,
                              commissionRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-12 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <Button
                        onClick={handleSaveGeneral}
                        loading={saving}
                        leftIcon={<Save className="h-4 w-4" />}
                      >
                        Save General Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-indigo-600" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Max Login Attempts
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={security.maxLoginAttempts}
                            onChange={(e) =>
                              setSecurity({
                                ...security,
                                maxLoginAttempts: parseInt(e.target.value) || 5,
                              })
                            }
                            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Lockout Duration (minutes)
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Clock className="h-4 w-4" />
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={1440}
                            value={security.lockoutDuration}
                            onChange={(e) =>
                              setSecurity({
                                ...security,
                                lockoutDuration: parseInt(e.target.value) || 30,
                              })
                            }
                            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                    <Input
                      label="Password Minimum Length"
                      type="number"
                      min={6}
                      max={128}
                      value={security.passwordMinLength}
                      onChange={(e) =>
                        setSecurity({
                          ...security,
                          passwordMinLength: parseInt(e.target.value) || 8,
                        })
                      }
                      icon={<Key className="h-4 w-4" />}
                    />
                    <Toggle
                      enabled={security.requireEmailVerification}
                      onToggle={() =>
                        setSecurity({
                          ...security,
                          requireEmailVerification: !security.requireEmailVerification,
                        })
                      }
                      label="Require Email Verification"
                      description="Users must verify their email before accessing platform features."
                    />
                    <Input
                      label="JWT Token Expiry"
                      value={security.jwtTokenExpiry}
                      onChange={(e) =>
                        setSecurity({ ...security, jwtTokenExpiry: e.target.value })
                      }
                      placeholder="7d"
                      icon={<Clock className="h-4 w-4" />}
                    />
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Rate Limiting Configuration
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Requests per Window"
                          type="number"
                          min={1}
                          value={security.rateLimitRequests}
                          onChange={(e) =>
                            setSecurity({
                              ...security,
                              rateLimitRequests: parseInt(e.target.value) || 100,
                            })
                          }
                        />
                        <Input
                          label="Window Duration (minutes)"
                          type="number"
                          min={1}
                          value={security.rateLimitWindow}
                          onChange={(e) =>
                            setSecurity({
                              ...security,
                              rateLimitWindow: parseInt(e.target.value) || 15,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <Button
                        onClick={handleSaveSecurity}
                        loading={saving}
                        leftIcon={<Save className="h-4 w-4" />}
                      >
                        Save Security Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-indigo-600" />
                      Notification Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Toggle
                      enabled={notifications.emailNotificationsEnabled}
                      onToggle={() =>
                        setNotifications({
                          ...notifications,
                          emailNotificationsEnabled:
                            !notifications.emailNotificationsEnabled,
                        })
                      }
                      label="Enable Email Notifications"
                      description="Send transactional and marketing emails to users."
                    />
                    <div className="border-t border-gray-100" />
                    <Toggle
                      enabled={notifications.pushNotificationsEnabled}
                      onToggle={() =>
                        setNotifications({
                          ...notifications,
                          pushNotificationsEnabled:
                            !notifications.pushNotificationsEnabled,
                        })
                      }
                      label="Enable Push Notifications"
                      description="Send push notifications to mobile app users."
                    />
                    <div className="border-t border-gray-100" />
                    <Toggle
                      enabled={notifications.welcomeEmailEnabled}
                      onToggle={() =>
                        setNotifications({
                          ...notifications,
                          welcomeEmailEnabled: !notifications.welcomeEmailEnabled,
                        })
                      }
                      label="Welcome Email"
                      description="Send a welcome email when a new user registers."
                    />
                    <div className="border-t border-gray-100" />
                    <Toggle
                      enabled={notifications.purchaseConfirmationEmail}
                      onToggle={() =>
                        setNotifications({
                          ...notifications,
                          purchaseConfirmationEmail:
                            !notifications.purchaseConfirmationEmail,
                        })
                      }
                      label="Purchase Confirmation Email"
                      description="Send confirmation emails after successful gift card purchases."
                    />
                    <div className="border-t border-gray-100 pt-3" />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Admin Alert Threshold ($)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Notify admins when a single transaction exceeds this amount.
                      </p>
                      <div className="relative max-w-xs">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={notifications.adminAlertThreshold}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              adminAlertThreshold: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <Button
                        onClick={handleSaveNotifications}
                        loading={saving}
                        leftIcon={<Save className="h-4 w-4" />}
                      >
                        Save Notification Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "integrations" && (
              <motion.div
                key="integrations"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plug className="h-5 w-5 text-indigo-600" />
                      Integrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-gray-500">
                      Connection status of third-party services. API keys are managed
                      through environment variables.
                    </p>
                    <div className="space-y-3">
                      <IntegrationRow
                        name="Stripe"
                        description="Payment processing and subscription management"
                        connected={integrations.stripe}
                        icon={
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                          </div>
                        }
                      />
                      <IntegrationRow
                        name="Runa API"
                        description="Gift card catalog and fulfillment"
                        connected={integrations.runa}
                        icon={
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <Zap className="h-5 w-5 text-blue-600" />
                          </div>
                        }
                      />
                      <IntegrationRow
                        name="Firebase"
                        description="Push notifications and real-time updates"
                        connected={integrations.firebase}
                        icon={
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                            <Bell className="h-5 w-5 text-orange-600" />
                          </div>
                        }
                      />
                      <IntegrationRow
                        name="AWS S3"
                        description="File storage and media assets"
                        connected={integrations.awsS3}
                        icon={
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                            <Database className="h-5 w-5 text-yellow-600" />
                          </div>
                        }
                      />
                      <IntegrationRow
                        name="Resend"
                        description="Transactional email delivery"
                        connected={integrations.resend}
                        icon={
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                            <Mail className="h-5 w-5 text-green-600" />
                          </div>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "maintenance" && (
              <motion.div
                key="maintenance"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-indigo-600" />
                      Maintenance Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Initialize Settings
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Reset all platform settings to their default values. This will
                          not affect user data.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleInitializeSettings}
                        loading={initializingSettings}
                        leftIcon={<Database className="h-4 w-4" />}
                      >
                        Initialize
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Sync Gift Cards
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Synchronize the gift card catalog with the Runa API to fetch
                          latest products and pricing.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleSyncGiftCards}
                        loading={syncingCards}
                        leftIcon={<RefreshCw className="h-4 w-4" />}
                      >
                        Sync Cards
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Clear Old Notifications
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Notifications older than 90 days are automatically purged
                          during daily maintenance windows. No manual action required.
                        </p>
                      </div>
                      <Badge variant="green">Automatic</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          System Health
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          All services are operational. Last health check completed
                          within the past 5 minutes.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                        </span>
                        <span className="text-sm font-medium text-green-700">
                          Healthy
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Broadcast Notification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-600" />
            Broadcast Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Send a notification to platform users. This will be delivered via push
            notification and in-app messaging.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Notification Title"
              value={broadcast.title}
              onChange={(e) =>
                setBroadcast({ ...broadcast, title: e.target.value })
              }
              placeholder="Enter notification title"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Target Audience
              </label>
              <select
                value={broadcast.target}
                onChange={(e) =>
                  setBroadcast({
                    ...broadcast,
                    target: e.target.value as BroadcastForm["target"],
                  })
                }
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Users</option>
                <option value="users">Individual Users Only</option>
                <option value="business">Business Accounts Only</option>
                <option value="verified">Verified Users Only</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              value={broadcast.message}
              onChange={(e) =>
                setBroadcast({ ...broadcast, message: e.target.value })
              }
              placeholder="Enter notification message..."
              rows={4}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                Sending to:{" "}
                <span className="font-medium text-gray-700">
                  {broadcast.target === "all"
                    ? "All Users"
                    : broadcast.target === "users"
                    ? "Individual Users"
                    : broadcast.target === "business"
                    ? "Business Accounts"
                    : "Verified Users"}
                </span>
              </span>
            </div>
            <Button
              onClick={handleBroadcast}
              loading={sendingBroadcast}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Send Broadcast
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function IntegrationRow({
  name,
  description,
  connected,
  icon,
}: {
  name: string;
  description: string;
  connected: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {connected ? (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <Badge variant="green">Connected</Badge>
        </div>
      ) : (
        <Badge variant="gray">Not Connected</Badge>
      )}
    </div>
  );
}
