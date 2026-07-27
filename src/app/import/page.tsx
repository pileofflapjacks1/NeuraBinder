"use client";

import { useMemo, useState } from "react";
import { parseImportCsv, SAMPLE_CSV } from "@/lib/import/csv";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { ImportPreview } from "@/lib/types/features";
import { toast } from "sonner";
import { enqueueOp, isBrowserOffline } from "@/lib/offline/queue";

export default function ImportPage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const playFeedback = useBciStore((s) => s.playFeedback);
  const catalog = useCollectionStore((s) => s.catalog);
  const importRows = useCollectionStore((s) => s.importRows);
  const log = useActivityStore((s) => s.log);

  const [text, setText] = useState(SAMPLE_CSV);
  const [merge, setMerge] = useState(true);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const runParse = () => {
    const p = parseImportCsv(text, catalog, "auto");
    setPreview(p);
    toast.message(`Parsed ${p.rows.length} rows (${p.format})`);
  };

  const apply = async () => {
    if (!preview) return;
    if (isBrowserOffline()) {
      await enqueueOp("add_card", { bulk: preview.rows, merge });
      toast.message("Offline — import queued");
      return;
    }
    const result = importRows(preview.rows, merge);
    playFeedback("success");
    log("Import CSV", { href: "/import", intent: "add" });
    toast.success(
      `Import done: ${result.added} added, ${result.merged} merged, ${result.skipped} skipped`
    );
  };

  const matchRate = useMemo(() => {
    if (!preview?.rows.length) return 0;
    return (preview.matched / preview.rows.length) * 100;
  }, [preview]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-3xl" : "text-2xl"
          )}
        >
          Import spreadsheet
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste a CSV from TCGPlayer, Collectr, or NeuraBinder. Matching happens
          on this device — nothing is uploaded.
        </p>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Paste or edit CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={cn(
              "w-full rounded-xl border border-input bg-background p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              bciMode ? "min-h-[220px] text-sm" : "min-h-[180px]"
            )}
            spellCheck={false}
            aria-label="CSV content"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={merge}
                onChange={(e) => setMerge(e.target.checked)}
                className="h-4 w-4"
              />
              Merge duplicates (same card + condition + variant)
            </label>
            <Button size={bciMode ? "bci" : "default"} onClick={runParse}>
              Preview
            </Button>
            <Button
              size={bciMode ? "bci" : "default"}
              variant="secondary"
              onClick={() => setText(SAMPLE_CSV)}
            >
              Load sample
            </Button>
            <Button
              size={bciMode ? "bci" : "default"}
              variant="outline"
              disabled={!preview}
              onClick={() => void apply()}
            >
              Confirm import
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Preview
              <Badge>{preview.format}</Badge>
              <Badge variant="secondary">
                {preview.matched}/{preview.rows.length} matched (
                {matchRate.toFixed(0)}%)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preview.errors.map((e) => (
              <p key={e} className="text-sm text-destructive">
                {e}
              </p>
            ))}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-2">Name</th>
                    <th className="py-2 pr-2">Qty</th>
                    <th className="py-2 pr-2">Cond</th>
                    <th className="py-2 pr-2">Match</th>
                    <th className="py-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className={cn("py-2 pr-2", bciMode && "py-3")}>
                        {r.name}
                        <span className="block text-xs text-muted-foreground">
                          {r.setName} {r.number ? `#${r.number}` : ""}
                        </span>
                      </td>
                      <td>{r.quantity}</td>
                      <td>{r.condition}</td>
                      <td>
                        {r.matchedCardId ? (
                          <Badge variant="success">
                            {(r.matchConfidence * 100).toFixed(0)}%
                          </Badge>
                        ) : (
                          <Badge variant="destructive">unmatched</Badge>
                        )}
                      </td>
                      <td>{formatCurrency(r.purchasePrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
