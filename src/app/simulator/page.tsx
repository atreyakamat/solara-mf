import { Layout } from "@/components/Layout";
import { SimulatorClient } from "./simulator-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Portfolio Simulator | FundFlow AI",
    description: "Simulate your portfolio growth, analyze risk, and optimize your mutual fund allocations with our powerful portfolio simulator.",
};

export default function SimulatorPage() {
    return (
        <Layout>
            <SimulatorClient />
        </Layout>
    );
}
