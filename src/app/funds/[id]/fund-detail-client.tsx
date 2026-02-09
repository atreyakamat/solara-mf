"use client";

import { useState, useMemo } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/lib/store";
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
    Legend
} from "recharts";
import {
    ArrowUpRight,
    TrendingUp,
    ShieldAlert,
    Briefcase,
    User,
    Info,
    Calculator,
    BarChart3
} from "lucide-react";
import type { Fund } from "@shared/schema";

interface Props {
    fund: Fund;
}

// Generate realistic NAV history based on fund data
const generateHistory = (fund: Fund, period: string) => {
    const data = [];
    const benchmarkData = [];
    let val = 100;
    let benchmarkVal = 100;

    const periodDays: Record<string, number> = {
        "1M": 30,
        "6M": 180,
        "1Y": 365,
        "3Y": 365 * 3,
        "5Y": 365 * 5,
        "All": 365 * 5
    };

    const days = periodDays[period] || 365;
    const annualReturn = Number(fund.return3y || 12) / 100;
    const dailyReturn = annualReturn / 365;
    const volatility = Number(fund.stdDev || 15) / 100 / Math.sqrt(365);

    // Benchmark slightly lower performance
    const benchmarkDailyReturn = dailyReturn * 0.85;

    for (let i = 0; i <= days; i += Math.max(1, Math.floor(days / 60))) {
        const randomFactor = (Math.random() - 0.5) * volatility * 2;
        val = val * (1 + dailyReturn + randomFactor);
        benchmarkVal = benchmarkVal * (1 + benchmarkDailyReturn + (Math.random() - 0.5) * volatility * 1.5);

        const date = new Date();
        date.setDate(date.getDate() - (days - i));

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: parseFloat(val.toFixed(2)),
            benchmark: parseFloat(benchmarkVal.toFixed(2))
        });
    }
    return data;
};

// Technical ratio explanations
const ratioExplanations: Record<string, string> = {
    alpha: "Measures the fund's excess return over the benchmark. Positive alpha means the fund outperformed.",
    beta: "Measures volatility relative to the market. Beta > 1 means more volatile than market.",
    sharpe: "Risk-adjusted return. Higher is better. Above 1 is good, above 2 is excellent.",
    sortino: "Similar to Sharpe but only penalizes downside volatility. Higher is better.",
    stdDev: "Standard deviation of returns. Higher means more volatile/risky."
};

