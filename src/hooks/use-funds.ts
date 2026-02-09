"use client";

import { useQuery } from "@tanstack/react-query";
import type { Fund } from "@shared/schema";

interface FundFilters {
  search?: string;
  category?: string;
  riskLevel?: string;
  minRating?: number;
}

export function useFunds(filters: FundFilters = {}) {
  return useQuery<Fund[]>({
    queryKey: ["funds", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category && filters.category !== "All") params.set("category", filters.category);
      if (filters.riskLevel && filters.riskLevel !== "All") params.set("riskLevel", filters.riskLevel);
      if (filters.minRating) params.set("minRating", filters.minRating.toString());

      const res = await fetch(`/api/funds?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch funds");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useFund(id: number) {
  return useQuery<Fund>({
    queryKey: ["fund", id],
    queryFn: async () => {
      const res = await fetch(`/api/funds/${id}`);
      if (!res.ok) throw new Error("Failed to fetch fund");
      return res.json();
    },
    enabled: !!id,
  });
}
