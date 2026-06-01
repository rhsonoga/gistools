const API_BASE = "/api";

function buildSessionUrl(sessionId, pathSuffix = "") {
  return `${API_BASE}/session/${sessionId}${pathSuffix}`;
}

async function readJsonResponse(response) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export function buildDownloadUrl(sessionId, kind) {
  return buildSessionUrl(sessionId, `/download/${kind}`);
}

export async function createSession(file) {
  const formData = new FormData();
  formData.append("kmz", file);

  const response = await fetch(`${API_BASE}/session`, {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(response);
}

export async function runStep(sessionId, stepNumber) {
  const response = await fetch(buildSessionUrl(sessionId, `/step/${stepNumber}`), {
    method: "POST",
  });

  return readJsonResponse(response);
}

export async function resetSession(sessionId) {
  if (!sessionId) {
    return { ok: true };
  }

  const response = await fetch(buildSessionUrl(sessionId, "/reset"), {
    method: "POST",
  });

  return readJsonResponse(response);
}
