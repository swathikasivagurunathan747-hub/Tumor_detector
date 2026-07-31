import { PER_CLASS } from "@/data/qt221";
import { pct } from "./ui-bits";

export function PerClassSensitivity() {
  const worst = Math.min(...PER_CLASS.map((c) => c.quantum.sens));

  return (
    <div className="space-y-4">
      {PER_CLASS.map((c) => {
        const isWorst = c.quantum.sens === worst;
        return (
          <div key={c.key} className="rule-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-sm font-semibold">{c.label}</p>
              {isWorst ? (
                <span className="label-mono border border-foreground px-2 py-0.5 text-foreground">
                  weakest class
                </span>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              <Bar label="Classical" value={c.classical.sens} tone="light" />
              <Bar label="Quantum" value={c.quantum.sens} tone="dark" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Bar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "light" | "dark";
}) {
  const scaled = ((value - 0.8) / 0.2) * 100;
  return (
    <div className="flex items-center gap-4">
      <span className="label-mono w-20 shrink-0">{label}</span>
      <div className="h-3 flex-1 bg-muted">
        <div
          className={tone === "dark" ? "h-full bg-foreground" : "h-full bg-surface-strong"}
          style={{ width: `${Math.max(4, Math.min(100, scaled))}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">{pct(value)}</span>
    </div>
  );
}
