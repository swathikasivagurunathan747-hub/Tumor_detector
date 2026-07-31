import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runNativeMLEngine } from "./ml_engine";

const Input = z.object({ imageDataUrl: z.string(), note: z.string().optional() });
export type ScanReport = {
  modalityCheck: string; usable: boolean;
  quality: { label: string; comment: string };
  prediction: { label: string; confidence: number };
  probabilities: { label: string; value: number }[];
  location: string; findings: string[]; differential: string[]; cautions: string[]; recommendation: string;
};

export const analyzeScan = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ScanReport> => {
    const api = process.env.ML_API_URL ?? process.env.QFLUX_ML_API ?? "http://127.0.0.1:8000";
    
    try {
      const res = await fetch(`${api}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return (await res.json()) as ScanReport;
      }
    } catch {
      // Fallback engine when remote API is unreachable (e.g. on Vercel)
    }

    // Execute Native ML Engine (using exact trained HOG + Linear SVM weights from joblib)
    return runNativeMLEngine(data.imageDataUrl, data.note);
  });
