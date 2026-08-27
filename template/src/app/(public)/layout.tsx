import SiteLayout from "@/src/components/site/SiteLayout";
import { getPublicBootstrapData } from "@/src/app/lib/services/common_urls/public.service";

export default async function PublicRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {  
  const bootstrap = await getPublicBootstrapData();

  return (
    <SiteLayout initialBootstrapData={{ data: bootstrap }}>
      {children}
    </SiteLayout>
  );
}