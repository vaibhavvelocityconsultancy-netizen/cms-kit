"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  Link2,
  Download,
  Eye,
  Upload,
  Share2,
  Calendar,
  Clock,
  Crown,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  MoreVertical,
  User,
  Mail,
  Activity,
  Settings,
  CreditCard,
  Plus,
  FolderPlus,
  ChevronRight,
  File,
  Image,
  FileSpreadsheet,
  FileArchive,
  FileCode,
} from "lucide-react";
import { TrialExpiryPopup } from "./TrialExpiryPopup";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Plan {
  id: number;
  title: string;
  monthlyPrice: string | number | null;
  yearlyPrice: string | number | null;
  allowMonthly: boolean;
  allowYearly: boolean;
  billingCycle: string;
}

interface Stats {
  totalFiles: number;
  totalShares: number;
  viewedShares: number;
  downloadedFiles: number;
}

interface RecentFile {
  id: number;
  name?: string;
  fileName?: string;
  originalName?: string;
  size?: string;
  uploadedAt?: string;
  createdAt?: string;
  status?: string;
}

interface RecentShare {
  id: number;
  email?: string;
  recipientEmail?: string;
  sharedWith?: string;
  files?: number;
  filesCount?: number;
  viewed?: boolean;
  downloaded?: boolean;
  created?: string;
  createdAt?: string;
  status?: string;
}

interface SubscriptionData {
  accessType: string;
  plan: Plan | null;
  status: string;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  startsAt: string;
  stats: Stats;
  recentFiles: RecentFile[];
  recentShares: RecentShare[];
}

interface DashboardResponse {
  statusCode: number;
  data: SubscriptionData;
  message: string;
  success: boolean;
}

import { getBaseUrl } from "@/src/lib/config";

