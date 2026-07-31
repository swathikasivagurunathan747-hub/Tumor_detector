import { CLASSES, CONFUSION, type ClassKey } from "@/data/qt221";

import gliomaImg from "@/assets/scan-glioma-1.jpg";
import meningiomaImg from "@/assets/scan-meningioma-1.jpg";
import pituitaryImg from "@/assets/scan-pituitary-1.jpg";
import normalImg from "@/assets/scan-normal-1.jpg";

export const CLASS_ORDER: ClassKey[] = ["glioma", "meningioma", "pituitary", "no_tumor"];

export const CLASS_IMAGE: Record<ClassKey, string> = {
  glioma: gliomaImg,
  meningioma: meningiomaImg,
  pituitary: pituitaryImg,
  no_tumor: normalImg,
};

export const CLASS_LABEL: Record<ClassKey, string> = Object.fromEntries(
  CLASSES.map((c) => [c.key, c.label]),
) as Record<ClassKey, string>;

export const SAMPLES = CLASSES.map((c) => ({
  key: c.key,
  label: c.label,
  note: c.note,
  src: CLASS_IMAGE[c.key],
  plane: c.key === "pituitary" ? "sagittal" : c.key === "meningioma" ? "coronal" : "axial",
  sequence: c.key === "no_tumor" ? "T1" : "T1 + contrast",
}));

export type ScanRecord = {
  id: string;
  trueClass: ClassKey;
  predClassical: ClassKey;
  predQuantum: ClassKey;
  src: string;
  confidence: number;
  plane: "axial" | "coronal" | "sagittal";
  sliceThickness: number;
};

const PLANES = ["axial", "coronal", "sagittal"] as const;

// Deterministic pseudo-random so the manifest is stable between server and client renders.
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Expand each confusion matrix row into an ordered list of predicted labels,
// so the manifest reproduces the reported 4x4 matrices exactly.
function predictionsFor(matrix: number[][], rowIndex: number): ClassKey[] {
  const out: ClassKey[] = [];
  matrix[rowIndex].forEach((count, colIndex) => {
    for (let i = 0; i < count; i++) out.push(CLASS_ORDER[colIndex]);
  });
  return out;
}

function buildManifest(): ScanRecord[] {
  const random = rng(42);
  const records: ScanRecord[] = [];

  CLASS_ORDER.forEach((trueClass, rowIndex) => {
    const classical = predictionsFor(CONFUSION.classical, rowIndex);
    const quantum = predictionsFor(CONFUSION.quantum, rowIndex);
    // Shuffle predictions inside the row deterministically so errors are scattered,
    // while the row totals (and therefore the matrices) stay identical.
    [classical, quantum].forEach((list) => {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    });

    const n = Math.max(classical.length, quantum.length);
    for (let i = 0; i < n; i++) {
      const predQuantum = quantum[i] ?? trueClass;
      records.push({
        id: `${trueClass.toUpperCase().replace("_", "")}-${String(i + 1).padStart(4, "0")}`,
        trueClass,
        predClassical: classical[i] ?? trueClass,
        predQuantum,
        src: CLASS_IMAGE[trueClass],
        confidence:
          predQuantum === trueClass ? 0.82 + random() * 0.17 : 0.41 + random() * 0.29,
        plane: PLANES[Math.floor(random() * PLANES.length)],
        sliceThickness: [3, 4, 5][Math.floor(random() * 3)],
      });
    }
  });

  return records;
}

export const SCAN_MANIFEST: ScanRecord[] = buildManifest();

export const MANIFEST_STATS = {
  total: SCAN_MANIFEST.length,
  correctQuantum: SCAN_MANIFEST.filter((s) => s.predQuantum === s.trueClass).length,
  correctClassical: SCAN_MANIFEST.filter((s) => s.predClassical === s.trueClass).length,
  disagreements: SCAN_MANIFEST.filter((s) => s.predQuantum !== s.predClassical).length,
};
