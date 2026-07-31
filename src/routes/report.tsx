import { createFileRoute } from "@tanstack/react-router";
import { LIMITATIONS, RUN_META } from "@/data/qt221";
import { SectionHeading } from "@/components/ui-bits";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Technical report — methodology & clinical limitations" },
      {
        name: "description",
        content:
          "Methodology, deliverables and an explicit clinical limitations section covering per-class gaps, dataset size, frozen-backbone transfer learning and the absence of regulatory validation.",
      },
      { property: "og:title", content: "Technical report — methodology & clinical limitations" },
      {
        property: "og:description",
        content:
          "Why frozen transfer learning was chosen, where the model fails, and what would be required before any clinical use.",
      },
    ],
  }),
  component: Report,
});

const DELIVERABLES = [
  "Preprocessing + one-pass feature extraction pipeline (features.parquet cached)",
  "Trained classical multi-class models, serialised (SVM + Random Forest)",
  "QuantumNow / BQPhy QUBO feature-selection workflow + retrained models",
  "Full per-class evaluation report for both pipelines",
  "Comparative results table, overall and per class",
  "Technical report: methodology, results, per-class limitations",
];




function Report() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <SectionHeading
        title="Technical report"
        description={`Run ${RUN_META.runId}. ${RUN_META.dataset}. ${RUN_META.split}.`}
      />

      <div className="mt-10 space-y-6">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-widest">Methodology</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Scans are resized, denoised and skull-stripped, then passed once through a fully frozen
          ImageNet ResNet18 in inference mode to produce a 512-dimensional embedding, concatenated
          with 24 GLCM texture descriptors for interpretability. Nothing is backpropagated through
          the backbone, so there are no image-training epochs at all — the entire learned component
          is a lightweight classifier over tabular feature vectors.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The classical arm selects features with RFE and PCA and tunes multi-class SVM (one-vs-rest,
          RBF) and Random Forest with RandomizedSearchCV under 5-fold stratified cross-validation.
          The quantum arm reformulates selection as a QUBO — binary indicator per feature, objective
          maximising mean pairwise ANOVA F-score relevance while penalising inter-feature redundancy
          — and submits it to the BQPhy QIEO solver. The same classifier families are then retrained
          on the quantum-selected subset, giving an apples-to-apples comparison in which only the
          feature subset differs.
        </p>

        <h3 className="pt-4 font-mono text-sm font-semibold uppercase tracking-widest">
          Frozen transfer learning — a choice, not a compromise
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Training millions of CNN parameters from random initialisation on a few thousand MRI slices
          is both slow and prone to overfitting. Using a backbone already trained on millions of
          general images to extract robust edge, texture and shape features, then fitting a small
          classifier on top, is a standard published technique for exactly this scenario. It was
          selected deliberately for the data size and timeline, and is reported below as a
          methodological limitation relative to partial fine-tuning rather than hidden.
        </p>

        <h3 className="pt-4 font-mono text-sm font-semibold uppercase tracking-widest">
          Deliverables
        </h3>
        <ol className="space-y-2">
          {DELIVERABLES.map((d, i) => (
            <li key={d} className="flex gap-4 text-sm leading-relaxed text-muted-foreground">
              <span className="font-mono text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span>{d}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-16">
        <SectionHeading
          title="Clinical limitations"
          description="Stated plainly, because the weakest part of the system is the part that matters."
        />
        <div className="mt-8 space-y-px border border-border">
          {LIMITATIONS.map((l) => (
            <article key={l.title} className="border-b border-border bg-card p-6 last:border-b-0">
              <h3 className="text-base font-semibold">{l.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-12 rule-panel bg-surface p-6">
        <p className="label-mono">Explainability (stretch)</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Grad-CAM is computed on the frozen backbone per predicted class, with one correctly and one
          incorrectly classified example inspected per class. On misclassified glioma cases the
          activation consistently centres on the lesion margin rather than its anatomical
          compartment, which matches the confusion pattern seen in the matrices.
        </p>
      </div>
    </div>
  );
}
