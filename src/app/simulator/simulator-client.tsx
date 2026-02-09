"use client";

import { useState, useMemo } from "react";
import { usePortfolioStore, type SimulationResult } from "@/lib/store";
import { useFunds } from "@/hooks/use-funds";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import {
    Plus,
    Trash2,
    Calculator,
    TrendingUp,
    AlertTriangle,
    Search,
    X,
    Wallet,
    PieChartIcon,
    BarChart3
} from "lucide-react";
import type { Fund } from "@shared/schema";

// Mock market cap distribution (in real scenario, comes from fund data)
const getMarketCapData = (funds: Fund[]) => {
    const caps: Record<string, number> = { "Large Cap": 0, "Mid Cap": 0, "Small Cap": 0 };
    funds.forEach((fund) => {
        if (fund.subCategory?.includes("Large")) caps["Large Cap"] += 1;
        else if (fund.subCategory?.includes("Mid")) caps["Mid Cap"] += 1;
        else if (fund.subCategory?.includes("Small")) caps["Small Cap"] += 1;
        else caps["Large Cap"] += 0.5;
    });
    return Object.entries(caps).map(([name, value]) => ({ name, value: Math.round((value / (funds.length || 1)) * 100) }));
};

// Sector distribution (mock)
const getSectorData = (funds: Fund[]) => {
    const sectors: Record<string, number> = {
        "IT": 25, "Banking": 20, "Pharma": 15, "Auto": 12, "FMCG": 10, "Others": 18
    };
    return Object.entries(sectors).map(([name, value]) => ({ name, value }));
};

// Colors for charts
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1"];
const MARKET_CAP_COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

// Custom Legend
const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.value}</span>
            </div>
        ))}
    </div>
);

