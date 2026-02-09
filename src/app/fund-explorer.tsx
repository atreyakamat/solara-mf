"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { FundCard } from "@/components/FundCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFunds } from "@/hooks/use-funds";
import { Search, SlidersHorizontal, TrendingUp, Star, ChevronLeft, ChevronRight, Wallet, Shield, BarChart3, Coins, Building2, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import useEmblaCarousel from 'embla-carousel-react';
import type { Fund } from "@shared/schema";

// Category definitions with icons
const categories = [
    { id: "Equity", label: "Equity", icon: TrendingUp, color: "from-blue-500 to-blue-600", description: "Large, Mid, Small Cap" },
    { id: "Debt", label: "Debt", icon: Shield, color: "from-green-500 to-green-600", description: "Low risk, stable returns" },
    { id: "Hybrid", label: "Hybrid", icon: BarChart3, color: "from-purple-500 to-purple-600", description: "Balanced allocation" },
    { id: "Index Funds", label: "Index Funds", icon: Landmark, color: "from-orange-500 to-orange-600", description: "Track market indices" },
    { id: "ELSS", label: "ELSS", icon: Wallet, color: "from-pink-500 to-pink-600", description: "Tax saving funds" },
    { id: "Gold", label: "Gold/Commodities", icon: Coins, color: "from-yellow-500 to-yellow-600", description: "Precious metals" },
];

// Carousel component for funds
function FundCarousel({ title, funds, icon: Icon }: { title: string; funds: Fund[]; icon: React.ElementType }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: 'start',
        slidesToScroll: 1,
        containScroll: 'trimSnaps'
    });
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    if (funds.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-display flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    {title}
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4">
                    {funds.map((fund) => (
                        <div key={fund.id} className="flex-none w-[300px]">
                            <FundCard fund={fund} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function FundExplorer() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [risk, setRisk] = useState("All");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const { data: funds, isLoading } = useFunds({
        search: search || undefined,
        category: selectedCategory || (category !== "All" ? category : undefined),
        riskLevel: risk !== "All" ? risk : undefined
    });

    // Derive trending (high return) and top rated funds
    const trendingFunds = funds?.slice().sort((a, b) => Number(b.return1y) - Number(a.return1y)).slice(0, 6) || [];
    const topRatedFunds = funds?.slice().sort((a, b) => b.rating - a.rating).slice(0, 6) || [];

    const riskLevels = ["All", "Low", "Moderately Low", "Moderate", "Moderately High", "High", "Very High"];

    const handleCategoryClick = (catId: string) => {
        if (selectedCategory === catId) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(catId);
        }
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <section className="relative rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-white overflow-hidden shadow-2xl shadow-blue-900/20">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay bg-cover bg-center" />

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
                            <Link href="/simulator">
                                <Button variant="secondary" size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
                                    Start Simulator
                                </Button>
                            </Link>
                            <Link href="/advisor">
                                <Button variant="outline" size="lg" className="rounded-full px-8 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white backdrop-blur-sm">
                                    AI Advisor
                                </Button>
                            </Link>
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

            {/* Category Cards Grid */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold font-display">Explore by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((cat) => (
                        <motion.div
                            key={cat.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card
                                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${selectedCategory === cat.id
                                        ? 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                                        : 'hover:border-primary/30'
                                    }`}
                                onClick={() => handleCategoryClick(cat.id)}
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-3`}>
                                    <cat.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-semibold text-sm">{cat.label}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
                {selectedCategory && (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm">
                            Showing: {selectedCategory}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                            className="text-xs"
                        >
                            Clear filter
                        </Button>
                    </div>
                )}
            </section>

            {/* Trending Funds Carousel */}
            {!selectedCategory && !search && (
                <FundCarousel
                    title="Trending Funds"
                    funds={trendingFunds}
                    icon={TrendingUp}
                />
            )}

            {/* Top Rated Carousel */}
            {!selectedCategory && !search && (
                <FundCarousel
                    title="Top Rated"
                    funds={topRatedFunds}
                    icon={Star}
                />
            )}

            {/* Search & Filters */}
            <div className="sticky top-16 z-20 bg-background/95 backdrop-blur py-4 border-b border-border space-y-4 md:space-y-0 md:flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search funds by name or AMC..."
                        className="pl-9 h-11 bg-card border-border shadow-sm focus:ring-primary/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <Select value={category} onValueChange={(v) => { setCategory(v); setSelectedCategory(null); }}>
                        <SelectTrigger className="w-[140px] h-11 bg-card border-border shadow-sm">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Categories</SelectItem>
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={risk} onValueChange={setRisk}>
                        <SelectTrigger className="w-[160px] h-11 bg-card border-border shadow-sm">
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

            {/* All Funds Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-display">
                        {selectedCategory ? `${selectedCategory} Funds` : "All Funds"}
                    </h2>
                    <span className="text-sm text-muted-foreground">{funds?.length || 0} funds found</span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
    );
}
