import { useState } from "react";
import { Layout } from "@/components/Layout";
import { FundCard } from "@/components/FundCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFunds } from "@/hooks/use-funds";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [risk, setRisk] = useState("All");

  const { data: funds, isLoading } = useFunds({ 
    search: search || undefined, 
    category,
    riskLevel: risk 
  });

  const categories = ["All", "Equity", "Debt", "Hybrid", "Index Funds"];
  const riskLevels = ["All", "Low", "Moderately Low", "Moderate", "Moderately High", "High", "Very High"];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="relative rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-white overflow-hidden shadow-2xl shadow-blue-900/20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay bg-cover bg-center" />
          {/* Unsplash abstract finance background */}
          
          <div className="relative z-10 px-8 py-12 md:py-16 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-medium text-white/90">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Live Market Data
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                Invest in your future with confidence
              </h1>
              <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                Discover top-rated mutual funds, simulate your wealth journey, and get AI-powered insights.
              </p>
              <div className="pt-4 flex gap-3">
                <Button variant="secondary" size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
                  Explore Funds
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white backdrop-blur-sm">
                  View Portfolio
                </Button>
              </div>
            </div>
            
            <div className="hidden md:block w-[300px] h-[300px] rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
               <div className="h-full flex flex-col justify-between">
                 <div className="space-y-2">
                   <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl font-bold">₹</div>
                   <div className="text-sm text-blue-100">Total Investment</div>
                   <div className="text-3xl font-display font-bold">₹12.4L</div>
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-blue-100">Returns</span>
                     <span className="text-accent font-bold">+18.2%</span>
                   </div>
                   <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full w-[75%] bg-accent rounded-full" />
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="sticky top-16 z-20 bg-background/95 backdrop-blur py-4 border-b border-border space-y-4 md:space-y-0 md:flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search funds by name..." 
              className="pl-9 h-11 bg-card border-border shadow-sm focus:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px] h-11 bg-card border-border shadow-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={risk} onValueChange={setRisk}>
              <SelectTrigger className="w-[140px] h-11 bg-card border-border shadow-sm">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                {riskLevels.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 bg-card">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Funds Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display">Top Funds</h2>
            <span className="text-sm text-muted-foreground">{funds?.length || 0} results found</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {funds?.map((fund, idx) => (
                <motion.div
                  key={fund.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <FundCard fund={fund} />
                </motion.div>
              ))}
              
              {funds?.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  <p>No funds found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
