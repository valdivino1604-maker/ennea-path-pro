import * as localStore from "@/lib/localStore";

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Nao foi possivel salvar no banco.");
    error.code = data.code;
    error.detail = data.detail;
    throw error;
  }

  return data;
}

function queryString(filter = {}, sort, limit) {
  const params = new URLSearchParams();
  Object.entries(filter || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, value);
  });
  if (sort) params.set("sort", sort);
  if (limit) params.set("limit", String(limit));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function createParticipant(data) {
  return apiRequest("/api/participants", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getParticipant(id) {
  return apiRequest(`/api/participants/${encodeURIComponent(id)}`);
}

export async function filterParticipants(filter = {}, sort, limit) {
  return apiRequest(`/api/participants${queryString(filter, sort, limit)}`);
}

export async function updateParticipant(id, patch) {
  return apiRequest(`/api/participants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export async function createResult(data) {
  return apiRequest("/api/results", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getResult(id) {
  return apiRequest(`/api/results/${encodeURIComponent(id)}`);
}

export async function filterResults(filter = {}, sort, limit) {
  return apiRequest(`/api/results${queryString(filter, sort, limit)}`);
}

export async function updateResult(id, patch) {
  return localStore.updateResult(id, patch);
}
