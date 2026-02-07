import { z } from 'zod';
import { insertFundSchema, insertPortfolioSchema, insertPortfolioItemSchema, funds, portfolios, portfolioItems, type SimulationResponse } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  funds: {
    list: {
      method: 'GET' as const,
      path: '/api/funds' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        riskLevel: z.string().optional(),
        minRating: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof funds.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/funds/:id' as const,
      responses: {
        200: z.custom<typeof funds.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  portfolios: {
    get: {
      method: 'GET' as const,
      path: '/api/portfolios/:id' as const,
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/portfolios' as const,
      input: insertPortfolioSchema,
      responses: {
        201: z.custom<typeof portfolios.$inferSelect>(),
      },
    },
    addItem: {
      method: 'POST' as const,
      path: '/api/portfolios/:id/items' as const,
      input: insertPortfolioItemSchema.omit({ portfolioId: true }),
      responses: {
        201: z.custom<typeof portfolioItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    removeItem: {
      method: 'DELETE' as const,
      path: '/api/portfolios/:id/items/:itemId' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    updateItem: {
      method: 'PATCH' as const,
      path: '/api/portfolios/:id/items/:itemId' as const,
      input: insertPortfolioItemSchema.partial(),
      responses: {
        200: z.custom<typeof portfolioItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    simulate: {
      method: 'POST' as const,
      path: '/api/portfolios/:id/simulate' as const,
      input: z.object({
        years: z.number().min(1).max(30),
      }),
      responses: {
        200: z.custom<SimulationResponse>(),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
