import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useFunds(params?: { search?: string; category?: string; riskLevel?: string }) {
  return useQuery({
    queryKey: [api.funds.list.path, params],
    queryFn: async () => {
      // Build query string manually since buildUrl is for path params mainly
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.category && params.category !== "All") searchParams.append("category", params.category);
      if (params?.riskLevel && params.riskLevel !== "All") searchParams.append("riskLevel", params.riskLevel);

      const url = `${api.funds.list.path}?${searchParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch funds");
      return api.funds.list.responses[200].parse(await res.json());
    },
  });
}

export function useFund(id: number) {
  return useQuery({
    queryKey: [api.funds.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.funds.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch fund details");
      return api.funds.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
