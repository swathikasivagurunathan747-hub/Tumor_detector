import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ imageDataUrl: z.string(), note: z.string().optional() });
export type ScanReport = {
  modalityCheck: string; usable: boolean;
  quality: { label: string; comment: string };
  prediction: { label: string; confidence: number };
  probabilities: { label: string; value: number }[];
  location: string; findings: string[]; differential: string[]; cautions: string[]; recommendation: string;
};

export const analyzeScan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ScanReport> => {
    const api = process.env.QFLUX_ML_API ?? "http://127.0.0.1:8000";
    let res: Response;
    try {
      res = await fetch(`${api}/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
    } catch {
      throw new Error("Q-Flux ML backend is not running. Start it with: python -m uvicorn ml.api:app --port 8000");
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ML inference failed [${res.status}]: ${body.slice(0, 300)}`);
    }
    return (await res.json()) as ScanReport;
  });
