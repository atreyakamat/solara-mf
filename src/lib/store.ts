import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Fund } from '@shared/schema';

export interface PortfolioItem {
    id: number;
    fund: Fund;
    amount: number;
    allocation: number;
    mode: 'SIP' | 'LUMPSUM';
}

export interface SimulationResult {
    projectedValue: number;
    investedAmount: number;
    totalReturns: number;
    cagr: number;
    yearlyData: { year: number; value: number; invested: number }[];
    diversification: {
        sectors: Record<string, number>;
        marketCap: Record<string, number>;
    };
    shortTerm: { m3: string; m6: string };
}

interface PortfolioState {
    items: PortfolioItem[];
    simulationResult: SimulationResult | null;
    isSimulating: boolean;

    // Actions
    addItem: (fund: Fund, amount: number, mode: 'SIP' | 'LUMPSUM') => void;
    removeItem: (id: number) => void;
    updateAllocation: (id: number, allocation: number) => void;
    updateAmount: (id: number, amount: number) => void;
    balanceAllocations: () => void;
    clearPortfolio: () => void;
    setSimulationResult: (result: SimulationResult | null) => void;
    setIsSimulating: (value: boolean) => void;

    // Computed
    getTotalAllocation: () => number;
}

let nextId = 1;

export const usePortfolioStore = create<PortfolioState>()(
    persist(
        (set, get) => ({
            items: [],
            simulationResult: null,
            isSimulating: false,

            addItem: (fund, amount, mode) => {
                const existing = get().items.find(item => item.fund.id === fund.id);
                if (existing) {
                    // Update existing item instead of adding duplicate
                    set(state => ({
                        items: state.items.map(item =>
                            item.fund.id === fund.id
                                ? { ...item, amount: amount, mode: mode }
                                : item
                        ),
                    }));
                } else {
                    set(state => ({
                        items: [
                            ...state.items,
                            {
                                id: nextId++,
                                fund,
                                amount,
                                allocation: 0,
                                mode,
                            },
                        ],
                    }));
                }
            },

            removeItem: (id) => {
                set(state => ({
                    items: state.items.filter(item => item.id !== id),
                    simulationResult: null, // Clear simulation when portfolio changes
                }));
            },

            updateAllocation: (id, allocation) => {
                set(state => ({
                    items: state.items.map(item =>
                        item.id === id ? { ...item, allocation } : item
                    ),
                    simulationResult: null,
                }));
            },

            updateAmount: (id, amount) => {
                set(state => ({
                    items: state.items.map(item =>
                        item.id === id ? { ...item, amount } : item
                    ),
                    simulationResult: null,
                }));
            },

            balanceAllocations: () => {
                const items = get().items;
                if (items.length === 0) return;

                const equalPart = Math.floor(100 / items.length);
                const remainder = 100 - (equalPart * items.length);

                set(state => ({
                    items: state.items.map((item, index) => ({
                        ...item,
                        allocation: equalPart + (index === 0 ? remainder : 0),
                    })),
                    simulationResult: null,
                }));
            },

            clearPortfolio: () => {
                set({ items: [], simulationResult: null });
            },

            setSimulationResult: (result) => {
                set({ simulationResult: result });
            },

            setIsSimulating: (value) => {
                set({ isSimulating: value });
            },

            getTotalAllocation: () => {
                return get().items.reduce((sum, item) => sum + item.allocation, 0);
            },
        }),
        {
            name: 'fundflow-portfolio',
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
);
