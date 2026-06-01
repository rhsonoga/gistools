import { getElements } from "./modules/dom.js";
import { createLogger } from "./modules/logger.js";
import { createState } from "./modules/state.js";
import { createWorkflow } from "./modules/workflow.js";
import { render } from "./modules/ui.js";
import { createHpdbController } from "./features/hpdb/controller.js";

function bootstrap() {
  const elements = getElements();

  if (
    !elements.btnBrowse ||
    !elements.fileInput ||
    !elements.sourcePath ||
    !elements.basicFile ||
    !elements.logBox ||
    !elements.resetLog ||
    !elements.btnStep1 ||
    !elements.btnStep2 ||
    !elements.btnStep3 ||
    !elements.btnDownloadStep1 ||
    !elements.btnDownloadFinal
  ) {
    throw new Error("HPDB UI elements are incomplete.");
  }

  const state = createState();
  const logger = createLogger(state);
  const workflow = createWorkflow(state, logger);

  const syncView = () => {
    render(state, elements);
  };

  const controller = createHpdbController({ state, elements, workflow, logger, syncView });

  controller.bind();

  syncView();
}

bootstrap();