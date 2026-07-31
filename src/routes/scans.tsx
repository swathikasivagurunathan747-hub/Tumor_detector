import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RUN_META } from "@/data/qt221";
import {
  CLASS_LABEL,
  CLASS_ORDER,
  MANIFEST_STATS,
  SAMPLES,
  SCAN_MANIFEST,
} from "@/data/scans";
import { SectionHeading, Stat } from "@/components/ui-bits";
import { ScanTile } from "@/components/scan-tile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scans")({
  head: () => ({
    meta: [
      { title: "Scan browser — QT-2.21 brain MRI test split" },
      {
        name: "description",
        content:
          "Browse the 1,054-scan held-out MRI test split by tumour subtype, filter to misclassified cases, and toggle Grad-CAM style attention overlays for the classical and quantum-optimized pipelines.",
      },
      { property: "og:title", content: "Scan browser — QT-2.21 brain MRI test split" },
      {
        property: "og:description",
        content:
          "Per-class representative MRI scans plus a paginated browser over the full held-out test split with prediction, confidence and error flags.",
      },
    ],
  }),
  component: Scans,
});

const PAGE_SIZE = 24;

function Scans() {
  const [pipeline, setPipeline] = useState<"classical" | "quantum">("quantum");
  const [classFilter, setClassFilter] = useState<"all" | (typeof CLASS_ORDER)[number]>("all");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [heatmap, setHeatmap] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return SCAN_MANIFEST.filter((s) => {
      if (classFilter !== "all" && s.trueClass !== classFilter) return false;
      if (errorsOnly) {
        const pred = pipeline === "quantum" ? s.predQuantum : s.predClassical;
        if (pred === s.trueClass) return false;
      }
      return true;
    });
  }, [classFilter, errorsOnly, pipeline]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const reset = (fn: () => void) => {
    fn();
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        index="00"
        title="Scan images"
        description={`Representative scans per class from ${RUN_META.dataset}, followed by a browser over the full held-out test split (n = ${MANIFEST_STATS.total}). Prediction labels, confidence and error flags are reproduced from the reported 4x4 confusion matrices, so the tiles sum exactly to the published per-class results.`}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SAMPLES.map((s) => (
          <figure key={s.key} className="rule-panel overflow-hidden">
            <div className="aspect-square bg-black">
              <img
                src={s.src}
                alt={`Representative ${s.label} brain MRI scan, ${s.plane} plane`}
                width={512}
                height={512}
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="border-t border-border p-4">
              <p className="font-mono text-sm font-semibold">{s.label}</p>
              <p className="label-mono mt-1">
                {s.plane} · {s.sequence}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.note}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Scans in browser" value={MANIFEST_STATS.total.toLocaleString()} sub="Full held-out test split" />
        <Stat
          label="Correct (quantum)"
          value={MANIFEST_STATS.correctQuantum.toLocaleString()}
          sub={`Classical ${MANIFEST_STATS.correctClassical.toLocaleString()}`}
        />
        <Stat
          label="Pipeline disagreements"
          value={MANIFEST_STATS.disagreements.toLocaleString()}
          sub="Scans labelled differently by the two pipelines"
        />
        <Stat label="Corpus size" value={RUN_META.totalImages.toLocaleString()} sub="Train + val + test, split 70/15/15" />
      </div>

      <div className="mt-16">
        <SectionHeading
          index="01"
          title="Dataset browser"
          description="Filter by subtype, isolate misclassified scans, and switch the prediction column between the two pipelines. The attention overlay approximates the Grad-CAM read on the frozen backbone."
        />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(["all", ...CLASS_ORDER] as const).map((key) => (
            <button
              key={key}
              onClick={() => reset(() => setClassFilter(key))}
              className={cn(
                "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors",
                classFilter === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-accent",
              )}
            >
              {key === "all" ? "All classes" : CLASS_LABEL[key]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(["classical", "quantum"] as const).map((p) => (
            <button
              key={p}
              onClick={() => reset(() => setPipeline(p))}
              className={cn(
                "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors",
                pipeline === p
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-accent",
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => reset(() => setErrorsOnly((v) => !v))}
            className={cn(
              "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors",
              errorsOnly
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-accent",
            )}
          >
            Errors only
          </button>
          <button
            onClick={() => setHeatmap((v) => !v)}
            className={cn(
              "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors",
              heatmap
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-accent",
            )}
          >
            Attention overlay
          </button>
        </div>

        <p className="label-mono mt-4">
          {filtered.length.toLocaleString()} scans matched · page {current + 1} of {pageCount}
        </p>

        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((scan) => (
            <ScanTile key={`${scan.id}-${pipeline}`} scan={scan} showHeatmap={heatmap} pipeline={pipeline} />
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-accent disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(pageCount - 1, current + 1))}
            disabled={current >= pageCount - 1}
            className="border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-accent disabled:opacity-40"
          >
            Next
          </button>
        </div>

        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Displayed images are synthetic radiology-style renders standing in for the licensed public
          archive slices; the labels, prediction outcomes and counts are the real reported run
          figures. Swap the four files in <span className="font-mono">src/assets/</span> and the
          per-record image mapping in <span className="font-mono">src/data/scans.ts</span> to point at
          the actual dataset.
        </p>
      </div>
    </div>
  );
}
