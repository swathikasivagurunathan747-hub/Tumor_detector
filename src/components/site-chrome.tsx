import { Link } from "@tanstack/react-router";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/analyze", label: "Analyse" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/scans", label: "Scans" },
  { to: "/results", label: "Results" },
  { to: "/report", label: "Report" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
        <Link to="/" className="font-mono text-sm font-semibold tracking-tight">
          QT-2.21<span className="text-muted-foreground"> / quantum-enhanced imaging</span>
        </Link>
        <nav className="flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="label-mono transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:underline [&.active]:underline-offset-4"
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="label-mono">Research prototype — not for clinical use</p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Retrospective evaluation on a held-out public test split. No regulatory clearance, no
          prospective validation. Seeds and hyperparameters logged for reproducibility.
        </p>
      </div>
    </footer>
  );
}
