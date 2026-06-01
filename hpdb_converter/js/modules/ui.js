export function render(state, elements) {
  const statusToneClass = `status-badge tone-${state.statusTone || "idle"}`;
  const statusLabels = {
    running: "RUNNING",
    success: "READY",
    error: "ERROR",
    idle: "IDLE",
  };

  if (elements.sourcePath) {
    elements.sourcePath.value = state.sourceFileName;
  }

  if (elements.basicFile) {
    elements.basicFile.value = state.basicFileName;
  }

  if (elements.logBox) {
    elements.logBox.textContent = state.logMessage;
  }

  if (elements.statusText) {
    elements.statusText.textContent = state.statusText;
  }

  if (elements.statusDetail) {
    elements.statusDetail.textContent = state.statusDetail;
  }

  if (elements.statusBarFill) {
    elements.statusBarFill.style.width = `${state.progressValue || 0}%`;
  }

  if (elements.statusBadge) {
    elements.statusBadge.className = statusToneClass;
    elements.statusBadge.textContent = statusLabels[state.statusTone] || statusLabels.idle;
  }

  if (elements.btnStep1) {
    elements.btnStep1.disabled = state.busy || !state.sourceFileName;
  }

  if (elements.btnStep2) {
    elements.btnStep2.disabled = state.busy || !state.step1Done;
  }

  if (elements.btnStep3) {
    elements.btnStep3.disabled = state.busy || !state.step2Done;
  }

  if (elements.btnDownloadStep1) {
    elements.btnDownloadStep1.disabled = state.busy || !state.step1Done || !state.sessionId;
  }

  if (elements.btnDownloadFinal) {
    elements.btnDownloadFinal.disabled = state.busy || !state.step3Done || !state.sessionId;
  }
}