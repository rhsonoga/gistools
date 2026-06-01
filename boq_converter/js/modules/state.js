export function createState() {
  return {
    sessionId: "",
    sourceFile: null,
    sourceFileName: "",
    logs: ["System Ready. Pilih file KMZ."],
    statusText: "Siap menerima file KMZ.",
    statusDetail: "Belum ada sesi aktif.",
    statusBadge: "IDLE",
    progressValue: 0,
    busy: false,
    processed: false,
    canDownloadConverted: false,
    canDownloadFinal: false,
  };
}

export function setSession(state, sessionId) {
  state.sessionId = sessionId || "";
}

export function setFile(state, file) {
  state.sourceFile = file || null;
}

export function setSelectedFile(state, fileName) {
  state.sourceFileName = fileName || "";
}

export function setBusy(state, busy) {
  state.busy = Boolean(busy);
}

export function setStatus(state, text, detail = "", badge = "IDLE", progressValue = 0) {
  state.statusText = text;
  state.statusDetail = detail;
  state.statusBadge = badge;
  state.progressValue = Math.max(0, Math.min(100, progressValue));
}

export function setLogs(state, lines) {
  state.logs = Array.isArray(lines) ? lines.map((line) => String(line)) : [];
}

export function appendLog(state, line) {
  state.logs = [...state.logs, String(line)];
}

export function resetState(state) {
  state.sessionId = "";
  state.sourceFile = null;
  state.sourceFileName = "";
  state.logs = ["System Ready. Pilih file KMZ."];
  state.statusText = "Siap menerima file KMZ.";
  state.statusDetail = "Belum ada sesi aktif.";
  state.statusBadge = "IDLE";
  state.progressValue = 0;
  state.busy = false;
  state.processed = false;
  state.canDownloadConverted = false;
  state.canDownloadFinal = false;
}
