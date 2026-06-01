import { getElements } from "./modules/dom.js";
import { createLogger } from "./modules/logger.js";
import { createState } from "./modules/state.js";
import { createBoqController } from "./features/boq/controller.js";
import { render } from "./modules/ui.js";

function bootstrap() {
  const elements = getElements();

  if (
    !elements.btnBrowse ||
    !elements.fileInput ||
    !elements.kmzPath ||
    !elements.logArea ||
    !elements.btnReset ||
    !elements.btnCluster ||
    !elements.btnFeeder ||
    !elements.btnDlMid ||
    !elements.btnDlFinal
  ) {
    throw new Error("BOQ UI elements are incomplete.");
  }

  const state = createState();
  const logger = createLogger(state);

  const syncView = () => render(state, elements);
  const controller = createBoqController({ state, elements, logger, syncView });

  controller.bind();
  syncView();
}

bootstrap();
