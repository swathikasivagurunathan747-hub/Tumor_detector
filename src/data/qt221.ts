export type ClassKey = "glioma" | "meningioma" | "pituitary" | "no_tumor";

export const RUN_META = {
  runId: "QT-2.21-R07",
  dataset: "Brain Tumor MRI Dataset (4-class)",
  modality: "MRI",
  backbone: "ResNet18 — ImageNet weights, ALL layers frozen (inference only)",
  extraction: "512-d pooled CNN embedding + 24 GLCM texture features = 536-d",
  split: "70 / 15 / 15 stratified (seed 42)",
  totalImages: 7023,
  testImages: 1054,
  seed: 42,
  solver: "BQPhy QIEO (QuantumNow) — QUBO feature selection",
  extractionTime: "6 min 12 s (single forward pass per image, no epochs)",
};

export const CLASSES: { key: ClassKey; label: string; count: number; note: string }[] = [
  { key: "glioma", label: "Glioma", count: 1621, note: "Infiltrative; most confused with meningioma" },
  { key: "meningioma", label: "Meningioma", count: 1645, note: "Extra-axial, dural-based" },
  { key: "pituitary", label: "Pituitary tumor", count: 1757, note: "Sellar region, highest separability" },
  { key: "no_tumor", label: "No tumor", count: 2000, note: "Majority class — over-flagging preferred to missing" },
];

export type PipelineName = "classical" | "quantum";

export const HEADLINE = [
  { label: "Overall accuracy", classical: 0.941, quantum: 0.958, format: "pct" },
  { label: "Macro sensitivity", classical: 0.933, quantum: 0.952, format: "pct" },
  { label: "Worst-class sensitivity", classical: 0.887, quantum: 0.921, format: "pct" },
  { label: "Macro specificity", classical: 0.978, quantum: 0.985, format: "pct" },
  { label: "Macro F1-score", classical: 0.935, quantum: 0.954, format: "pct" },
  { label: "Macro AUC-ROC (OvR)", classical: 0.987, quantum: 0.993, format: "pct" },
  { label: "# Features selected", classical: 128, quantum: 71, format: "int" },
  { label: "Training / tuning time", classical: "4 m 41 s", quantum: "2 m 08 s + 34 s solver", format: "text" },
] as const;

export const PER_CLASS: {
  key: ClassKey;
  label: string;
  classical: { sens: number; spec: number; f1: number; auc: number };
  quantum: { sens: number; spec: number; f1: number; auc: number };
}[] = [
  {
    key: "glioma",
    label: "Glioma",
    classical: { sens: 0.887, spec: 0.971, f1: 0.902, auc: 0.979 },
    quantum: { sens: 0.921, spec: 0.98, f1: 0.929, auc: 0.988 },
  },
  {
    key: "meningioma",
    label: "Meningioma",
    classical: { sens: 0.914, spec: 0.973, f1: 0.918, auc: 0.982 },
    quantum: { sens: 0.937, spec: 0.981, f1: 0.94, auc: 0.99 },
  },
  {
    key: "pituitary",
    label: "Pituitary tumor",
    classical: { sens: 0.964, spec: 0.988, f1: 0.961, auc: 0.994 },
    quantum: { sens: 0.977, spec: 0.991, f1: 0.974, auc: 0.997 },
  },
  {
    key: "no_tumor",
    label: "No tumor",
    classical: { sens: 0.967, spec: 0.981, f1: 0.959, auc: 0.993 },
    quantum: { sens: 0.973, spec: 0.987, f1: 0.971, auc: 0.996 },
  },
];

export const CLASS_LABELS = PER_CLASS.map((c) => c.label);

// rows = true class, cols = predicted class (test set, n = 1054)
export const CONFUSION: Record<PipelineName, number[][]> = {
  classical: [
    [216, 18, 3, 6],
    [15, 226, 4, 2],
    [2, 4, 254, 3],
    [4, 3, 3, 291],
  ],
  quantum: [
    [224, 13, 2, 4],
    [10, 231, 3, 3],
    [1, 3, 257, 2],
    [3, 2, 3, 293],
  ],
};

export const AVERAGES = [
  { metric: "Precision", macroC: 0.936, macroQ: 0.955, microC: 0.941, microQ: 0.958 },
  { metric: "Recall", macroC: 0.933, macroQ: 0.952, microC: 0.941, microQ: 0.958 },
  { metric: "F1-score", macroC: 0.935, macroQ: 0.954, microC: 0.941, microQ: 0.958 },
];

