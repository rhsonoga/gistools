export function getElements(root = document) {
  return {
    btnBrowse: root.getElementById("btnBrowse"),
    fileInput: root.getElementById("kmzFile"),
    kmzPath: root.getElementById("kmzPath"),
    logArea: root.getElementById("logArea"),
    btnReset: root.getElementById("btnReset"),
    btnCluster: root.getElementById("btnCluster"),
    btnFeeder: root.getElementById("btnFeeder"),
    btnDlMid: root.getElementById("btnDlMid"),
    btnDlFinal: root.getElementById("btnDlFinal"),
    statusTitle: root.querySelector(".status-title"),
    statusSubtitle: root.querySelector(".status-subtitle"),
    statusBadge: root.querySelector(".status-badge"),
    statusFill: root.querySelector(".status-fill"),
  };
}
