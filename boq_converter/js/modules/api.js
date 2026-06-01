const API_BASE = "/api/boq";

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
  return `${API_BASE}/session/${sessionId}/download/${kind}`;
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

export async function processSession(sessionId, mode) {
  const formData = new FormData();
  formData.append("mode", mode);

  const response = await fetch(`${API_BASE}/session/${sessionId}/process`, {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(response);
}

export async function resetSession(sessionId) {
  if (!sessionId) {
    return { ok: true };
  }

  const response = await fetch(`${API_BASE}/session/${sessionId}/reset`, {
    method: "POST",
  });

  return readJsonResponse(response);
}
