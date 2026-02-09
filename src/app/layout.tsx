import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: "FundFlow AI - Smart Mutual Fund Research & Simulation",
    description: "Discover top-rated mutual funds, simulate your wealth journey, and get AI-powered insights with FundFlow AI.",
    keywords: ["mutual funds", "investment", "SIP", "portfolio", "AI advisor"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
