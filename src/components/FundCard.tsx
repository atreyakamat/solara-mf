"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingUp, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Fund } from "@shared/schema";

interface FundCardProps {
  fund: Fund;
}

export function FundCard({ fund }: FundCardProps) {
  const isPositive = Number(fund.navChange) >= 0;

  return (
    <Link href={`/funds/${fund.id}`}>
      <div className="group relative bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] bg-secondary/50 border-border font-medium text-muted-foreground px-2 py-0.5 h-5">
              {fund.category} • {fund.subCategory}
            </Badge>
            <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
              {fund.name}
            </h3>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-yellow-400/10 px-1.5 py-0.5 rounded text-yellow-600 text-xs font-bold">
              {fund.rating}<Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">NAV</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-medium">₹{Number(fund.nav).toFixed(2)}</span>
              <span className={cn(
                "text-xs font-medium flex items-center",
                isPositive ? "text-accent" : "text-destructive"
              )}>
                {isPositive ? "+" : ""}{fund.navChange}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">1Y Returns</p>
            <div className="flex items-center gap-1 text-accent font-medium">
              <TrendingUp className="w-3 h-3" />
              {fund.return1y}%
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className={cn(
              "w-3.5 h-3.5",
              fund.riskLevel.includes("High") ? "text-orange-500" : "text-accent"
            )} />
            {fund.riskLevel} Risk
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-[-8px]">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
