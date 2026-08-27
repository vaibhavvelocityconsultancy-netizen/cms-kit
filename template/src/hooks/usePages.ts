import { useQuery } from "@tanstack/react-query";
import { fetchers } from "@/src/lib/fetchers";

export type Page = {
  id: number;
  title: string;
  slug: string;
};

async function fetchPages(): Promise<Page[]> {
  const data = await fetchers.pages();
  return data.data ?? [];
}

export function usePages() {
  return useQuery<Page[], Error>({
    queryKey: ["pages"],
    queryFn: fetchPages,
    staleTime: 1000 * 60 * 10,
  });
}
