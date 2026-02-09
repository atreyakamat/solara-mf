import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertPortfolioItem, CreatePortfolioItemRequest } from "@shared/schema";
import { z } from "zod";

const simulationResponseSchema = api.portfolios.simulate.responses[200];
type SimulationResponse = z.infer<typeof simulationResponseSchema>;

// Get Portfolio (Defaulting to ID 1 for MVP)
export function usePortfolio(id: number = 1) {
  return useQuery({
    queryKey: [api.portfolios.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.portfolios.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      return api.portfolios.get.responses[200].parse(await res.json());
    },
  });
}

// Add Item to Portfolio
export function useAddPortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ portfolioId, ...data }: CreatePortfolioItemRequest) => {
      const url = buildUrl(api.portfolios.addItem.path, { id: portfolioId });
      // Validate input using the schema defined in routes/schema - stripping portfolioId as route handles it
      const validated = api.portfolios.addItem.input.parse(data);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) throw new Error("Failed to add item");
      return api.portfolios.addItem.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.portfolios.get.path, variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: [api.portfolios.get.path, 1] }); // Invalidate default
    },
  });
}

// Remove Item
export function useRemovePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ portfolioId, itemId }: { portfolioId: number; itemId: number }) => {
      const url = buildUrl(api.portfolios.removeItem.path, { id: portfolioId, itemId });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.portfolios.get.path, variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: [api.portfolios.get.path, 1] });
    },
  });
}

// Update Item
export function useUpdatePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ portfolioId, itemId, ...updates }: { portfolioId: number; itemId: number } & Partial<InsertPortfolioItem>) => {
      const url = buildUrl(api.portfolios.updateItem.path, { id: portfolioId, itemId });
      const validated = api.portfolios.updateItem.input.parse(updates);
      
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) throw new Error("Failed to update item");
      return api.portfolios.updateItem.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.portfolios.get.path, variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: [api.portfolios.get.path, 1] });
    },
  });
}

// Run Simulation
export function usePortfolioSimulation() {
  return useMutation({
    mutationFn: async ({ portfolioId, years }: { portfolioId: number; years: number }) => {
      const url = buildUrl(api.portfolios.simulate.path, { id: portfolioId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ years }),
      });
      
      if (!res.ok) throw new Error("Simulation failed");
      return api.portfolios.simulate.responses[200].parse(await res.json());
    },
  });
}
