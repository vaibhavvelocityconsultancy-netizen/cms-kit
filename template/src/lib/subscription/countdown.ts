/**
 * ═════════════════════════════════════════════════════════════════════
 * SUBSCRIPTION COUNTDOWN UTILITIES
 * ═════════════════════════════════════════════════════════════════════
 *
 * Converts subscription dates into human-readable countdown formats
 * for dashboard widgets and trial expiry banners.
 *
 * Returns:
 * - Days remaining
 * - Hours remaining
 * - Minutes remaining (for trials <24hrs)
 * - Formatted strings for display
 */

/**
 * Calculate remaining time until a target date
 * @param targetDate - The date subscription expires (trialEndsAt or currentPeriodEnd)
 * @returns Object with days, hours, minutes, and formatted strings
 */
export function calculateTimeRemaining(targetDate: Date) {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  // If already expired
  if (diffMs <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      shortFormat: "Expired",
      longFormat: "Your access has ended",
    };
  }

  // Convert milliseconds to time units
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  // Short format: "23 Days 12 Hours"
  let shortFormat = "";
  if (days > 0) {
    shortFormat = `${days} Day${days === 1 ? "" : "s"}`;
    if (hours > 0) {
      shortFormat += ` ${hours} Hour${hours === 1 ? "" : "s"}`;
    }
  } else {
    shortFormat = `${hours} Hour${hours === 1 ? "" : "s"}`;
    if (minutes > 0) {
      shortFormat += ` ${minutes} Min${minutes === 1 ? "" : "s"}`;
    }
  }

  // Long format: "Expires in 29 Days and 12 Hours"
  const parts = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);

  const longFormat = parts.length > 0 
    ? `Expires in ${parts.join(" and ")}`
    : "Expires very soon";

  return {
    expired: false,
    days,
    hours,
    minutes,
    shortFormat,
    longFormat,
    percentageRemaining: Math.round((totalHours / (30 * 24)) * 100), // Assume 30-day subscription
  };
}

/**
 * Format a subscription date as readable string
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatSubscriptionDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Get subscription status display text and color
 */
export function getSubscriptionStatusDisplay(status: string) {
  const statusMap = {
    TRIAL: {
      label: "Free Trial",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    ACTIVE: {
      label: "Active",
      color: "text-green-600",
      bgColor: "bg-green-50",
      badgeColor: "bg-green-100 text-green-700",
    },
    EXPIRED: {
      label: "Expired",
      color: "text-red-600",
      bgColor: "bg-red-50",
      badgeColor: "bg-red-100 text-red-700",
    },
    CANCELED: {
      label: "Canceled",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      badgeColor: "bg-gray-100 text-gray-700",
    },
  };

  return statusMap[status] || statusMap.EXPIRED;
}
