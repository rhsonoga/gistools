import { runStep } from "../../../modules/api.js";

export function createStep2(context) {
  return {
    id: "step2",
    label: "STEP 2: INJECT TO HPDB (BASIC)",
    async run() {
      if (!context.state.sessionId) {
        throw new Error("Pilih file KMZ terlebih dahulu.");
      }

      const result = await runStep(context.state.sessionId, 2);
      context.logger.setMessage(result.message || "Step 2 selesai.");
      if (result.hpdb_file) {
        context.state.basicFileName = result.hpdb_file.split(/[\\/]/).pop();
      }
      return result;
    },
  };
}