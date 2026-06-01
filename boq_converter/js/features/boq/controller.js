import { buildDownloadUrl, createSession, processSession, resetSession } from "../../modules/api.js";
import { getFirstSelectedFile, openFilePicker } from "../../modules/file.js";
import {
  appendLog,
  resetState,
  setBusy,
  setFile,
  setLogs,
  setSelectedFile,
  setSession,
  setStatus,
} from "../../modules/state.js";

function setIdleStatus(state) {
  setStatus(state, "Siap menerima file KMZ.", "Belum ada sesi aktif.", "IDLE", 0);
}

function setUploadingStatus(state, fileName) {
  setStatus(state, "Mengunggah file...", fileName ? `Mohon tunggu: ${fileName}.` : "Mohon tunggu.", "UPLOAD", 10);
}

function setReadyStatus(state, payload) {
  setStatus(state, "File siap diproses.", payload.source_file_name || "Sesi aktif.", "READY", 35);
}

function setRunningStatus(state, mode) {
  const progress = mode === "CLUSTER" ? 55 : 75;
  setStatus(state, `Sedang memproses ${mode}...`, "Mohon tunggu.", "RUN", progress);
}

function setDoneStatus(state, payload) {
  setStatus(state, "Proses selesai.", payload?.source_file_name || "Sesi aktif.", "DONE", 100);
}

function setErrorStatus(state, detail) {
  setStatus(state, "Gagal memproses BOQ.", detail || "Cek log untuk detail.", "ERROR", 0);
}

export function createBoqController({ state, elements, logger, syncView }) {
  async function handleUpload(event) {
    const file = getFirstSelectedFile(event);
    if (!file) {
      resetState(state);
      if (elements.fileInput) {
        elements.fileInput.value = "";
      }
      syncView();
      return;
    }

    setBusy(state, true);
    setUploadingStatus(state, file.name);
    setFile(state, file);
    setSelectedFile(state, file.name);
    setLogs(state, [`Mengunggah file: ${file.name}`]);
    syncView();

    try {
      const payload = await createSession(file);
      setSession(state, payload.session_id);
      setSelectedFile(state, payload.source_file_name || file.name);
      setReadyStatus(state, payload);
      logger.setFromLines(payload.logs || [`File siap: ${file.name}`]);
    } catch (error) {
      resetState(state);
      if (elements.fileInput) {
        elements.fileInput.value = "";
      }
      const message = error instanceof Error ? error.message : "Gagal upload file.";
      logger.setMessage(message);
      setErrorStatus(state, message);
    } finally {
      setBusy(state, false);
      syncView();
    }
  }

  async function handleProcess(mode) {
    if (!state.sessionId) {
      alert("Harap pilih file KMZ terlebih dahulu!");
      return;
    }

    if (state.busy) {
      return;
    }

    setBusy(state, true);
    setRunningStatus(state, mode);
    logger.append(`Mode dipilih: ${mode}`);
    logger.append("Memulai parsing KMZ...");
    syncView();

    try {
      const payload = await processSession(state.sessionId, mode);
      logger.setFromLines(payload.logs || []);
      setDoneStatus(state, payload);
      setSession(state, payload.session_id || state.sessionId);
      state.processed = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Proses BOQ gagal.";
      logger.setMessage(message);
      setErrorStatus(state, message);
      state.processed = false;
    } finally {
      setBusy(state, false);
      syncView();
    }
  }

  function handleDownload(kind) {
    if (!state.sessionId || !state.processed) {
      alert("Jalankan proses terlebih dahulu!");
      return;
    }

    window.location.href = buildDownloadUrl(state.sessionId, kind);
  }

  async function handleReset() {
    if (!state.sessionId) {
      resetState(state);
      syncView();
      return;
    }

    setBusy(state, true);
    syncView();

    try {
      await resetSession(state.sessionId);
    } catch {
      // Reset UI tetap berjalan walau backend reset gagal.
    } finally {
      resetState(state);
      if (elements.fileInput) {
        elements.fileInput.value = "";
      }
      setIdleStatus(state);
      setBusy(state, false);
      syncView();
    }
  }

  function handleDropFile(event) {
    event.preventDefault();
    const file = getFirstSelectedFile(event);
    if (!file) {
      return;
    }

    if (!/\.(kmz|zip|kml)$/i.test(file.name)) {
      return;
    }

    handleUpload({ target: { files: [file] } });
  }

  function bind() {
    setIdleStatus(state);

    elements.btnBrowse.addEventListener("click", () => {
      openFilePicker(elements.fileInput);
    });

    elements.fileInput.addEventListener("change", handleUpload);

    elements.btnCluster.addEventListener("click", () => handleProcess("CLUSTER"));
    elements.btnFeeder.addEventListener("click", () => handleProcess("FEEDER"));
    elements.btnDlMid.addEventListener("click", () => handleDownload("converted"));
    elements.btnDlFinal.addEventListener("click", () => handleDownload("final"));
    elements.btnReset.addEventListener("click", handleReset);

    document.addEventListener("dragover", (event) => event.preventDefault());
    document.addEventListener("drop", handleDropFile);
  }

  return {
    bind,
  };
}