// Fund Search for adding funds
function FundSearch({ onAdd, onClose }: { onAdd: (fund: Fund) => void; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const { data: funds, isLoading } = useFunds({ search: query || undefined });

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 animate-in fade-in">
            <Card className="w-full max-w-lg p-6 shadow-2xl m-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Add Fund to Portfolio</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by fund name..."
                        className="pl-9"
                        autoFocus
                    />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">Searching...</div>
                    ) : funds?.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">No funds found</div>
                    ) : (
                        funds?.map((fund) => (
                            <button
                                key={fund.id}
                                onClick={() => { onAdd(fund); onClose(); }}
                                className="w-full p-3 rounded-lg border border-border hover:bg-secondary transition-colors text-left"
                            >
                                <div className="font-medium text-sm">{fund.name}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span>{fund.category}</span>
                                    <span>•</span>
                                    <span className="text-accent">{fund.return1y}% 1Y</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}

export function SimulatorClient() {
    const [years, setYears] = useState<number[]>([10]);
    const [showSearch, setShowSearch] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    const {
        items,
        addItem,
        removeItem,
        updateAllocation,
        balanceAllocations,
        clearPortfolio,
        simulationResult,
        setSimulationResult
    } = usePortfolioStore();

    const totalAllocation = items.reduce((sum, item) => sum + item.allocation, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const hasConcentrationRisk = items.some(item => item.allocation > 40);

    const marketCapData = useMemo(() => getMarketCapData(items.map(i => i.fund)), [items]);
    const sectorData = useMemo(() => getSectorData(items.map(i => i.fund)), [items]);

    const handleAddFund = (fund: Fund) => {
        addItem(fund, 5000, "SIP");
        balanceAllocations();
        toast({ title: "Fund Added", description: `${fund.name} added to your portfolio.` });
    };

    const runSimulation = async () => {
        if (totalAllocation !== 100) {
            toast({ title: "Error", description: "Total allocation must be 100%", variant: "destructive" });
            return;
        }

        setIsSimulating(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Calculate blended return based on allocations
        const blendedReturn = items.reduce((sum, item) => {
            return sum + (Number(item.fund.return3y || 12) * item.allocation / 100);
        }, 0);

        const monthlyAmount = totalAmount;
        const yearlyData = [];
        let invested = 0;
        let value = 0;
        const monthlyReturn = blendedReturn / 100 / 12;

        for (let year = 0; year <= years[0]; year++) {
            if (year > 0) {
                for (let month = 0; month < 12; month++) {
                    value = value * (1 + monthlyReturn) + monthlyAmount;
                    invested += monthlyAmount;
                }
            }
            yearlyData.push({
                year,
                value: Math.round(value),
                invested: Math.round(invested)
            });
        }

        const result: SimulationResult = {
            projectedValue: yearlyData[yearlyData.length - 1].value,
            investedAmount: yearlyData[yearlyData.length - 1].invested,
            totalReturns: yearlyData[yearlyData.length - 1].value - yearlyData[yearlyData.length - 1].invested,
            cagr: blendedReturn,
            yearlyData,
            diversification: {
                sectors: sectorData.reduce((acc, s) => ({ ...acc, [s.name]: s.value }), {}),
                marketCap: marketCapData.reduce((acc, m) => ({ ...acc, [m.name]: m.value }), {})
            },
            shortTerm: {
                m3: `₹${(totalAmount * 3).toLocaleString('en-IN')}`,
                m6: `₹${(totalAmount * 6).toLocaleString('en-IN')}`
            }
        };

        setSimulationResult(result);
        setIsSimulating(false);
        toast({ title: "Simulation Complete", description: "Your portfolio analysis is ready!" });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {showSearch && <FundSearch onAdd={handleAddFund} onClose={() => setShowSearch(false)} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold">Portfolio Simulator</h1>
                    <p className="text-muted-foreground mt-1">Build and simulate your dream portfolio</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowSearch(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Fund
                    </Button>
                    {items.length > 0 && (
                        <Button variant="outline" onClick={clearPortfolio} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Concentration Risk Warning */}
            {hasConcentrationRisk && (
                <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="font-medium text-orange-800 dark:text-orange-200">Concentration Risk Detected</p>
                            <p className="text-sm text-orange-600 dark:text-orange-300">One or more funds have over 40% allocation. Consider diversifying.</p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Portfolio Builder */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Fund List */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-primary" />
                                Your Funds
                            </h3>
                            {items.length > 1 && (
                                <Button variant="secondary" size="sm" onClick={balanceAllocations}>
                                    Auto-balance
                                </Button>
                            )}
                        </div>

                        {items.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Plus className="w-8 h-8 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-2">No funds in portfolio</h4>
                                <p className="text-sm text-muted-foreground mb-4">Start by adding funds to simulate your investment journey.</p>
                                <Button onClick={() => setShowSearch(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Fund
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="p-4 rounded-xl bg-secondary/50 border border-border">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">{item.fund.name}</h4>
                                                <p className="text-xs text-muted-foreground">{item.fund.category} • {item.fund.return1y}% 1Y</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">Allocation</span>
                                                    <span className={cn(
                                                        "font-bold",
                                                        item.allocation > 40 ? "text-orange-500" : "text-foreground"
                                                    )}>
                                                        {item.allocation}%
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[item.allocation]}
                                                    max={100}
                                                    step={5}
                                                    onValueChange={([val]) => updateAllocation(item.id, val)}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <div className="text-xs text-muted-foreground mb-1">Monthly</div>
                                                <div className="font-medium">₹{item.amount.toLocaleString('en-IN')}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Allocation Summary */}
                                <div className={cn(
                                    "p-4 rounded-xl border",
                                    totalAllocation === 100
                                        ? "bg-green-50 dark:bg-green-950/20 border-green-200"
                                        : "bg-orange-50 dark:bg-orange-950/20 border-orange-200"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Total Allocation</span>
                                        <span className={cn(
                                            "text-xl font-bold",
                                            totalAllocation === 100 ? "text-green-600" : "text-orange-600"
                                        )}>
                                            {totalAllocation}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Investment Parameters */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-primary" />
                            Investment Horizon
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Duration</span>
                                <span className="font-bold text-xl">{years[0]} years</span>
                            </div>
                            <Slider
                                value={years}
                                min={1}
                                max={30}
                                step={1}
                                onValueChange={setYears}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>1 year</span>
                                <span>30 years</span>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-6 h-12 text-lg font-semibold shadow-lg shadow-primary/25"
                            onClick={runSimulation}
                            disabled={items.length === 0 || totalAllocation !== 100 || isSimulating}
                        >
                            {isSimulating ? "Simulating..." : "Run Simulation"}
                        </Button>
                    </Card>

                    {/* Simulation Results */}
                    {simulationResult && (
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Projected Growth
                            </h3>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-primary/10">
                                    <p className="text-xs text-muted-foreground mb-1">Projected Value</p>
                                    <p className="text-2xl font-bold text-primary">₹{simulationResult.projectedValue.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-secondary">
                                    <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                                    <p className="text-2xl font-bold">₹{simulationResult.investedAmount.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-accent/10">
                                    <p className="text-xs text-muted-foreground mb-1">Returns</p>
                                    <p className="text-2xl font-bold text-accent">₹{simulationResult.totalReturns.toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={simulationResult.yearlyData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="year"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(val) => `Y${val}`}
                                            stroke="hsl(var(--muted-foreground))"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                                            stroke="hsl(var(--muted-foreground))"
                                        />
                                        <RechartsTooltip
                                            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="invested"
                                            stroke="hsl(var(--muted-foreground))"
                                            strokeDasharray="5 5"
                                            fillOpacity={1}
                                            fill="url(#colorInvested)"
                                            name="Invested"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            name="Value"
                                        />
                                        <Legend />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Sidebar - Diversification Analysis */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4">Portfolio Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Funds</span>
                                <span className="font-bold">{items.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Monthly SIP</span>
                                <span className="font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Expected CAGR</span>
                                <span className="font-bold text-accent">
                                    {items.length > 0
                                        ? (items.reduce((sum, i) => sum + Number(i.fund.return3y || 12) * i.allocation, 0) / 100).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Market Cap Diversification */}
                    {items.length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-primary" />
                                Market Cap Mix
                            </h3>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={marketCapData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {marketCapData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={MARKET_CAP_COLORS[index % MARKET_CAP_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend content={<CustomLegend />} />
                                        <RechartsTooltip formatter={(value: number) => [`${value}%`, '']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}

                    {/* Sector Diversification */}
                    {items.length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" />
                                Sector Allocation
                            </h3>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sectorData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {sectorData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend content={<CustomLegend />} />
                                        <RechartsTooltip formatter={(value: number) => [`${value}%`, '']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
