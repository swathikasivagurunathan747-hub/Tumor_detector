import { CLASS_LABEL, type ScanRecord } from "@/data/scans";
import { cn } from "@/lib/utils";

export function ScanTile({
  scan,
  showHeatmap,
  pipeline,
}: {
  scan: ScanRecord;
  showHeatmap: boolean;
  pipeline: "classical" | "quantum";
}) {
  const pred = pipeline === "quantum" ? scan.predQuantum : scan.predClassical;
  const correct = pred === scan.trueClass;

  return (
    <figure className="rule-panel overflow-hidden">
      <div className="relative aspect-square bg-black">
        <img
          src={scan.src}
          alt={`${CLASS_LABEL[scan.trueClass]} MRI scan ${scan.id}, ${scan.plane} plane`}
          loading="lazy"
          width={512}
          height={512}
          className={cn(
            "h-full w-full object-cover",
            showHeatmap && "opacity-80 contrast-125",
          )}
        />
        {showHeatmap ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle at 58% 62%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 22%, transparent 46%)",
            }}
          />
        ) : null}
        <span className="absolute left-2 top-2 bg-background/85 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest">
          {scan.id}
        </span>
        <span
          className={cn(
            "absolute right-2 top-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
            correct ? "bg-background/85" : "bg-foreground text-background",
          )}
        >
          {correct ? "ok" : "error"}
        </span>
      </div>
      <figcaption className="space-y-1 border-t border-border p-3">
        <p className="font-mono text-xs font-semibold">{CLASS_LABEL[scan.trueClass]}</p>
        <p className="label-mono">
          pred {CLASS_LABEL[pred]} · {(scan.confidence * 100).toFixed(0)}%
        </p>
        <p className="label-mono">
          {scan.plane} · {scan.sliceThickness} mm
        </p>
      </figcaption>
    </figure>
  );
}
