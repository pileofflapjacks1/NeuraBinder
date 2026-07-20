import type { Metadata } from "next";
import { PortfolioDashboard } from "@/components/portfolio/portfolio-dashboard";

export const metadata: Metadata = {
  title: "Portfolio",
};

export default function PortfolioPage() {
  return <PortfolioDashboard />;
}
