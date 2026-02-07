import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/chat";

// === FUNDS TABLE ===
export const funds = pgTable("funds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amc: text("amc").notNull(),
  category: text("category").notNull(), // Equity, Debt, Hybrid, etc.
  subCategory: text("sub_category").notNull(), // Large Cap, Mid Cap, etc.
  riskLevel: text("risk_level").notNull(), // Low, Medium, High, Very High
  rating: integer("rating").notNull(), // 1-5
  nav: numeric("nav").notNull(),
  navChange: numeric("nav_change").notNull(), // Daily % change
  minSip: integer("min_sip").notNull(),
  expenseRatio: numeric("expense_ratio").notNull(),
  exitLoad: text("exit_load").notNull(),
  aum: numeric("aum").notNull(), // In Crores
  fundManager: text("fund_manager").notNull(),
  return1y: numeric("return_1y").notNull(),
  return3y: numeric("return_3y").notNull(),
  return5y: numeric("return_5y").notNull(),
  alpha: numeric("alpha"),
  beta: numeric("beta"),
  sharpe: numeric("sharpe"),
  sortino: numeric("sortino"),
  stdDev: numeric("std_dev"),
  benchmark: text("benchmark"),
  holdings: jsonb("holdings"), // Sector/Market cap weights
  navHistory: jsonb("nav_history"), // [{date: '2025-01-01', nav: 100}, ...]
});

// === PORTFOLIOS TABLE ===
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("My Portfolio"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PORTFOLIO ITEMS TABLE ===
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  fundId: integer("fund_id").notNull(),
  amount: numeric("amount").notNull(),
  allocation: integer("allocation").default(0), // Percentage (0-100)
  mode: text("mode").notNull(), // 'SIP' or 'LUMPSUM'
});

// === RELATIONS ===
export const fundsRelations = relations(funds, ({ many }) => ({
  portfolioItems: many(portfolioItems),
}));

export const portfoliosRelations = relations(portfolios, ({ many }) => ({
  items: many(portfolioItems),
}));

export const portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [portfolioItems.portfolioId],
    references: [portfolios.id],
  }),
  fund: one(funds, {
    fields: [portfolioItems.fundId],
    references: [funds.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertFundSchema = createInsertSchema(funds).omit({ id: true });
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true, createdAt: true });
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Fund = typeof funds.$inferSelect;
export type InsertFund = z.infer<typeof insertFundSchema>;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;

export type CreatePortfolioItemRequest = InsertPortfolioItem;
export type UpdatePortfolioItemRequest = Partial<InsertPortfolioItem>;

export interface PortfolioWithItems extends Portfolio {
  items: (PortfolioItem & { fund: Fund })[];
}

export interface SimulationResponse {
  projectedValue: number;
  investedAmount: number;
  totalReturns: number;
  cagr: number;
  yearlyData: {
    year: number;
    value: number;
    invested: number;
  }[];
  diversification: {
    sectors: Record<string, number>;
    marketCap: Record<string, number>;
  };
  shortTerm: {
    m3: string;
    m6: string;
  };
}
