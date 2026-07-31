import { cn } from "@/lib/utils";

export function SectionHeading({
  index,
  title,
  description,
  className,
}: {
  index?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border pb-5", className)}>
      <div className="flex items-baseline gap-3">
        {index ? <span className="label-mono">{index}</span> : null}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rule-panel p-5">
      <p className="label-mono">{label}</p>
      <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function delta(a: number, b: number) {
  const d = (b - a) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)} pp`;
}
