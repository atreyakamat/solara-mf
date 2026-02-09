import { Layout } from "@/components/Layout";
import { FundExplorer } from "./fund-explorer";
import { Suspense } from "react";

export const metadata = {
    title: "Fund Explorer | FundFlow AI",
    description: "Discover top-rated mutual funds. Browse by category, filter by risk level, and find the perfect funds for your portfolio.",
};

export default function HomePage() {
    return (
        <Layout>
            <Suspense fallback={<FundExplorerSkeleton />}>
                <FundExplorer />
            </Suspense>
        </Layout>
    );
}

function FundExplorerSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Hero skeleton */}
            <div className="h-64 rounded-3xl bg-card" />

            {/* Filter bar skeleton */}
            <div className="h-12 rounded-lg bg-card" />

            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-64 rounded-xl bg-card border border-border" />
                ))}
            </div>
        </div>
    );
}
