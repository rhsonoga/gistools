export function render(state, elements) {
  if (elements.kmzPath) {
    elements.kmzPath.value = state.sourceFileName || "";
  }

  if (elements.logArea) {
    const lines = Array.isArray(state.logs) ? state.logs : [];
    elements.logArea.textContent = lines.length ? lines.map((line) => `> ${line}`).join("\n") : "System Ready. Pilih file KMZ.";
    elements.logArea.scrollTop = elements.logArea.scrollHeight;
  }

  if (elements.statusTitle) {
    elements.statusTitle.textContent = state.statusText;
  }

  if (elements.statusSubtitle) {
    elements.statusSubtitle.textContent = state.statusDetail;
  }

  if (elements.statusBadge) {
    elements.statusBadge.textContent = state.statusBadge;
  }

  if (elements.statusFill) {
    elements.statusFill.style.width = `${state.progressValue || 0}%`;
  }

  if (elements.btnCluster) {
    elements.btnCluster.disabled = state.busy || !state.sessionId;
  }

  if (elements.btnFeeder) {
    elements.btnFeeder.disabled = state.busy || !state.sessionId;
  }

  if (elements.btnDlMid) {
    elements.btnDlMid.disabled = !state.processed;
  }

  if (elements.btnDlFinal) {
    elements.btnDlFinal.disabled = !state.processed;
  }
}
