import { buildDownloadUrl } from "./api.js";
import { createStep1 } from "../features/hpdb/steps/step1.js";
import { createStep2 } from "../features/hpdb/steps/step2.js";
import { createStep3 } from "../features/hpdb/steps/step3.js";
import { resetState, setBusy, setFile, setSelectedFile, setSession, setStepFlags } from "./state.js";

function resolveSessionId(payload = {}) {
  return payload.session_id || payload.sessionId || "";
}

function applySessionFlags(state, payload = {}) {
  const sessionId = resolveSessionId(payload);
  setStepFlags(state, {
    step1_done: payload.step1_done,
    step2_done: payload.step2_done,
    step3_done: payload.step3_done,
    downloadStep1Url: sessionId ? buildDownloadUrl(sessionId, "step1") : "",
    downloadFinalUrl: sessionId ? buildDownloadUrl(sessionId, "final") : "",
  });
}

export function createWorkflow(state, logger) {
  const context = { state, logger };
  const step1 = createStep1(context);
  const step2 = createStep2(context);
  const step3 = createStep3(context);

  return {
    steps: { step1, step2, step3 },
    selectSourceFile(file, sessionData = {}) {
      setSelectedFile(state, file ? file.name : "");
      setFile(state, file || null);
      const sessionId = resolveSessionId(sessionData);
      setSession(state, sessionId);
      applySessionFlags(state, sessionData);
      logger.setMessage(file ? `Selected: ${file.name}` : "");
    },
    hydrateSession(payload = {}) {
      const sessionId = resolveSessionId(payload);
      if (sessionId) {
        setSession(state, sessionId);
      }
      applySessionFlags(state, payload);
      if (payload.source_file_name) {
        state.sourceFileName = payload.source_file_name;
        state.basicFileName = payload.step2_done && payload.hpdb_file
          ? payload.hpdb_file.split(/[\\/]/).pop()
          : payload.source_file_name;
      }
      if (Array.isArray(payload.logs) && payload.logs.length) {
        logger.setFromLines(payload.logs);
      }
    },
    beginBusy() {
      setBusy(state, true);
    },
    endBusy() {
      setBusy(state, false);
    },
    reset() {
      resetState(state);
    },
  };
}