export function FundDetailClient({ fund }: Props) {
    const [amount, setAmount] = useState<string>("5000");
    const [mode, setMode] = useState<"SIP" | "LUMPSUM">("SIP");
    const [period, setPeriod] = useState("1Y");
    const [showBenchmark, setShowBenchmark] = useState(false);

    const { addItem } = usePortfolioStore();

    const chartData = useMemo(() => generateHistory(fund, period), [fund, period]);

    const handleAdd = () => {
        addItem(fund, Number(amount), mode);
        toast({
            title: "Added to Portfolio",
            description: `${fund.name} has been added to your simulation portfolio.`,
        });
    };

    const periods = ["1M", "6M", "1Y", "3Y", "5Y", "All"];

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header Block */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-primary bg-primary/10 hover:bg-primary/20">{fund.category}</Badge>
                        <Badge variant="outline">{fund.subCategory}</Badge>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
                        {fund.name}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Briefcase className="w-4 h-4" />
                        <span>{fund.amc}</span>
                        <span>•</span>
                        <User className="w-4 h-4" />
                        <span>Manager: {fund.fundManager}</span>
                    </div>
                </div>

                <div className="flex flex-col items-start md:items-end justify-center bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-muted-foreground">Current NAV</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-mono font-bold">₹{fund.nav}</span>
                        <span className={cn(
                            "text-sm font-bold px-2 py-0.5 rounded-full",
                            Number(fund.navChange) >= 0 ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                        )}>
                            {Number(fund.navChange) >= 0 ? "+" : ""}{fund.navChange}%
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">As of today</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Charts & Analysis */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Chart */}
                    <Card className="p-6 border-border shadow-sm">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Performance Analysis
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Time Period Buttons */}
                                {periods.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                            "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                                            p === period
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-secondary text-muted-foreground"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Benchmark Toggle */}
                        <div className="flex items-center gap-2 mb-4">
                            <Switch
                                id="benchmark"
                                checked={showBenchmark}
                                onCheckedChange={setShowBenchmark}
                            />
                            <Label htmlFor="benchmark" className="text-sm text-muted-foreground cursor-pointer">
                                Show Benchmark ({fund.benchmark || "Nifty 50"})
                            </Label>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10 }}
                                        stroke="hsl(var(--muted-foreground))"
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        tick={{ fontSize: 10 }}
                                        stroke="hsl(var(--muted-foreground))"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value.toFixed(0)}`}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    {showBenchmark && (
                                        <Area
                                            type="monotone"
                                            dataKey="benchmark"
                                            stroke="hsl(var(--muted-foreground))"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fillOpacity={1}
                                            fill="url(#colorBenchmark)"
                                            name={fund.benchmark || "Nifty 50"}
                                        />
                                    )}
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        name={fund.name}
                                    />
                                    {showBenchmark && <Legend />}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Key Metrics - Returns */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Returns Performance</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard
                                label="1Y Return"
                                value={`${fund.return1y}%`}
                                trend={Number(fund.return1y) > 0 ? "up" : "down"}
                                tooltip="Returns over the last 1 year"
                            />
                            <MetricCard
                                label="3Y CAGR"
                                value={`${fund.return3y}%`}
                                trend={Number(fund.return3y) > 0 ? "up" : "down"}
                                tooltip="Compound Annual Growth Rate over 3 years"
                            />
                            <MetricCard
                                label="5Y CAGR"
                                value={`${fund.return5y}%`}
                                trend={Number(fund.return5y) > 0 ? "up" : "down"}
                                tooltip="Compound Annual Growth Rate over 5 years"
                            />
                            <MetricCard
                                label="Expense Ratio"
                                value={`${fund.expenseRatio}%`}
                                tooltip="Annual fee charged by the fund (lower is better)"
                            />
                        </div>
                    </div>

                    {/* Technical Ratios - Pro Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Technical Ratios
                            <Badge variant="outline" className="ml-2 text-xs">Pro</Badge>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                        <MetricCard
                                            label="Alpha"
                                            value={fund.alpha || "N/A"}
                                            subValue={Number(fund.alpha) > 0 ? "Beat Index" : Number(fund.alpha) < 0 ? "Lagged" : ""}
                                            icon={<Info className="w-3 h-3" />}
                                            className={Number(fund.alpha) > 0 ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : ""}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>{ratioExplanations.alpha}</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                        <MetricCard
                                            label="Beta"
                                            value={fund.beta || "N/A"}
                                            subValue={Number(fund.beta) > 1 ? "High Vol" : Number(fund.beta) < 1 ? "Low Vol" : ""}
                                            icon={<Info className="w-3 h-3" />}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>{ratioExplanations.beta}</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                        <MetricCard
                                            label="Sharpe Ratio"
                                            value={fund.sharpe || "N/A"}
                                            subValue={Number(fund.sharpe) > 1 ? "Good" : ""}
                                            icon={<Info className="w-3 h-3" />}
                                            className={Number(fund.sharpe) >= 1 ? "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20" : ""}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>{ratioExplanations.sharpe}</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                        <MetricCard
                                            label="Sortino Ratio"
                                            value={fund.sortino || "N/A"}
                                            icon={<Info className="w-3 h-3" />}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>{ratioExplanations.sortino}</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                        <MetricCard
                                            label="Std Deviation"
                                            value={fund.stdDev ? `${fund.stdDev}%` : "N/A"}
                                            icon={<ShieldAlert className="w-3 h-3" />}
                                            className={Number(fund.stdDev) > 15 ? "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20" : ""}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>{ratioExplanations.stdDev}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Fund Info */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4">Fund Details</h3>
                        <div className="grid grid-cols-2 gap-y-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Benchmark</p>
                                <p className="font-medium">{fund.benchmark || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Exit Load</p>
                                <p className="font-medium">{fund.exitLoad}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Min. SIP Investment</p>
                                <p className="font-medium">₹{fund.minSip}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">AUM</p>
                                <p className="font-medium">₹{fund.aum} Cr</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-muted-foreground mb-1">Taxation</p>
                                <p className="font-medium text-sm">
                                    {fund.category === "Equity" || fund.category === "Hybrid"
                                        ? "Equity taxation: STCG @15% (<1yr), LTCG @10% (>₹1L gains)"
                                        : "Debt taxation: As per income tax slab"}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Action Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <Card className="p-6 border-primary/20 shadow-xl shadow-primary/5">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold font-display mb-1">Invest Now</h3>
                                    <p className="text-sm text-muted-foreground">Start your wealth creation journey.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-lg">
                                    <button
                                        onClick={() => setMode("SIP")}
                                        className={cn(
                                            "py-2 text-sm font-medium rounded-md transition-all",
                                            mode === "SIP" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Monthly SIP
                                    </button>
                                    <button
                                        onClick={() => setMode("LUMPSUM")}
                                        className={cn(
                                            "py-2 text-sm font-medium rounded-md transition-all",
                                            mode === "LUMPSUM" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        One-time
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                                        <Input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="pl-8 text-lg font-bold"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Min. investment: ₹{fund.minSip}</p>
                                </div>

                                <Button
                                    className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                                    onClick={handleAdd}
                                >
                                    Add to Portfolio
                                </Button>

                                <div className="pt-4 border-t border-border space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Exit Load</span>
                                        <span className="font-medium">{fund.exitLoad}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Expense Ratio</span>
                                        <span className="font-medium">{fund.expenseRatio}%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Fund Manager Info */}
                        <Card className="p-6">
                            <h4 className="font-bold mb-4">Fund Manager</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{fund.fundManager}</p>
                                    <p className="text-xs text-muted-foreground">Senior Fund Manager</p>
                                </div>
                            </div>
                        </Card>

                        {/* Risk Indicator */}
                        <Card className={cn(
                            "p-6",
                            fund.riskLevel.includes("Very High") ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" :
                                fund.riskLevel.includes("High") ? "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20" :
                                    "border-green-200 bg-green-50/50 dark:bg-green-950/20"
                        )}>
                            <div className="flex items-center gap-3">
                                <ShieldAlert className={cn(
                                    "w-8 h-8",
                                    fund.riskLevel.includes("Very High") ? "text-red-500" :
                                        fund.riskLevel.includes("High") ? "text-orange-500" : "text-green-500"
                                )} />
                                <div>
                                    <p className="font-bold">{fund.riskLevel} Risk</p>
                                    <p className="text-xs text-muted-foreground">
                                        {fund.riskLevel.includes("High")
                                            ? "Suitable for aggressive investors"
                                            : "Suitable for conservative investors"}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
