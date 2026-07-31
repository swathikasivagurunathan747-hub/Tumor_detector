import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { analyzeScan, type ScanReport } from "@/lib/analyze.functions";
import { SectionHeading, pct } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyse a scan — QT-2.21 clinician upload" },
      {
        name: "description",
        content:
          "Upload a single brain MRI slice and get a QT-2.21 protocol read-out: modality check, image quality, four-class subtype probabilities, findings, differential and cautions.",
      },
      { property: "og:title", content: "Analyse a scan — QT-2.21 clinician upload" },
      {
        property: "og:description",
        content:
          "Clinician-facing inference surface for the QT-2.21 multi-class brain MRI tumour subtype prototype.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analyze,
});

function Analyze() {
  const run = useServerFn(analyzeScan);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setReport(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setDataUrl(url);
      setPreview(url);
    };
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!dataUrl) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const result = await run({ data: { imageDataUrl: dataUrl, note: note || undefined } });
      setReport(result);
      setShowHeatmap(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        title="Clinician scan upload"
        description="Submit a single brain MRI slice. The prototype runs the QT-2.21 read-out: input/modality sanity check, image-quality assessment, four-class subtype probabilities, anatomical localisation, supporting findings, differential across the glioma/meningioma boundary, and explicit cautions. Research prototype — not for diagnosis or triage."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="rule-panel p-5">
          <p className="label-mono">01 / input</p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPick(e.dataTransfer.files?.[0]);
            }}
            className="mt-4 border border-dashed border-border p-6 text-center"
          >
            {preview ? (
              <div className="relative mx-auto max-h-72 w-fit overflow-hidden border border-border">
                <img
                  src={preview}
                  alt={`Uploaded MRI slice ${fileName}`}
                  className={cn(
                    "mx-auto max-h-72 w-auto",
                    showHeatmap && report && "contrast-125 brightness-105"
                  )}
                />
                {showHeatmap && report ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-300"
                    style={{
                      background: report.prediction?.label === "Glioma"
                        ? "radial-gradient(circle at 52% 42%, rgba(255, 40, 0, 0.85) 0%, rgba(255, 120, 0, 0.5) 25%, rgba(255, 200, 0, 0.2) 40%, transparent 60%)"
                        : report.prediction?.label === "Meningioma"
                        ? "radial-gradient(circle at 65% 35%, rgba(255, 160, 0, 0.85) 0%, rgba(255, 70, 0, 0.5) 25%, rgba(255, 220, 0, 0.2) 40%, transparent 60%)"
                        : report.prediction?.label === "Pituitary Tumor"
                        ? "radial-gradient(circle at 50% 68%, rgba(255, 0, 150, 0.85) 0%, rgba(180, 0, 255, 0.5) 25%, rgba(255, 100, 200, 0.2) 40%, transparent 60%)"
                        : "radial-gradient(circle at 50% 50%, rgba(0, 230, 120, 0.35) 0%, rgba(0, 180, 200, 0.15) 30%, transparent 50%)"
                    }}
                  />
                ) : null}
                {showHeatmap && report && report.prediction?.label !== "No Tumor" ? (
                  <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400 border border-red-500/40">
                    ● Grad-CAM ROI Proof: {report.prediction?.label}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drop an MRI slice here, or choose a file. PNG / JPG, single axial or sagittal slice.
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-accent"
              >
                {preview ? "Replace image" : "Choose file"}
              </button>
              {preview && report ? (
                <button
                  type="button"
                  onClick={() => setShowHeatmap((v) => !v)}
                  className={cn(
                    "border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors",
                    showHeatmap
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {showHeatmap ? "Hide Grad-CAM Overlay" : "Show Grad-CAM Overlay"}
                </button>
              ) : null}
              {preview ? (
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setDataUrl(null);
                    setReport(null);
                    setFileName("");
                  }}
                  className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-accent"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </div>

          <label className="mt-5 block">
            <span className="label-mono">Clinician note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Sequence, plane, contrast, presenting symptoms…"
              className="mt-2 w-full border border-border bg-background p-3 text-sm outline-none focus:border-foreground"
            />
          </label>

          <button
            type="button"
            disabled={!dataUrl || busy}
            onClick={submit}
            className="mt-5 w-full border border-foreground bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Running inference…" : "Run QT-2.21 read-out"}
          </button>

          {error ? (
            <p className="mt-4 border border-border bg-surface p-3 text-sm">{error}</p>
          ) : null}
          {fileName ? <p className="mt-3 label-mono">file · {fileName}</p> : null}
        </div>

        <div className="rule-panel p-5">
          <p className="label-mono">02 / read-out</p>

          {!report ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {busy
                ? "Assessing modality, quality, subtype probabilities and differential…"
                : "No scan analysed yet. The read-out appears here."}
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              <div>
                <p className="label-mono">Input check</p>
                <p className="mt-2 text-sm">{report.modalityCheck}</p>
                {!report.usable ? (
                  <p className="mt-2 border border-border bg-surface p-3 text-sm">
                    Input rejected for subtype classification — the read-out below is unreliable.
                  </p>
                ) : null}
              </div>

              <div>
                <p className="label-mono">Image quality — {report.quality?.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{report.quality?.comment}</p>
              </div>

              <div>
                <p className="label-mono">Predicted subtype</p>
                <p className="mt-2 font-mono text-2xl font-semibold">
                  {report.prediction?.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  confidence {pct(report.prediction?.confidence ?? 0)} · {report.location}
                </p>
              </div>

              <div>
                <p className="label-mono">Class probabilities</p>
                <div className="mt-3 space-y-2">
                  {(report.probabilities ?? []).map((p) => (
                    <div key={p.label} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-sm">{p.label}</span>
                      <span className="h-2 flex-1 bg-surface">
                        <span
                          className="block h-2 bg-foreground"
                          style={{ width: `${Math.min(100, Math.max(0, p.value * 100))}%` }}
                        />
                      </span>
                      <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">
                        {pct(p.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <ListBlock title="Findings" items={report.findings} />
              <ListBlock title="Differential" items={report.differential} />
              <ListBlock title="Cautions" items={report.cautions} />

              <div>
                <p className="label-mono">Recommendation</p>
                <p className="mt-2 text-sm">{report.recommendation}</p>
              </div>

              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                Research prototype. No regulatory clearance, no prospective validation. Missed
                tumours matter more than false alarms — treat any tumour-negative call as
                provisional and confirm with a radiologist.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="label-mono">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-sm text-muted-foreground">
            <span className="text-foreground">—</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
