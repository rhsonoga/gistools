export function createState() {
  return {
    sessionId: "",
    sourceFile: null,
    sourceFileName: "",
    basicFileName: "",
    logMessage: "",
    statusText: "Siap menerima file KMZ.",
    statusDetail: "Belum ada sesi aktif.",
    statusTone: "idle",
    progressValue: 0,
    busy: false,
    step1Done: false,
    step2Done: false,
    step3Done: false,
  };
}

export function setSelectedFile(state, fileName) {
  state.sourceFileName = fileName;
  state.basicFileName = fileName;
  state.logMessage = fileName ? `Selected: ${fileName}` : "";
}

export function setSession(state, sessionId) {
  state.sessionId = sessionId;
}

export function setFile(state, file) {
  state.sourceFile = file;
}

export function setBusy(state, busy) {
  state.busy = busy;
}

export function setStatus(state, text, detail = "", tone = "idle", progressValue = 0) {
  state.statusText = text;
  state.statusDetail = detail;
  state.statusTone = tone;
  state.progressValue = Math.max(0, Math.min(100, progressValue));
}

export function setStepFlags(state, payload = {}) {
  state.step1Done = Boolean(payload.step1_done);
  state.step2Done = Boolean(payload.step2_done);
  state.step3Done = Boolean(payload.step3_done);
}

export function resetState(state) {
  state.sessionId = "";
  state.sourceFile = null;
  state.sourceFileName = "";
  state.basicFileName = "";
  state.logMessage = "";
  state.statusText = "Siap menerima file KMZ.";
  state.statusDetail = "Belum ada sesi aktif.";
  state.statusTone = "idle";
  state.progressValue = 0;
  state.busy = false;
  state.step1Done = false;
  state.step2Done = false;
  state.step3Done = false;
}

export function clearLog(state) {
  state.logMessage = "";
}