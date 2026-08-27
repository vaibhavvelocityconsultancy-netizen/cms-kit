export interface AccessData {
  id: number;
  userId: number;
  planId: number;
  billingCycle: string;
  status: string;
  startsAt: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  plan: {
    id: number;
    tenantId: number;
    title: string;
    slug: string;
  };
}