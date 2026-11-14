import type { Metadata } from "next";
import { Suspense } from "react";
import { ScanFlow } from "@/components/scan/scan-flow";

export const metadata: Metadata = { title: "Scan your benefits — LeftOnTable" };

export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <ScanFlow />
    </Suspense>
  );
}
