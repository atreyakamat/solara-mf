import { Layout } from "@/components/Layout";
import { AdvisorClient } from "./advisor-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Investment Advisor | FundFlow AI",
    description: "Get personalized investment advice from our AI-powered financial advisor. Ask questions, get fund recommendations, and plan your investment journey.",
};

export default function AdvisorPage() {
    return (
        <Layout>
            <AdvisorClient />
        </Layout>
    );
}
