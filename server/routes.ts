import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Chat Integration Routes
  registerChatRoutes(app);

  // Seed data
  await storage.seedFunds();

  // === FUNDS API ===
  app.get(api.funds.list.path, async (req, res) => {
    try {
      // Parse query params properly (numbers come as strings)
      const query = {
        search: req.query.search as string,
        category: req.query.category as string,
        riskLevel: req.query.riskLevel as string,
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined
      };
      
      const funds = await storage.getAllFunds(query);
      res.json(funds);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch funds" });
    }
  });

  app.get(api.funds.get.path, async (req, res) => {
    const fund = await storage.getFund(Number(req.params.id));
    if (!fund) {
      return res.status(404).json({ message: 'Fund not found' });
    }
    res.json(fund);
  });

  // === PORTFOLIOS API ===
  // Note: For MVP we can auto-create portfolio ID 1 if it doesn't exist when accessed
  app.get(api.portfolios.get.path, async (req, res) => {
    let portfolio = await storage.getPortfolio(Number(req.params.id));
    if (!portfolio && req.params.id === '1') {
      // Auto-create default portfolio for simulation
      await storage.createPortfolio({ name: "My Simulation Portfolio" });
      portfolio = await storage.getPortfolio(1);
    }
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.json(portfolio);
  });

  app.post(api.portfolios.create.path, async (req, res) => {
    try {
      const input = api.portfolios.create.input.parse(req.body);
      const portfolio = await storage.createPortfolio(input);
      res.status(201).json(portfolio);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      }
    }
  });

  app.post(api.portfolios.addItem.path, async (req, res) => {
    try {
      const input = api.portfolios.addItem.input.parse(req.body);
      const portfolioId = Number(req.params.id);
      
      // Ensure portfolio exists
      const portfolio = await storage.getPortfolio(portfolioId);
      if (!portfolio) {
         // Auto-create if default
         if (portfolioId === 1) {
             await storage.createPortfolio({ name: "My Simulation Portfolio" });
         } else {
             return res.status(404).json({ message: "Portfolio not found" });
         }
      }

      const item = await storage.addPortfolioItem({ ...input, portfolioId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.portfolios.removeItem.path, async (req, res) => {
    const itemId = Number(req.params.itemId);
    await storage.removePortfolioItem(itemId);
    res.status(204).send();
  });

  app.patch(api.portfolios.updateItem.path, async (req, res) => {
    try {
      const input = api.portfolios.updateItem.input.parse(req.body);
      const itemId = Number(req.params.itemId);
      const item = await storage.updatePortfolioItem(itemId, input);
      res.json(item);
    } catch (err) {
       if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(404).json({ message: "Item not found" });
      }
    }
  });

  // Simulation Logic
  app.post(api.portfolios.simulate.path, async (req, res) => {
    try {
      const { years } = req.body;
      const portfolioId = Number(req.params.id);
      const portfolio = await storage.getPortfolio(portfolioId);
      
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Advanced Simulation with Gamified Analytics
      let totalInvested = 0;
      let totalValue = 0;
      const yearlyData = [];
      const diversification = {
        sectors: {} as Record<string, number>,
        marketCap: {} as Record<string, number>
      };

      // 1. Calculate weighted diversification
      let totalAllocation = 0;
      for (const item of portfolio.items) {
        const allocation = Number(item.allocation || 0);
        totalAllocation += allocation;
        
        const holdings = item.fund.holdings as any;
        if (holdings) {
          if (holdings.sectors) {
            Object.entries(holdings.sectors).forEach(([sector, weight]: [string, any]) => {
              diversification.sectors[sector] = (diversification.sectors[sector] || 0) + (weight * allocation / 100);
            });
          }
          if (holdings.marketCap) {
            Object.entries(holdings.marketCap).forEach(([cap, weight]: [string, any]) => {
              diversification.marketCap[cap] = (diversification.marketCap[cap] || 0) + (weight * allocation / 100);
            });
          }
        }
      }

      // 2. Project year by year with historical volatility simulation
      for (let y = 1; y <= years; y++) {
         let currentYearValue = 0;
         let currentYearInvested = 0;

         for (const item of portfolio.items) {
            const allocation = Number(item.allocation || 0);
            if (allocation === 0) continue;

            const fundReturn = Number(item.fund.return3y || 12) / 100; 
            const volatility = Number(item.fund.stdDev || 15) / 100;
            
            // Add some "simulation" noise based on volatility
            const simulatedReturn = fundReturn + (Math.random() - 0.5) * volatility;
            const r = simulatedReturn / 12;
            const months = y * 12;
            const amount = Number(item.amount) * (allocation / 100);

            if (item.mode === 'SIP') {
               const invested = amount * months;
               const futureValue = amount * ( (Math.pow(1 + r, months) - 1) / r ) * (1 + r);
               currentYearValue += futureValue;
               currentYearInvested += invested;
            } else {
               const invested = amount;
               const futureValue = amount * Math.pow(1 + simulatedReturn, y);
               currentYearValue += futureValue;
               currentYearInvested += invested;
            }
         }
         
         yearlyData.push({
            year: y,
            value: Math.round(currentYearValue),
            invested: Math.round(currentYearInvested)
         });
         
         if (y === years) {
             totalValue = Math.round(currentYearValue);
             totalInvested = Math.round(currentYearInvested);
         }
      }

      // 3. Short term returns (3/6 months)
      const shortTerm = { m3: 0, m6: 0 };
      for (const item of portfolio.items) {
        const allocation = Number(item.allocation || 0);
        const fundReturn = Number(item.fund.return1y || 15) / 100;
        shortTerm.m3 += (fundReturn / 4) * allocation / 100;
        shortTerm.m6 += (fundReturn / 2) * allocation / 100;
      }

      const totalReturns = totalValue - totalInvested;
      const cagr = totalInvested > 0 ? (Math.pow(totalValue / totalInvested, 1 / years) - 1) * 100 : 0;

      res.json({
        projectedValue: totalValue,
        investedAmount: totalInvested,
        totalReturns,
        cagr,
        yearlyData,
        diversification,
        shortTerm: {
          m3: (shortTerm.m3 * 100).toFixed(2),
          m6: (shortTerm.m6 * 100).toFixed(2)
        }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Simulation failed" });
    }
  });

  return httpServer;
}