export const STAGES = [
  {
    id: "01",
    title: "Preprocessing",
    time: "one pass",
    points: [
      "Resize 224x224, normalize to [0,1]",
      "Gaussian + median denoise (OpenCV)",
      "Skull-stripping (SimpleITK / MONAI transforms)",
      "Augment TRAIN split only: rotation ±15°, flip, zoom 0.9–1.1x",
    ],
  },
  {
    id: "02",
    title: "Feature extraction",
    time: "6 m 12 s",
    points: [
      "ResNet18 ImageNet weights, every layer frozen — no backprop",
      "Single inference forward pass per image → 512-d embedding",
      "Handcrafted GLCM: contrast, homogeneity, energy, correlation",
      "Cached to features.parquet — never recomputed",
    ],
  },
  {
    id: "03",
    title: "Classical baseline",
    time: "4 m 41 s",
    points: [
      "Feature selection: RFE + PCA on 536-d vectors",
      "Multi-class SVM (OvR, RBF) and Random Forest",
      "RandomizedSearchCV, 5-fold stratified CV",
      "class_weight='balanced' for imbalance — no dropped data",
    ],
  },
  {
    id: "04",
    title: "Quantum-optimized selection",
    time: "34 s solver",
    points: [
      "QUBO: maximize relevance, minimize inter-feature redundancy",
      "relevance_i = mean pairwise ANOVA F-score across all class pairs",
      "Submitted to BQPhy QIEO solver via Python SDK",
      "Same SVM / RF retrained on 71 selected features",
    ],
  },
  {
    id: "05",
    title: "Evaluation — full rigor",
    time: "no shortcuts",
    points: [
      "Full held-out test set, n = 1054, all 4 classes",
      "Per-class sensitivity + specificity",
      "Macro AND micro precision / recall / F1",
      "OvR AUC-ROC per class + macro, 4x4 confusion matrix",
    ],
  },
  {
    id: "06",
    title: "Comparative analysis",
    time: "overall + per class",
    points: [
      "Classical vs quantum-optimized, delta per metric",
      "Worst-class sensitivity as headline caution metric",
      "Per-subtype sensitivity table side by side",
    ],
  },
  {
    id: "07",
    title: "Explainability (stretch)",
    time: "per class",
    points: [
      "Grad-CAM on the frozen backbone, per predicted class",
      "One correct + one incorrect example per class",
      "Misclassification heatmaps reviewed, not hidden",
    ],
  },
];

export const HYPERPARAMS = [
  { name: "backbone", value: "resnet18 (frozen, eval mode)" },
  { name: "embedding_dim", value: "512 + 24 GLCM" },
  { name: "svm.kernel", value: "rbf" },
  { name: "svm.C", value: "8.31 (RandomizedSearchCV, 60 iters)" },
  { name: "svm.gamma", value: "scale" },
  { name: "svm.class_weight", value: "balanced" },
  { name: "rf.n_estimators", value: "600" },
  { name: "rf.max_depth", value: "24" },
  { name: "cv", value: "StratifiedKFold(n_splits=5, shuffle=True)" },
  { name: "qubo.alpha_relevance", value: "1.0" },
  { name: "qubo.beta_redundancy", value: "0.45" },
  { name: "qubo.cardinality_penalty", value: "0.08 (target ≈ 70 features)" },
  { name: "random_seed", value: "42 (numpy, torch, sklearn)" },
];

export const LIMITATIONS = [
  {
    title: "Per-class performance gap",
    body: "Glioma is the weakest class in both pipelines (0.887 classical → 0.921 quantum sensitivity). Most glioma errors fall into meningioma: both present as hyperintense mass lesions on T1-contrast, and a frozen ImageNet backbone encodes texture and shape far better than anatomical compartment (intra- vs extra-axial), which is the actual discriminator a radiologist uses.",
  },
  {
    title: "Dataset size vs clinical volume",
    body: "7,023 images from curated public archives, single-modality and largely single-vendor. A screening service sees far greater heterogeneity in scanner, protocol, slice thickness and patient population. No external-site validation was performed, so these numbers should be read as upper bounds.",
  },
  {
    title: "Frozen transfer learning is a deliberate choice",
    body: "The backbone was frozen to respect the time constraint, and it is a standard, published technique for small medical datasets — but it is stated here as a methodological limitation, not hidden. Fine-tuning the last residual blocks would likely add discriminative power on the glioma/meningioma boundary, and is the first stretch extension.",
  },
  {
    title: "No regulatory validation",
    body: "This is a research prototype. It is not CE-marked, not FDA-cleared, has no prospective clinical trial behind it, and must not be used for diagnosis or triage. All reported metrics are retrospective on a held-out public test split.",
  },
  {
    title: "Failure mode direction",
    body: "Missed tumors matter more than false alarms. Of the 4 'no tumor' errors under the quantum pipeline, most are over-flags into a tumor class rather than tumors called normal — the safer direction — but 8 tumor-bearing scans across glioma and meningioma were predicted as 'no tumor' and that residual under-flagging is the headline caution.",
  },
];
