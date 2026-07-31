import { createFileRoute } from "@tanstack/react-router";
import { AVERAGES, HEADLINE, PER_CLASS, RUN_META } from "@/data/qt221";
import { SectionHeading, delta, pct } from "@/components/ui-bits";
import { ConfusionMatrix } from "@/components/confusion-matrix";
import { PerClassSensitivity } from "@/components/per-class-sensitivity";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — classical vs quantum-optimized pipeline" },
      {
        name: "description",
        content:
          "Per-class sensitivity and specificity, macro and micro averages, one-vs-rest AUC-ROC and 4x4 confusion matrices for both the classical and QIEO-optimized pipelines.",
      },
      { property: "og:title", content: "Results — classical vs quantum-optimized pipeline" },
      {
        property: "og:description",
        content:
          "Full held-out test-set evaluation (n = 1054) with worst-class sensitivity reported as the headline caution metric.",
      },
    ],
  }),
  component: Results,
});

function Results() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        title="Comparative results"
        description={`Both pipelines evaluated on the full held-out test split (n = ${RUN_META.testImages}), all four classes present. Solver: ${RUN_META.solver}.`}
      />

      <div className="mt-8 overflow-x-auto rule-panel">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="p-3 text-left label-mono">Metric</th>
              <th className="p-3 text-right label-mono">Classical</th>
              <th className="p-3 text-right label-mono">Quantum-optimized</th>
              <th className="p-3 text-right label-mono">Delta</th>
            </tr>
          </thead>
          <tbody>
            {HEADLINE.map((row) => {
              const isNum = typeof row.classical === "number";
              return (
                <tr key={row.label} className="border-b border-border last:border-b-0">
                  <td className="p-3">{row.label}</td>
                  <td className="p-3 text-right font-mono tabular-nums">
                    {row.format === "pct" ? pct(row.classical as number) : String(row.classical)}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold tabular-nums">
                    {row.format === "pct" ? pct(row.quantum as number) : String(row.quantum)}
                  </td>
                  <td className="p-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {row.format === "pct"
                      ? delta(row.classical as number, row.quantum as number)
                      : isNum
                        ? `${(row.quantum as number) - (row.classical as number)}`
                        : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading
            title="Per-class sensitivity"
            description="Bars scaled from 80% to 100%. The weakest class under the quantum pipeline is flagged."
          />
          <div className="mt-8">
            <PerClassSensitivity />
          </div>
        </div>
        <div>
          <SectionHeading
            title="Per-class detail"
            description="Sensitivity (recall), specificity, F1 and one-vs-rest AUC for each tumour subtype."
          />
          <div className="mt-8 overflow-x-auto rule-panel">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="p-2 text-left label-mono">Class</th>
                  <th className="p-2 text-right label-mono">Sens C/Q</th>
                  <th className="p-2 text-right label-mono">Spec C/Q</th>
                  <th className="p-2 text-right label-mono">F1 C/Q</th>
                  <th className="p-2 text-right label-mono">AUC C/Q</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {PER_CLASS.map((c) => (
                  <tr key={c.key} className="border-b border-border last:border-b-0">
                    <td className="p-2 font-sans">{c.label}</td>
                    <td className="p-2 text-right">
                      {pct(c.classical.sens)} / {pct(c.quantum.sens)}
                    </td>
                    <td className="p-2 text-right">
                      {pct(c.classical.spec)} / {pct(c.quantum.spec)}
                    </td>
                    <td className="p-2 text-right">
                      {pct(c.classical.f1)} / {pct(c.quantum.f1)}
                    </td>
                    <td className="p-2 text-right">
                      {pct(c.classical.auc)} / {pct(c.quantum.auc)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 overflow-x-auto rule-panel">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="p-2 text-left label-mono">Average</th>
                  <th className="p-2 text-right label-mono">Macro C</th>
                  <th className="p-2 text-right label-mono">Macro Q</th>
                  <th className="p-2 text-right label-mono">Micro C</th>
                  <th className="p-2 text-right label-mono">Micro Q</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {AVERAGES.map((a) => (
                  <tr key={a.metric} className="border-b border-border last:border-b-0">
                    <td className="p-2 font-sans">{a.metric}</td>
                    <td className="p-2 text-right">{pct(a.macroC)}</td>
                    <td className="p-2 text-right">{pct(a.macroQ)}</td>
                    <td className="p-2 text-right">{pct(a.microC)}</td>
                    <td className="p-2 text-right">{pct(a.microQ)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <SectionHeading
          title="Confusion matrices"
          description="Glioma and meningioma are the dominant confusion pair in both pipelines; the quantum-selected subset reduces that off-diagonal mass without inflating any other error cell."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ConfusionMatrix pipeline="classical" />
          <ConfusionMatrix pipeline="quantum" />
        </div>
      </div>
    </div>
  );
}
