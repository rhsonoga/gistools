(function () {
  var DEFAULT_TOL = 5.0;
  var DEFAULT_CONFIG = {
    line_names: [
      "CABLE LINE A",
      "CABLE LINE B",
      "CABLE LINE C",
      "CABLE LINE D",
      "CABLE LINE E",
      "CABLE LINE F",
      "CABLE LINE G",
      "CABLE LINE H",
      "CABLE LINE I",
      "CABLE LINE J",
      "SUBFEEDER CABLE",
      "HUBFEEDER CABLE",
      "MAINFEEDER CABLE",
    ],
    cable_types: ["FO 24C/2T", "FO 36C/3T", "FO 48C/4T", "FO 96C/8T", "FO 144C/12T", "FO 288C/24T"],
    cable_categories: ["AE - Aerial", "UG - Underground", "SUB - Submarine"],
  };

  var el = {
    lineName: document.getElementById("lineName"),
    oltCode: document.getElementById("oltCode"),
    cableType: document.getElementById("cableType"),
    category: document.getElementById("category"),
    route: document.getElementById("route"),
    slackFdt: document.getElementById("slackFdt"),
    slackFat: document.getElementById("slackFat"),
    fdtCode: document.getElementById("fdtCode"),
    segment: document.getElementById("segment"),
    generateBtn: document.getElementById("generateBtn"),
    clearBtn: document.getElementById("clearBtn"),
    output: document.getElementById("output"),
  };

  function hasValue(v) {
    return (v || "").toString().trim().length > 0;
  }

  function isMainOrHub(mode) {
    return mode.indexOf("MAINFEEDER") !== -1 || mode.indexOf("HUBFEEDER") !== -1;
  }

  function isSubfeeder(mode) {
    return mode.indexOf("SUBFEEDER") !== -1;
  }

  function isLineABCD(mode) {
    return mode.indexOf("CABLE LINE ") !== -1;
  }

  function setDisabled(input, disabled) {
    input.disabled = !!disabled;
  }

  function updateUiState() {
    var mode = (el.lineName.value || "").toString();

    // Default: enabled
    setDisabled(el.slackFdt, false);
    setDisabled(el.slackFat, false);
    setDisabled(el.oltCode, false);
    setDisabled(el.fdtCode, false);
    setDisabled(el.segment, false);

    if (!mode) {
      validateInputs();
      return;
    }

    if (isMainOrHub(mode)) {
      setDisabled(el.slackFdt, true);
      setDisabled(el.fdtCode, true);
      el.slackFdt.value = "0";
      el.fdtCode.value = "";
    } else if (isSubfeeder(mode)) {
      setDisabled(el.segment, true);
      el.segment.value = "";
    } else if (isLineABCD(mode)) {
      setDisabled(el.oltCode, true);
      setDisabled(el.segment, true);
      el.oltCode.value = "";
      el.segment.value = "";
    }

    validateInputs();
  }

  function toNonNegativeFloat(raw) {
    var n = parseFloat((raw || "").toString());
    if (Number.isNaN(n) || n < 0) return null;
    return n;
  }

  function toNonNegativeInt(raw) {
    // tkinter version uses int(); here accept numeric and truncate toward zero.
    var n = parseFloat((raw || "").toString());
    if (Number.isNaN(n) || n < 0) return null;
    return Math.trunc(n);
  }

  function validateInputs() {
    var mode = (el.lineName.value || "").toString();
    if (!mode) {
      el.generateBtn.disabled = true;
      return;
    }

    // Required (always)
    var reqOk = true;
    reqOk = reqOk && hasValue(el.route.value);
    reqOk = reqOk && hasValue(el.slackFat.value);
    reqOk = reqOk && hasValue(el.cableType.value);

    if (isSubfeeder(mode)) {
      reqOk = reqOk && hasValue(el.slackFdt.value);
      reqOk = reqOk && hasValue(el.fdtCode.value);
      reqOk = reqOk && hasValue(el.oltCode.value);
    } else if (isMainOrHub(mode)) {
      reqOk = reqOk && hasValue(el.oltCode.value);
      reqOk = reqOk && hasValue(el.segment.value);
    } else if (mode.indexOf("LINE") !== -1) {
      reqOk = reqOk && hasValue(el.slackFdt.value);
      reqOk = reqOk && hasValue(el.fdtCode.value);
    }

    if (!reqOk) {
      el.generateBtn.disabled = true;
      return;
    }

    // Numeric parse + non-negative constraints
    var r = toNonNegativeFloat(el.route.value);
    var fat = toNonNegativeInt(el.slackFat.value);
    if (r === null || fat === null) {
      el.generateBtn.disabled = true;
      return;
    }

    if (!el.slackFdt.disabled) {
      var fdt = toNonNegativeInt(el.slackFdt.value);
      if (fdt === null) {
        el.generateBtn.disabled = true;
        return;
      }
    }

    el.generateBtn.disabled = false;
  }

  function buildReport() {
    var mode = (el.lineName.value || "").toString();

    var r = toNonNegativeFloat(el.route.value);
    var fdt = toNonNegativeInt(el.slackFdt.disabled ? "0" : el.slackFdt.value);
    var fat = toNonNegativeInt(el.slackFat.value);
    var tol = DEFAULT_TOL;

    if (r === null || fdt === null || fat === null) {
      throw new Error("Input not valid");
    }

    var totalUnit = fdt + fat;
    var slackM = totalUnit * 20;
    var base = r + slackM;
    function pyRound(x) {
      // Python 3 round(): ties (.5) go to even
      var eps = 1e-9;
      var fl = Math.floor(x);
      var frac = x - fl;
      if (frac > 0.5 + eps) return fl + 1;
      if (frac < 0.5 - eps) return fl;
      return (fl % 2 === 0) ? fl : fl + 1;
    }

    var tolLength = base + (base * (tol / 100));
    var finalLen = pyRound(tolLength);

    function fmt(n) {
      if (Number.isNaN(n) || n === null || n === undefined) return "";
      var rounded = Math.round(n * 1000) / 1000;
      var s = String(rounded);
      if (s.indexOf("e") !== -1 || s.indexOf("E") !== -1) {
        s = rounded.toFixed(3);
      }
      if (s.indexOf(".") !== -1) {
        s = s.replace(/0+$/, "").replace(/\.$/, "");
      }
      return s;
    }

    var cat = (el.category.value || "").toString();
    var catShort = cat ? cat.split(" - ")[0] : "";
    var olt = (el.oltCode.value || "").toString().trim();
    var seg = (el.segment.value || "").toString();
    var code = (el.fdtCode.value || "").toString();
    var cableType = (el.cableType.value || "").toString();

    var report =
      "Total Route = " + fmt(r) + " M\n" +
      "Total Slack = " + totalUnit + " unit (" + fdt + " slack FDT & " + fat + " slack FAT/SF/MF) @20M\n" +
      "Toleransi = " + Math.trunc(tol) + "%\n" +
      "Total Length Cable = " + fmt(r) + "+" + slackM + " = " + fmt(base) + "M + (" + fmt(base) + " x " + Math.trunc(tol) + "%) = " + finalLen + " M\n" +
      "-".repeat(75) + "\n";

    if (mode.indexOf("SUBFEEDER") !== -1) {
      report += olt + " - " + code + " - " + mode + " (" + cableType + ") - " + catShort + " - " + finalLen + " M";
    } else if (mode.indexOf("LINE") !== -1) {
      report += code + " - " + mode + " (" + cableType + ") - " + catShort + " - " + finalLen + " M";
    } else {
      report += olt + " - " + mode + " " + seg + " (" + cableType + ") - " + catShort + " - " + finalLen + " M";
    }

    return report;
  }

  function clearCalculatedOnly() {
    el.output.value = "";
  }

  function wireEvents() {
    el.lineName.addEventListener("change", updateUiState);
    el.cableType.addEventListener("change", validateInputs);
    el.category.addEventListener("change", validateInputs);

    [el.route, el.slackFdt, el.slackFat, el.oltCode, el.fdtCode, el.segment].forEach(function (input) {
      input.addEventListener("input", validateInputs);
    });

    el.generateBtn.addEventListener("click", function () {
      try {
        // Final validation gate
        validateInputs();
        if (el.generateBtn.disabled) return;
        el.output.value = buildReport();
      } catch (e) {
        window.alert("Input not valid: " + (e && e.message ? e.message : String(e)));
      }
    });

    el.clearBtn.addEventListener("click", clearCalculatedOnly);
  }

  function fillSelect(selectEl, values) {
    selectEl.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "";
    selectEl.appendChild(placeholder);

    (values || []).forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });

    selectEl.value = "";
  }

  async function loadConfig() {
    try {
      async function tryFetchJson(path) {
        var resp = await fetch(path, { cache: "no-store" });
        if (!resp.ok) return null;
        return await resp.json();
      }

      // Prefer user-edited filename.
      var data = await tryFetchJson("./cable_config.json");
      if (data) return data;

      // Backward-compatible fallback.
      data = await tryFetchJson("./config.json");
      if (data) return data;

      throw new Error("No config file found");
    } catch (_) {
      // Fallback for file:// mode or if fetch is blocked.
      return DEFAULT_CONFIG;
    }
  }

  window.addEventListener("DOMContentLoaded", async function () {
    var cfg = await loadConfig();
    cfg = cfg || {};
    fillSelect(el.lineName, cfg.line_names || DEFAULT_CONFIG.line_names);
    fillSelect(el.cableType, cfg.cable_types || DEFAULT_CONFIG.cable_types);
    fillSelect(el.category, cfg.cable_categories || DEFAULT_CONFIG.cable_categories);

    wireEvents();
    updateUiState();
  });
})();
