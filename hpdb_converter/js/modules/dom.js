export function getElements(root = document) {
  return {
    btnBrowse: root.getElementById("btnBrowse"),
    fileInput: root.getElementById("fileInput"),
    sourcePath: root.getElementById("sourcePath"),
    basicFile: root.getElementById("basicFile"),
    logBox: root.getElementById("logBox"),
    statusText: root.getElementById("statusText"),
    statusDetail: root.getElementById("statusDetail"),
    statusBarFill: root.getElementById("statusBarFill"),
    statusBadge: root.getElementById("statusBadge"),
    resetLog: root.getElementById("resetLog"),
    btnStep1: root.getElementById("btnStep1"),
    btnStep2: root.getElementById("btnStep2"),
    btnStep3: root.getElementById("btnStep3"),
    btnDownloadStep1: root.getElementById("btnDownloadStep1"),
    btnDownloadFinal: root.getElementById("btnDownloadFinal"),
  };
}