import { runStep } from "../../../modules/api.js";

export function createStep3(context) {
  return {
    id: "step3",
    label: "STEP 3: SYNC KOLOM A-K (FINAL)",
    async run() {
      if (!context.state.sessionId) {
        throw new Error("Pilih file KMZ terlebih dahulu.");
      }

      const result = await runStep(context.state.sessionId, 3);
      context.logger.setMessage(result.message || "Step 3 selesai.");
      return result;
    },
  };
}