const fetchDashboardData = async (): Promise<DashboardResponse> => {
  const response = await fetch(`${getBaseUrl()}/api/subscriber-dashbaord`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  const data = await response.json();
  return data;
};

const AccessDateSummary = ({
  targetDate,
  status,
}: {
  targetDate: string | null;
  status: string;
}) => {
  const targetDateObj = targetDate ? new Date(targetDate) : null;
  const isValidTargetDate =
    !!targetDateObj && !Number.isNaN(targetDateObj.getTime());
  const formattedTargetDate = isValidTargetDate
    ? targetDateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const daysRemaining = isValidTargetDate
    ? Math.max(
        0,
        Math.ceil(
          (targetDateObj!.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;
  const isTrial = status === "TRIAL";

  return (
    <div className="flex flex-col items-start gap-1 text-sm lg:items-end">
      <div className="font-semibold text-gray-900">
        {daysRemaining === null
          ? isTrial
            ? "Trial end date unavailable"
            : "Renewal date unavailable"
          : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}
      </div>
      <div className="text-xs text-gray-500">
        {formattedTargetDate
          ? `${isTrial ? "Ends on" : "Renews on"} ${formattedTargetDate}`
          : isTrial
            ? "Trial end date is not set"
            : "Renewal date is not set"}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, trend }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          +{trend}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value || 0}</p>
    </div>
  </div>
);

// File Icon Component with null safety
const FileIcon = ({ fileName }: { fileName?: string }) => {
  if (!fileName) {
    return <File className="w-5 h-5 text-gray-500" />;
  }

  const ext = fileName.split(".").pop()?.toLowerCase();
  const iconMap: { [key: string]: any } = {
    pdf: FileText,
    xlsx: FileSpreadsheet,
    xls: FileSpreadsheet,
    jpg: Image,
    jpeg: Image,
    png: Image,
    gif: Image,
    zip: FileArchive,
    rar: FileArchive,
    js: FileCode,
    ts: FileCode,
    py: FileCode,
    html: FileCode,
    css: FileCode,
  };
  const Icon = iconMap[ext || ""] || File;
  return <Icon className="w-5 h-5 text-gray-500" />;
};

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPopup, setShowPopup] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [showActivationSuccess, setShowActivationSuccess] = useState(false);
  const previousStatusRef = useRef<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    retry: 1,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const status = query.state.data?.success
        ? query.state.data.data?.status
        : null;
      return status === "PENDING" && !pollingTimedOut ? 3000 : false;
    },
  });

  const subscription = data?.success ? data.data : null;
  const subscriptionStatus = subscription?.status ?? null;

  useEffect(() => {
    if (!subscription) return;

    const alreadyShownTrial = sessionStorage.getItem("trialPopupShown");
    const alreadyShownExpired = sessionStorage.getItem(
      "trialExpiredPopupShown",
    );

    if (subscription.status === "TRIAL" && !alreadyShownTrial) {
      setShowPopup(true);
      sessionStorage.setItem("trialPopupShown", "true");
    } else if (subscription.status === "EXPIRED" && !alreadyShownExpired) {
      setShowPopup(true);
      sessionStorage.setItem("trialExpiredPopupShown", "true");
    }
  }, [subscription]);

  useEffect(() => {
    if (subscriptionStatus !== "PENDING") {
      setPollingTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setPollingTimedOut(true);
    }, 60000);

    return () => window.clearTimeout(timer);
  }, [subscriptionStatus]);

  useEffect(() => {
    if (subscriptionStatus !== "ACTIVE") return;

    setPollingTimedOut(false);
    if (previousStatusRef.current === "PENDING") {
      setShowActivationSuccess(true);
    }
    previousStatusRef.current = subscriptionStatus;

    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as Array<string | number>;
        return key.some(
          (segment) =>
            typeof segment === "string" &&
            /dashboard|subscription|plan/i.test(segment),
        );
      },
    });
  }, [subscriptionStatus, queryClient]);

  useEffect(() => {
    if (!subscription) {
      previousStatusRef.current = null;
      return;
    }

    if (previousStatusRef.current === null) {
      previousStatusRef.current = subscriptionStatus;
      return;
    }

    previousStatusRef.current = subscriptionStatus;
  }, [subscriptionStatus, subscription]);

  const handlePopupDismiss = () => {
    setShowPopup(false);
  };

  const handleActivationSuccessClose = () => {
    setShowActivationSuccess(false);
  };

  // Helper function to safely get file name
  const getFileName = (file: RecentFile) => {
    return file.originalName || file.fileName || "Untitled";
  };

  // Helper function to safely get file size
  const getFileSize = (file: RecentFile) => {
    return file.size || "0 KB";
  };

  // Helper function to safely get upload date
  const getUploadDate = (file: RecentFile) => {
    const date = file.uploadedAt || file.createdAt;
    return date ? new Date(date).toLocaleDateString() : "N/A";
  };

  // Helper function to safely get file status
  const getFileStatus = (file: RecentFile) => {
    return file.status || "Private";
  };

  // Helper function to safely get share email
  const getShareEmail = (share: RecentShare) => {
    return share.sharedWith || share.recipientEmail || "Unknown";
  };

  // Helper function to safely get share date
  const getShareDate = (share: RecentShare) => {
    const date = share.created || share.createdAt;
    return date ? new Date(date).toLocaleDateString() : "N/A";
  };

  // Helper function to safely get share status
  const getShareStatus = (share: RecentShare) => {
    return share.status || "Active";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-semibold">Error loading dashboard</h3>
          </div>
          <p className="text-red-700 mt-2">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full text-center">
          <h3 className="text-lg font-semibold text-yellow-800">
            No subscription found
          </h3>
          <p className="text-yellow-700 mt-2">
            Please subscribe to access premium content.
          </p>
          <button
            onClick={() => router.push("/admin/plans")}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "TRIAL":
        return "bg-blue-100 text-blue-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "TRIAL":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "EXPIRED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTimerDate = (status: string) => {
    switch (status) {
      case "TRIAL":
        return subscription.trialEndsAt || subscription.currentPeriodEnd;
      case "ACTIVE":
        return subscription.currentPeriodEnd;
      default:
        return subscription.currentPeriodEnd;
    }
  };

  const getNumericPrice = (price: Plan["monthlyPrice"]) => {
    if (price === null || price === undefined || price === "") return null;
    const numericPrice = Number(price);
    return Number.isFinite(numericPrice) ? numericPrice : null;
  };

  const formatPrice = (price: Plan["monthlyPrice"]) => {
    const numericPrice = getNumericPrice(price);
    if (numericPrice === null) return null;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  const getBillingLabel = (plan: Plan | null) => {
    const monthlyPrice = formatPrice(plan?.monthlyPrice);
    const yearlyPrice = formatPrice(plan?.yearlyPrice);

    if (plan?.allowMonthly && monthlyPrice && plan.allowYearly && yearlyPrice) {
      return `${monthlyPrice}/mo or ${yearlyPrice}/yr`;
    }
    if (plan?.allowMonthly && monthlyPrice) {
      return `${monthlyPrice}/mo`;
    }
    if (plan?.allowYearly && yearlyPrice) {
      return `${yearlyPrice}/yr`;
    }
    return "Contact us";
  };

  // Safely get recent files
  const recentFiles = subscription.recentFiles || [];
  const recentShares = subscription.recentShares || [];

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="w-full p-4 md:p-8">
          {" "}
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Monitor your files, shares and account activity.
              </p>
            </div>
          </div>
          {/* Section 1: Subscription Overview */}
          {subscriptionStatus === "PENDING" && !pollingTimedOut && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Activating your subscription...</span>
              </div>
            </div>
          )}
          {subscriptionStatus === "PENDING" && pollingTimedOut && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              We&apos;re still waiting for PayPal to confirm your subscription.
              Please refresh in a few moments.
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Crown className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {subscription?.plan?.title} Plan
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}
                    >
                      {subscription.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>{getBillingLabel(subscription.plan)}</span>
                    {subscription.status !== "EXPIRED" && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {subscription.status === "TRIAL"
                          ? "Trial access"
                          : "Subscription access"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {subscription.status !== "EXPIRED" && (
                  <AccessDateSummary
                    targetDate={getTimerDate(subscription.status)}
                    status={subscription.status}
                  />
                )}
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap">
                  {subscription.status === "TRIAL"
                    ? "Upgrade Now"
                    : "Manage Subscription"}
                </button>
              </div>
            </div>
          </div>
          {/* Section 2: Quick Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Folder}
              title="Files Uploaded"
              value={subscription.stats?.totalFiles || 0}
            />
            <StatCard
              icon={Link2}
              title="Share Links"
              value={subscription.stats?.totalShares || 0}
            />
            <StatCard
              icon={Download}
              title="Downloads"
              value={subscription.stats?.downloadedFiles || 0}
            />
            <StatCard
              icon={Eye}
              title="Views"
              value={subscription.stats?.viewedShares || 0}
            />
          </div>
          {/* Section 4: Recent Files */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Files</h3>
              {/* <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button> */}
            </div>
            {recentFiles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        File
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Size
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Uploaded
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Status
                      </th>
                      {/* <th className="text-right text-xs font-medium text-gray-500 pb-3">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {recentFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FileIcon fileName={getFileName(file)} />
                            <span className="text-sm text-gray-900">
                              {getFileName(file)}
                            </span>
                          </div>
                        </td>
                        <td className="text-sm text-gray-600">
                          {getFileSize(file)}
                        </td>
                        <td className="text-sm text-gray-600">
                          {getUploadDate(file)}
                        </td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              getFileStatus(file) === "Shared"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getFileStatus(file)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No files uploaded yet</p>
                <p className="text-sm">Upload your first file to get started</p>
              </div>
            )}
          </div>
          {/* Section 5: Recent Shares */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Shares</h3>
            </div>
            {recentShares.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Recipient
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Files
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Viewed
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Downloaded
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Created
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 pb-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentShares.map((share) => (
                      <tr
                        key={share.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {getShareEmail(share)}
                            </span>
                          </div>
                        </td>
                        <td className="text-sm text-gray-600">
                          {share.filesCount || 0}
                        </td>
                        <td>
                          <span
                            className={`text-sm ${share.viewed ? "text-green-600" : "text-gray-400"}`}
                          >
                            {share.viewed ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`text-sm ${share.downloaded ? "text-green-600" : "text-gray-400"}`}
                          >
                            {share.downloaded ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="text-sm text-gray-600">
                          {getShareDate(share)}
                        </td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              getShareStatus(share) === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {getShareStatus(share)}
                          </span>
                        </td>
                        <td className="text-right">
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No shares yet</p>
                <p className="text-sm">
                  Share files with others to get started
                </p>
              </div>
            )}
          </div>
          {/* Section 6: Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            {recentFiles.length > 0 ? (
              <div className="space-y-4">
                {recentFiles.slice(0, 5).map((file, index) => (
                  <div key={file.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Uploaded{" "}
                        <span className="font-medium">{getFileName(file)}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {getUploadDate(file)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">
                  Activity will appear here once you start using the platform
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showActivationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-green-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Your plan is now active</h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Your subscription has been confirmed and your access is now
              active.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleActivationSuccessClose}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
              >
                Great
              </button>
            </div>
          </div>
        </div>
      )}

      <TrialExpiryPopup
        show={showPopup}
        status={subscription?.status}
        trialDaysRemaining={subscription?.trialDaysRemaining}
        trialEndsAt={subscription?.trialEndsAt}
        onDismiss={handlePopupDismiss}
      />
    </>
  );
}
