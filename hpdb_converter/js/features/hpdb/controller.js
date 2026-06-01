import { buildDownloadUrl, createSession, resetSession } from "../../modules/api.js";
import { getFirstSelectedFile, openFilePicker } from "../../modules/file.js";
import { setStatus } from "../../modules/state.js";

function setIdleStatus(state) {
  setStatus(state, "Siap menerima file KMZ.", "Belum ada sesi aktif.", "idle", 0);
}

function setRunningStatus(state, title, detail, progressValue) {
  setStatus(state, title, detail, "running", progressValue);
}

function setSuccessStatus(state, title, detail, progressValue) {
  setStatus(state, title, detail, "success", progressValue);
}

function setErrorStatus(state, detail) {
  setStatus(state, "Proses gagal.", detail, "error", state.progressValue || 0);
}

const STEP_CONFIGS = [
  {
    button: "btnStep1",
    run: (workflow) => workflow.steps.step1.run(),
    startText: "Menjalankan Step 1.",
    runningDetail: "Parsing KMZ ke workbook konversi.",
    runningProgress: 35,
    successText: "Step 1 selesai.",
    successDetail: "Workbook konversi siap.",
    successProgress: 50,
    failureLabel: "Step 1 gagal.",
  },
  {
    button: "btnStep2",
    run: (workflow) => workflow.steps.step2.run(),
    startText: "Menjalankan Step 2.",
    runningDetail: "Mengisi template HPDB dasar.",
    runningProgress: 65,
    successText: "Step 2 selesai.",
    successDetail: "Workbook HPDB dasar siap.",
    successProgress: 75,
    failureLabel: "Step 2 gagal.",
  },
  {
    button: "btnStep3",
    run: (workflow) => workflow.steps.step3.run(),
    startText: "Menjalankan Step 3.",
    runningDetail: "Sinkronisasi kolom A-K final.",
    runningProgress: 90,
    successText: "Step 3 selesai.",
    successDetail: "HPDB final siap diunduh.",
    successProgress: 100,
    failureLabel: "Step 3 gagal.",
  },
];

function bindStepButton(elements, workflow, syncView, config, handleStep) {
  const button = elements[config.button];
  if (!button) {
    return;
  }

  button.addEventListener("click", () => {
    handleStep(
      () => config.run(workflow),
      config.startText,
      config.runningDetail,
      config.runningProgress,
      config.successText,
      config.successDetail,
      config.successProgress,
      config.failureLabel,
      syncView
    );
  });
}

export function createHpdbController({ state, elements, workflow, logger, syncView }) {
  async function handleUpload(event) {
    const file = getFirstSelectedFile(event);
    if (!file) {
      workflow.reset();
      elements.fileInput.value = "";
      setIdleStatus(state);
      syncView();
      return;
    }

    workflow.beginBusy();
    setRunningStatus(state, "Mengunggah file KMZ.", `Memproses ${file.name}.`, 10);
    logger.setMessage(`Uploading: ${file.name}`);
    syncView();

    try {
      const result = await createSession(file);
      workflow.selectSourceFile(file, result);
      workflow.hydrateSession(result);
      logger.setFromLines(result.logs || [`File siap: ${file.name}`]);
      setSuccessStatus(state, "File siap diproses.", `Sesi aktif: ${result.session_id}.`, 25);
    } catch (error) {
      workflow.reset();
      elements.fileInput.value = "";
      const message = error instanceof Error ? error.message : "Gagal upload file.";
      logger.setMessage(message);
      setErrorStatus(state, message);
    } finally {
      workflow.endBusy();
      syncView();
    }
  }

  async function handleStep(runStep, startText, runningDetail, runningProgress, successText, successDetail, successProgress, failureLabel, syncViewFn = syncView) {
    workflow.beginBusy();
    setRunningStatus(state, startText, runningDetail, runningProgress);
    logger.setMessage(startText);
    syncViewFn();

    try {
      const result = await runStep();
      workflow.hydrateSession(result);
      logger.setMessage(result.message || successText);
      setSuccessStatus(state, successText, result.message || successDetail, successProgress);
    } catch (error) {
      const message = error instanceof Error ? error.message : failureLabel;
      logger.setMessage(message);
      setErrorStatus(state, message);
    } finally {
      workflow.endBusy();
      syncViewFn();
    }
  }

  async function handleReset() {
    workflow.beginBusy();
    syncView();

    try {
      await resetSession(state.sessionId);
    } catch {
      // UI tetap di-reset walaupun backend reset gagal.
    } finally {
      workflow.reset();
      elements.fileInput.value = "";
      setIdleStatus(state);
      workflow.endBusy();
      syncView();
    }
  }

  function bind() {
    setIdleStatus(state);

    elements.btnBrowse.addEventListener("click", () => {
      openFilePicker(elements.fileInput);
    });

    elements.fileInput.addEventListener("change", handleUpload);

    STEP_CONFIGS.forEach((config) => bindStepButton(elements, workflow, syncView, config, handleStep));

    elements.btnDownloadStep1.addEventListener("click", () => {
      if (!state.sessionId || !state.step1Done) {
        return;
      }
      window.location.href = buildDownloadUrl(state.sessionId, "step1");
    });

    elements.btnDownloadFinal.addEventListener("click", () => {
      if (!state.sessionId || !state.step3Done) {
        return;
      }
      window.location.href = buildDownloadUrl(state.sessionId, "final");
    });

    elements.resetLog.addEventListener("click", handleReset);
  }

  return {
    bind,
  };
}