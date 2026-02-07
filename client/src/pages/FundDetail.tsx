import { useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/Layout";
import { useFund } from "@/hooks/use-funds";
import { useAddPortfolioItem } from "@/hooks/use-portfolios";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  Area
} from "recharts";
import { 
  ArrowUpRight, 
  TrendingUp, 
  ShieldAlert, 
  PieChart, 
  Briefcase,
  User,
  Info
} from "lucide-react";

// Mock history data for chart
const generateHistory = () => {
  const data = [];
  let val = 100;
  for (let i = 0; i < 12; i++) {
    val = val * (1 + (Math.random() * 0.1 - 0.03));
    data.push({ name: `Month ${i+1}`, value: val });
  }
  return data;
};

export default function FundDetail() {
  const [, params] = useRoute("/funds/:id");
  const id = Number(params?.id);
  
  const { data: fund, isLoading } = useFund(id);
  const { mutate: addToPortfolio, isPending: isAdding } = useAddPortfolioItem();
  
  const [amount, setAmount] = useState<string>("5000");
  const [mode, setMode] = useState<"SIP" | "LUMPSUM">("SIP");
  const chartData = generateHistory();

  const handleAdd = () => {
    if (!fund) return;
    
    addToPortfolio({
      portfolioId: 1, // Default ID for MVP
      fundId: fund.id,
      amount: amount,
      mode: mode
    }, {
      onSuccess: () => {
        toast({
          title: "Added to Portfolio",
          description: `${fund.name} has been added successfully.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add fund to portfolio.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) return (
    <Layout>
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-card rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-card rounded-xl" />
            <div className="h-48 bg-card rounded-xl" />
          </div>
          <div className="h-96 bg-card rounded-xl" />
        </div>
      </div>
    </Layout>
  );

  if (!fund) return (
    <Layout>
      <div className="text-center py-20">Fund not found</div>
    </Layout>
  );

  return (
    <Layout>
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance Analysis
                </h3>
                <div className="flex gap-2">
                  {["1M", "6M", "1Y", "3Y", "5Y"].map(p => (
                    <button key={p} className={cn(
                      "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                      p === "1Y" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
                    )}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Key Metrics */}
            <div>
              <h3 className="text-lg font-bold mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="CAGR (3Y)" value={`${fund.return3y}%`} trend="up" tooltip="Compound Annual Growth Rate over 3 years" />
                <MetricCard label="Alpha" value={fund.alpha || "N/A"} subValue={Number(fund.alpha) > 0 ? "Beat Index" : ""} tooltip="Excess returns over benchmark" />
                <MetricCard label="Expense Ratio" value={`${fund.expenseRatio}%`} tooltip="Annual fee charged by the fund" />
                <MetricCard label="Risk" value={fund.riskLevel} icon={<ShieldAlert className="w-4 h-4" />} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900" />
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
               </div>
            </Card>
          </div>

          {/* Right Column: Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
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
                    disabled={isAdding}
                  >
                    {isAdding ? "Adding..." : "Add to Portfolio"}
                  </Button>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Exit Load</span>
                      <span className="font-medium">{fund.exitLoad}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Fund Manager Info */}
              <Card className="mt-6 p-6">
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
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
