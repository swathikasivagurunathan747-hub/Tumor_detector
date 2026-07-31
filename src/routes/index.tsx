import { createFileRoute, Link } from "@tanstack/react-router";
import { CLASSES, HEADLINE, RUN_META, STAGES } from "@/data/qt221";
import { SectionHeading, Stat, delta, pct } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QT-2.21 — Quantum-Enhanced Tumour Subtype Classification" },
      {
        name: "description",
        content:
          "Multi-class brain MRI tumour subtype classification comparing a classical ML pipeline against a BQPhy QIEO quantum-optimized feature selection pipeline, with full per-class sensitivity reporting.",
      },
      { property: "og:title", content: "QT-2.21 — Quantum-Enhanced Tumour Subtype Classification" },
      {
        property: "og:description",
        content:
          "Frozen ResNet18 features, classical vs quantum-optimized QUBO feature selection, per-class sensitivity and specificity on a 1054-scan held-out test set.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const worst = HEADLINE[2];

  return (
    <div>
      <section className="blueprint-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="label-mono">
            {RUN_META.runId} · {RUN_META.modality} · 4-class · seed {RUN_META.seed}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl leading-[1.1] font-semibold sm:text-5xl">
            Quantum-enhanced medical imaging classification, judged on the class it misses most.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            A frozen pretrained backbone extracts features once. A classical pipeline and a BQPhy
            QIEO quantum-optimized pipeline then compete on the identical feature set, identical
            classifiers, and the identical full-size held-out test split. Speed was taken out of the
            training path only — never out of evaluation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/results"
              className="border border-foreground bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-85"
            >
              View results
            </Link>
            <Link
              to="/pipeline"
              className="border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-accent"
            >
              Pipeline stages
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHeading
          index="00"
          title="Headline caution metric"
          description="In a cancer-detection context the weakest class is what a clinician looks at first, not the best-case average. Glioma is that class in both pipelines."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Worst-class sensitivity (quantum)"
            value={pct(worst.quantum as number)}
            sub={`Classical ${pct(worst.classical as number)} · ${delta(worst.classical as number, worst.quantum as number)}`}
          />
          <Stat
            label="Overall accuracy (quantum)"
            value={pct(HEADLINE[0].quantum as number)}
            sub={`Classical ${pct(HEADLINE[0].classical as number)}`}
          />
          <Stat label="Test scans evaluated" value={RUN_META.testImages.toLocaleString()} sub="Full split, no class dropped" />
          <Stat label="Features selected by QUBO" value="71 / 536" sub="Classical RFE+PCA kept 128" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <SectionHeading
          index="01"
          title="Dataset & classes"
          description={`${RUN_META.dataset} — ${RUN_META.totalImages.toLocaleString()} images, split ${RUN_META.split}. Imbalance handled with class weighting and stratified sampling, never by discarding data.`}
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {CLASSES.map((c) => (
            <div key={c.key} className="rule-panel flex items-start justify-between gap-6 p-5">
              <div>
                <p className="font-mono text-sm font-semibold">{c.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.note}</p>
              </div>
              <p className="shrink-0 font-mono text-lg tabular-nums">{c.count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <SectionHeading
          index="02"
          title="Method in one pass"
          description="Every shortcut sits in the training path. Nothing in the evaluation path was compressed."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STAGES.slice(0, 6).map((s) => (
            <div key={s.id} className="rule-panel p-5">
              <div className="flex items-baseline justify-between">
                <span className="label-mono">{s.id}</span>
                <span className="label-mono">{s.time}</span>
              </div>
              <p className="mt-3 font-mono text-sm font-semibold">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.points[0]}</p>
            </div>
          ))}
        </div>
        <Link
          to="/pipeline"
          className="mt-8 inline-block border-b border-foreground pb-0.5 font-mono text-xs uppercase tracking-widest"
        >
          All seven stages
        </Link>
      </section>
    </div>
  );
}
