import { runStep } from "../../../modules/api.js";

export function createStep1(context) {
  return {
    id: "step1",
    label: "STEP 1: CONVERTING KMZ",
    async run() {
      if (!context.state.sessionId) {
        throw new Error("Pilih file KMZ terlebih dahulu.");
      }

      const result = await runStep(context.state.sessionId, 1);
      context.logger.setMessage(result.message || "Step 1 selesai.");
      return result;
    },
  };
}