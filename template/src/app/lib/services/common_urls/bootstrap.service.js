import { getPublicBootstrapData } from "./public.service";

export async function getBootstrapData(tenantId) {
  return getPublicBootstrapData(tenantId);
}
