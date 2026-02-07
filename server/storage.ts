import { db } from "./db";
import {
  funds, portfolios, portfolioItems,
  type Fund, type InsertFund,
  type Portfolio, type InsertPortfolio,
  type PortfolioItem, type InsertPortfolioItem,
  type UpdatePortfolioItemRequest,
  type PortfolioWithItems
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Funds
  getAllFunds(params?: { search?: string; category?: string; riskLevel?: string; minRating?: number }): Promise<Fund[]>;
  getFund(id: number): Promise<Fund | undefined>;
  createFund(fund: InsertFund): Promise<Fund>;

  // Portfolios
  getPortfolio(id: number): Promise<PortfolioWithItems | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  
  // Portfolio Items
  addPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  updatePortfolioItem(id: number, updates: UpdatePortfolioItemRequest): Promise<PortfolioItem>;
  removePortfolioItem(id: number): Promise<void>;
  
  // Seeding
  seedFunds(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAllFunds(params?: { search?: string; category?: string; riskLevel?: string; minRating?: number }): Promise<Fund[]> {
    let query = db.select().from(funds);
    const conditions = [];

    if (params?.search) {
      conditions.push(sql`(${funds.name} ILIKE ${`%${params.search}%`} OR ${funds.amc} ILIKE ${`%${params.search}%`})`);
    }
    if (params?.category) {
      conditions.push(eq(funds.category, params.category));
    }
    if (params?.riskLevel) {
      conditions.push(eq(funds.riskLevel, params.riskLevel));
    }
    if (params?.minRating) {
      conditions.push(sql`${funds.rating} >= ${params.minRating}`);
    }

    if (conditions.length > 0) {
      return await query.where(sql.join(conditions, sql` AND `));
    }
    
    return await query;
  }

  async getFund(id: number): Promise<Fund | undefined> {
    const [fund] = await db.select().from(funds).where(eq(funds.id, id));
    return fund;
  }

  async createFund(fund: InsertFund): Promise<Fund> {
    const [newFund] = await db.insert(funds).values(fund).returning();
    return newFund;
  }

  async getPortfolio(id: number): Promise<PortfolioWithItems | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    if (!portfolio) return undefined;

    const items = await db.select({
      id: portfolioItems.id,
      portfolioId: portfolioItems.portfolioId,
      fundId: portfolioItems.fundId,
      amount: portfolioItems.amount,
      mode: portfolioItems.mode,
      allocation: portfolioItems.allocation,
      fund: funds
    })
    .from(portfolioItems)
    .innerJoin(funds, eq(portfolioItems.fundId, funds.id))
    .where(eq(portfolioItems.portfolioId, id));

    return { ...portfolio, items } as PortfolioWithItems;
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    const [newPortfolio] = await db.insert(portfolios).values(portfolio).returning();
    return newPortfolio;
  }

  async addPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const [newItem] = await db.insert(portfolioItems).values(item).returning();
    return newItem;
  }

  async updatePortfolioItem(id: number, updates: UpdatePortfolioItemRequest): Promise<PortfolioItem> {
    const [updatedItem] = await db.update(portfolioItems)
      .set(updates)
      .where(eq(portfolioItems.id, id))
      .returning();
    return updatedItem;
  }

  async removePortfolioItem(id: number): Promise<void> {
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
  }

  async seedFunds(): Promise<void> {
    const existing = await this.getAllFunds();
    if (existing.length > 0) return;

    const generateNavHistory = (baseNav: number, days: number = 365 * 3) => {
      const history = [];
      let currentNav = baseNav;
      const today = new Date();
      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const change = (Math.random() - 0.45) * (baseNav * 0.005); 
        currentNav += change;
        history.push({ date: date.toISOString().split('T')[0], nav: currentNav.toFixed(2) });
      }
      return history;
    };

    const dummyFunds: InsertFund[] = [
      {
        name: "HDFC Top 100 Fund",
        amc: "HDFC Mutual Fund",
        category: "Equity",
        subCategory: "Large Cap",
        riskLevel: "High",
        rating: 5,
        nav: "854.20",
        navChange: "1.25",
        minSip: 500,
        expenseRatio: "1.65",
        exitLoad: "1% if redeemed within 1 year",
        aum: "35000",
        fundManager: "Rahul Baijal",
        return1y: "28.5",
        return3y: "18.2",
        return5y: "15.4",
        alpha: "2.5",
        beta: "0.95",
        sharpe: "1.2",
        sortino: "1.5",
        stdDev: "12.5",
        benchmark: "NIFTY 100 TRI",
        holdings: {
          sectors: { "Financial": 35, "IT": 15, "Energy": 12, "Consumer": 10, "Others": 28 },
          marketCap: { "Large Cap": 85, "Mid Cap": 10, "Small Cap": 5 }
        },
        navHistory: generateNavHistory(800)
      },
      {
        name: "Parag Parikh Flexi Cap Fund",
        amc: "PPFAS Mutual Fund",
        category: "Equity",
        subCategory: "Flexi Cap",
        riskLevel: "Very High",
        rating: 5,
        nav: "76.45",
        navChange: "-0.45",
        minSip: 1000,
        expenseRatio: "0.78",
        exitLoad: "2% if redeemed within 1 year",
        aum: "68000",
        fundManager: "Rajeev Thakkar",
        return1y: "32.1",
        return3y: "22.5",
        return5y: "20.1",
        alpha: "4.2",
        beta: "0.85",
        sharpe: "1.8",
        sortino: "2.1",
        stdDev: "11.2",
        benchmark: "NIFTY 500 TRI",
        holdings: {
          sectors: { "IT": 25, "Financial": 20, "Consumer": 15, "Auto": 10, "Others": 30 },
          marketCap: { "Large Cap": 65, "Mid Cap": 25, "Small Cap": 10 }
        },
        navHistory: generateNavHistory(70)
      },
      {
        name: "SBI Small Cap Fund",
        amc: "SBI Mutual Fund",
        category: "Equity",
        subCategory: "Small Cap",
        riskLevel: "Very High",
        rating: 4,
        nav: "165.30",
        navChange: "0.80",
        minSip: 500,
        expenseRatio: "1.75",
        exitLoad: "1% if redeemed within 1 year",
        aum: "28000",
        fundManager: "R. Srinivasan",
        return1y: "45.2",
        return3y: "28.5",
        return5y: "24.8",
        alpha: "5.8",
        beta: "0.88",
        sharpe: "1.5",
        sortino: "1.9",
        stdDev: "16.5",
        benchmark: "NIFTY Smallcap 250 TRI",
        holdings: {
          sectors: { "Capital Goods": 20, "Chemicals": 18, "Consumer": 15, "Financial": 10, "Others": 37 },
          marketCap: { "Large Cap": 5, "Mid Cap": 25, "Small Cap": 70 }
        },
        navHistory: generateNavHistory(150)
      },
      {
        name: "ICICI Prudential Bluechip Fund",
        amc: "ICICI Prudential",
        category: "Equity",
        subCategory: "Large Cap",
        riskLevel: "High",
        rating: 4,
        nav: "98.50",
        navChange: "0.55",
        minSip: 100,
        expenseRatio: "1.55",
        exitLoad: "1% if redeemed within 1 year",
        aum: "55000",
        fundManager: "Anish Tawakley",
        return1y: "24.5",
        return3y: "16.8",
        return5y: "14.2",
        alpha: "1.5",
        beta: "0.98",
        sharpe: "1.1",
        sortino: "1.3",
        stdDev: "13.2",
        benchmark: "NIFTY 100 TRI",
        holdings: {
          sectors: { "Financial": 40, "IT": 12, "Energy": 10, "Consumer": 8, "Others": 30 },
          marketCap: { "Large Cap": 90, "Mid Cap": 8, "Small Cap": 2 }
        },
        navHistory: generateNavHistory(90)
      },
      {
        name: "Axis Midcap Fund",
        amc: "Axis Mutual Fund",
        category: "Equity",
        subCategory: "Mid Cap",
        riskLevel: "Very High",
        rating: 3,
        nav: "88.20",
        navChange: "-1.10",
        minSip: 500,
        expenseRatio: "1.85",
        exitLoad: "1% if redeemed within 1 year",
        aum: "22000",
        fundManager: "Shreyash Devalkar",
        return1y: "35.5",
        return3y: "21.2",
        return5y: "18.4",
        alpha: "3.1",
        beta: "0.92",
        sharpe: "1.3",
        sortino: "1.6",
        stdDev: "15.1",
        benchmark: "NIFTY Midcap 150 TRI",
        holdings: {
          sectors: { "IT": 18, "Financial": 15, "Consumer": 12, "Auto": 10, "Others": 45 },
          marketCap: { "Large Cap": 15, "Mid Cap": 75, "Small Cap": 10 }
        },
        navHistory: generateNavHistory(80)
      },
      {
        name: "Kotak Debt Hybrid Fund",
        amc: "Kotak Mahindra",
        category: "Hybrid",
        subCategory: "Conservative Hybrid",
        riskLevel: "Medium",
        rating: 4,
        nav: "45.60",
        navChange: "0.15",
        minSip: 1000,
        expenseRatio: "1.25",
        exitLoad: "Nil",
        aum: "12000",
        fundManager: "Abhishek Bisen",
        return1y: "12.5",
        return3y: "9.8",
        return5y: "9.2",
        alpha: "1.1",
        beta: "0.65",
        sharpe: "1.8",
        sortino: "2.5",
        stdDev: "5.5",
        benchmark: "CRISIL Hybrid 85+15 75:25 Index",
        holdings: {
          sectors: { "Government Bonds": 50, "Financial": 20, "Corporate Debt": 15, "Equity": 15 },
          marketCap: { "Large Cap": 10, "Mid Cap": 3, "Small Cap": 2, "Debt": 85 }
        },
        navHistory: generateNavHistory(40)
      }
    ];

    await db.insert(funds).values(dummyFunds);
    console.log("Seeded database with dummy funds and history");
  }
}

export const storage = new DatabaseStorage();
