import type { Metadata } from "next";
import { ScanFlow } from "@/components/scan/scan-flow";

export const metadata: Metadata = {
  title: "Scan",
};

export default function ScanPage() {
  return <ScanFlow />;
}
