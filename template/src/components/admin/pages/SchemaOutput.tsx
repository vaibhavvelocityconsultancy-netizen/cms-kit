export function SchemaRenderer({ seoData }: { seoData: any }) {
  const enabledSchemas =
    seoData?.schemas?.filter((s: any) => s.enabled) || [];

  if (enabledSchemas.length === 0) return null;

  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": enabledSchemas.map((s: any) => s.json),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaJson),
      }}
    />
  );
}