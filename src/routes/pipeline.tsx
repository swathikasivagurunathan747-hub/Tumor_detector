import { createFileRoute } from "@tanstack/react-router";
import { HYPERPARAMS, RUN_META, STAGES } from "@/data/qt221";
import { SectionHeading } from "@/components/ui-bits";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline stages — QT-2.21 imaging classification" },
      {
        name: "description",
        content:
          "Seven-stage build: preprocessing, frozen ResNet18 feature extraction, classical SVM/RF baseline, QUBO quantum feature selection, full per-class evaluation, comparison and Grad-CAM.",
      },
      { property: "og:title", content: "Pipeline stages — QT-2.21 imaging classification" },
      {
        property: "og:description",
        content:
          "Frozen-backbone extraction, RandomizedSearchCV tuning, BQPhy QIEO QUBO selection and a fully rigorous evaluation stage.",
      },
    ],
  }),
  component: Pipeline,
});

function Pipeline() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        title="Pipeline"
        description={`${RUN_META.backbone}. ${RUN_META.extraction}. Extraction wall time ${RUN_META.extractionTime}.`}
      />

      <ol className="mt-10 space-y-px border border-border">
        {STAGES.map((s) => (
          <li key={s.id} className="grid gap-4 border-b border-border bg-card p-6 last:border-b-0 md:grid-cols-[8rem_1fr]">
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums">{s.id}</p>
              <p className="label-mono mt-1">{s.time}</p>
            </div>
            <div>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <ul className="mt-3 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1 w-3 shrink-0 bg-surface-strong" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16">
        <SectionHeading
          title="Logged hyperparameters"
          description="All seeds fixed and every search space logged so both pipelines are reproducible run to run."
        />
        <div className="mt-8 overflow-x-auto rule-panel">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {HYPERPARAMS.map((h) => (
                <tr key={h.name} className="border-b border-border last:border-b-0">
                  <td className="w-72 p-3 font-mono text-xs">{h.name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{h.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-16 rule-panel bg-surface p-6">
        <p className="label-mono">Constraint log</p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>Frozen pretrained backbone only — no fine-tuning, no multi-epoch image training.</li>
          <li>Test set never reduced; no class skipped to save time.</li>
          <li>Imbalance handled with class weighting and stratified sampling, not by discarding data.</li>
          <li>Libraries: scikit-learn, PyTorch (inference only), OpenCV, SimpleITK, MONAI, NumPy, Pandas, BQPhy SDK.</li>
        </ul>
      </div>
    </div>
  );
}
