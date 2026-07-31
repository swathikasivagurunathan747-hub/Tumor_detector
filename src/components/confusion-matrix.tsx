import { CLASS_LABELS, CONFUSION, type PipelineName } from "@/data/qt221";

function shade(v: number, max: number, diagonal: boolean) {
  const t = max === 0 ? 0 : v / max;
  // diagonal = dark ink, off-diagonal = light grey ramp
  const alpha = diagonal ? 0.08 + t * 0.9 : t === 0 ? 0.04 : 0.12 + t * 0.55;
  return `color-mix(in oklab, var(--foreground) ${Math.round(alpha * 100)}%, var(--background))`;
}

export function ConfusionMatrix({ pipeline }: { pipeline: PipelineName }) {
  const m = CONFUSION[pipeline];
  const max = Math.max(...m.flat());

  return (
    <div className="rule-panel p-5">
      <p className="label-mono">
        {pipeline === "classical" ? "Classical" : "Quantum-optimized"} — confusion matrix
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs tabular-nums">
          <thead>
            <tr>
              <th className="p-2 text-left label-mono">true \ pred</th>
              {CLASS_LABELS.map((c) => (
                <th key={c} className="p-2 text-center label-mono">
                  {c.split(" ")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.map((row, i) => (
              <tr key={CLASS_LABELS[i]}>
                <th className="whitespace-nowrap p-2 text-left text-xs font-medium">
                  {CLASS_LABELS[i]}
                </th>
                {row.map((v, j) => {
                  const diag = i === j;
                  const strong = diag && v / max > 0.55;
                  return (
                    <td
                      key={j}
                      className="border border-border p-0 text-center"
                      style={{ backgroundColor: shade(v, max, diag) }}
                    >
                      <span
                        className={
                          "block px-3 py-3 " +
                          (strong ? "text-primary-foreground" : "text-foreground")
                        }
                      >
                        {v}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Rows are ground truth, columns are prediction. Test set n = 1054.
      </p>
    </div>
  );
}
