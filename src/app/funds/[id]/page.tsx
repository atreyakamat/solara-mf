import { Layout } from "@/components/Layout";
import { FundDetailClient } from "./fund-detail-client";
import { db } from "@/lib/db";
import { funds } from "@shared/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const [fund] = await db.select().from(funds).where(eq(funds.id, Number(id)));

    if (!fund) {
        return { title: "Fund Not Found | FundFlow AI" };
    }

    return {
        title: `${fund.name} | FundFlow AI`,
        description: `Analyze ${fund.name} by ${fund.amc}. View NAV, returns, technical ratios, and more. ${fund.category} - ${fund.subCategory}.`,
    };
}

export default async function FundDetailPage({ params }: Props) {
    const { id } = await params;
    const [fund] = await db.select().from(funds).where(eq(funds.id, Number(id)));

    if (!fund) {
        notFound();
    }

    return (
        <Layout>
            <FundDetailClient fund={fund} />
        </Layout>
    );
}
