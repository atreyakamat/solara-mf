import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { usePortfolio, useRemovePortfolioItem, usePortfolioSimulation, useUpdatePortfolioItem } from "@/hooks/use-portfolios";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, PieChart as PieChartIcon, RefreshCw, AlertCircle, Award, Zap, Info } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Simulator() {
  const { data: portfolio, isLoading } = usePortfolio(1);
  const { mutate: removeItem } = useRemovePortfolioItem();
  const { mutate: updateItem } = useUpdatePortfolioItem();
  const { mutate: simulate, data: simulationResult, isPending: isSimulating } = usePortfolioSimulation();
  const { toast } = useToast();
  
  const [years, setYears] = useState([10]);
  const [allocationSum, setAllocationSum] = useState(0);

  useEffect(() => {
    if (portfolio?.items) {
      const sum = portfolio.items.reduce((acc: number, item: any) => acc + Number(item.allocation || 0), 0);
      setAllocationSum(sum);
    }
  }, [portfolio]);

  const handleSimulate = () => {
    if (allocationSum !== 100 && portfolio?.items.length > 0) {
      toast({
        title: "Invalid Allocation",
        description: "Total allocation must be exactly 100%.",
        variant: "destructive"
      });
      return;
    }
    simulate({ portfolioId: 1, years: years[0] });
  };

  const handleAllocationChange = (itemId: number, value: number[]) => {
    updateItem({ portfolioId: 1, itemId, updates: { allocation: value[0] } });
  };

  const balanceAllocation = () => {
    if (!portfolio?.items || portfolio.items.length === 0) return;
    const equalPart = Math.floor(100 / portfolio.items.length);
    portfolio.items.forEach((item: any) => {
      updateItem({ portfolioId: 1, itemId: item.id, updates: { allocation: equalPart } });
    });
  };

  if (isLoading) return <Layout><div className="p-10 text-center">Loading Gamified Simulator...</div></Layout>;
  if (!portfolio) return <Layout><div className="p-10 text-center">Portfolio not found</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-card p-6 rounded-2xl border shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-display font-black tracking-tight">Level Up Your Wealth</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 animate-pulse">Alpha Phase</Badge>
            </div>
            <p className="text-muted-foreground text-lg">Mix your funds, slide the risk, and see your future self's bank balance.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-secondary/20 p-4 rounded-xl border border-dashed">
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Portfolio Score</p>
              <p className="text-3xl font-black text-primary">{allocationSum === 100 ? "98/100" : "??/100"}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Award className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 overflow-visible">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <PieChartIcon className="w-6 h-6 text-primary" />
                  Fund Lab
                </h3>
                <Button variant="outline" size="sm" onClick={balanceAllocation} className="hover-elevate">
                  Auto-Balance
                </Button>
              </div>

              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {portfolio.items.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <p className="text-muted-foreground">Your lab is empty. Add some explosive funds from the Explorer!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {portfolio.items.map((item: any, idx: number) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative p-4 rounded-xl border border-border bg-gradient-to-r from-background to-secondary/10 group hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="min-w-0 mr-4">
                            <h4 className="font-bold text-sm truncate">{item.fund.name}</h4>
                            <p className="text-xs text-muted-foreground">{item.fund.subCategory} • {item.fund.riskLevel} Risk</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem({ portfolioId: 1, itemId: item.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span>ALLOCATION</span>
                            <span className={item.allocation > 0 ? "text-primary" : "text-muted-foreground"}>{item.allocation}%</span>
                          </div>
                          <Slider
                            value={[item.allocation || 0]}
                            max={100}
                            step={1}
                            onValueChange={(val) => handleAllocationChange(item.id, val)}
                            className="py-2"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold">TOTAL ALLOCATION</span>
                  <span className={`text-2xl font-black ${allocationSum === 100 ? "text-green-500" : "text-orange-500"}`}>
                    {allocationSum}%
                  </span>
                </div>
                <Progress value={allocationSum} className={`h-3 ${allocationSum > 100 ? "bg-red-200" : ""}`} />
                {allocationSum !== 100 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Must be exactly 100% to simulate.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-primary/5 border-primary/20">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Time Travel Controls
              </h4>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-black text-primary">{years[0]} <span className="text-sm font-normal text-muted-foreground">Years</span></span>
              </div>
              <Slider
                value={years}
                max={30}
                min={1}
                step={1}
                onValueChange={setYears}
                className="mb-6"
              />
              <Button 
                onClick={handleSimulate} 
                disabled={isSimulating || allocationSum !== 100} 
                className="w-full h-12 font-black text-lg shadow-xl shadow-primary/30 active-elevate-2 group"
              >
                {isSimulating ? (
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Zap className="w-5 h-5 mr-2 fill-current group-hover:scale-125 transition-transform" />
                )}
                RUN SIMULATION
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {simulationResult ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Final Wealth", value: `₹${(simulationResult.projectedValue / 100000).toFixed(2)}L`, sub: "Projected", color: "text-primary" },
                    { label: "Net Gain", value: `₹${(simulationResult.totalReturns / 100000).toFixed(2)}L`, sub: `+${((simulationResult.totalReturns / (simulationResult.investedAmount || 1)) * 100).toFixed(1)}%`, color: "text-green-500" },
                    { label: "CAGR", value: `${simulationResult.cagr.toFixed(2)}%`, sub: "Annualized", color: "text-orange-500" },
                    { label: "6M Returns", value: `${simulationResult.shortTerm.m6}%`, sub: "Short term", color: "text-accent" },
                  ].map((stat, i) => (
                    <Card key={i} className="p-4 hover-elevate cursor-default overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                        <TrendingUp className="w-12 h-12" />
                      </div>
                      <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">{stat.sub}</p>
                    </Card>
                  ))}
                </div>

                <Card className="p-6 h-[450px] relative">
                   <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl">Wealth Trajectory</h3>
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1"><div className="w-3 h-1 bg-primary rounded" /> Wealth</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-1 bg-muted border-t border-dashed" /> Invested</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={simulationResult.yearlyData}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `₹${value/100000}L`} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`₹${(value).toLocaleString()}`, ""]}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" animationDuration={2000} />
                      <Area type="monotone" dataKey="invested" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-primary" />
                      Sector Exposure
                    </h4>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(simulationResult.diversification.sectors).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={8}
                            dataKey="value"
                          >
                            {Object.entries(simulationResult.diversification.sectors).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Strategy Badges
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center space-y-1">
                        <Award className="w-6 h-6 mx-auto text-green-500" />
                        <p className="text-[10px] font-black uppercase">Diversified</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1">
                        <TrendingUp className="w-6 h-6 mx-auto text-blue-500" />
                        <p className="text-[10px] font-black uppercase">Aggressive</p>
                      </div>
                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center opacity-40 grayscale space-y-1">
                        <Zap className="w-6 h-6 mx-auto" />
                        <p className="text-[10px] font-black uppercase">Risk Master</p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center opacity-40 grayscale space-y-1">
                        <Info className="w-6 h-6 mx-auto" />
                        <p className="text-[10px] font-black uppercase">HODL King</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[600px] flex items-center justify-center border-2 border-dashed border-border rounded-3xl bg-secondary/5 group">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                    <TrendingUp className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black">Simulation Engine Ready</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">Configure your fund mix on the left and hit the "Run Simulation" button to generate your wealth projection.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
