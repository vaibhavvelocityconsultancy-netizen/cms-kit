// src/lib/ecom/useEcomSettings.ts
"use client";

import useSWR from "swr";
import { fetchers } from "@/src/lib/fetchers";

/**
 * Shared hook for reading e-commerce settings on the client (currency,
 * order prefix, feature flags, etc). Cached via SWR so multiple screens
 * on the same page reuse a single request.
 */
export interface EcomSettings {
  id?: number;
  currency: string;
  weightUnit: string;
  dimensionUnit: string;
  storeAddress: Record<string, any> | null;
  guestCheckoutEnabled: boolean;
  termsRequired: boolean;
  orderNumberPrefix: string;
  codEnabled: boolean;
  razorpayEnabled: boolean;
  razorpayKeyId: string | null;
  razorpayKeySecret: string | null;
}

const defaults: EcomSettings = {
  currency: "INR",
  weightUnit: "kg",
  dimensionUnit: "cm",
  storeAddress: null,
  guestCheckoutEnabled: true,
  termsRequired: false,
  orderNumberPrefix: "ORD-",
  codEnabled: true,
  razorpayEnabled: true,
  razorpayKeyId: null,
  razorpayKeySecret: null,
};

export function useEcomSettings() {
  const { data, isLoading, mutate, error } = useSWR(
    "ecommerce-settings",
    () => fetchers.ecomSettings(),
    { revalidateOnFocus: false },
  );

  const settings: EcomSettings = { ...defaults, ...(data?.data ?? {}) };
  return { settings, isLoading, error, mutate };
}
