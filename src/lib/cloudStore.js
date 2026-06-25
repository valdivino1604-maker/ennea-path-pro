import { calculateResults } from "@/lib/testEngine";

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

function completePlan(data = {}) {
  return { ...data, plan: "premium" };
}

function parseJsonObject(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function withRecalculatedResult(result) {
  if (!result || !result.answers) return result;

  const answers = parseJsonObject(result.answers);
  if (!answers || Object.keys(answers).length === 0) return { ...result, plan: "premium" };

  const recalculated = calculateResults(answers);

  return {
    ...result,
    plan: "premium",
    scores: JSON.stringify(recalculated),
    dominant_type: recalculated.dominantType,
    dominant_type_name: recalculated.dominantTypeName,
    wing: recalculated.wing,
    wing_name: recalculated.wingName,
    confidence_level: recalculated.confidence,
    recalculated: true,
    result_note: recalculated.resultNote
  };
}

export async function createParticipant(data) {
  return apiRequest("/api/participants", {
    method: "POST",
    body: JSON.stringify(completePlan(data))
  });
}

export async function getParticipant(id) {
  const participant = await apiRequest(`/api/participants/${encodeURIComponent(id)}`);
  return participant ? { ...participant, plan: "premium" } : participant;
}

export async function filterParticipants(filter = {}, sort, limit) {
  const participants = await apiRequest(`/api/participants${queryString(filter, sort, limit)}`);
  return Array.isArray(participants) ? participants.map((item) => ({ ...item, plan: "premium" })) : participants;
}

export async function updateParticipant(id, patch) {
  return apiRequest(`/api/participants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(completePlan(patch))
  });
}

export async function deleteParticipant(id) {
  return apiRequest(`/api/participants/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export async function createResult(data) {
  const result = await apiRequest("/api/results", {
    method: "POST",
    body: JSON.stringify(completePlan(data))
  });
  return withRecalculatedResult(result);
}

export async function getResult(id) {
  const result = await apiRequest(`/api/results/${encodeURIComponent(id)}`);
  return withRecalculatedResult(result);
}

export async function filterResults(filter = {}, sort, limit) {
  const results = await apiRequest(`/api/results${queryString(filter, sort, limit)}`);
  return Array.isArray(results) ? results.map(withRecalculatedResult) : results;
}

export async function updateResult(id, patch) {
  const result = await apiRequest(`/api/results/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(completePlan(patch))
  });
  return withRecalculatedResult(result);
}

export async function deleteResult(id) {
  return apiRequest(`/api/results/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export async function filterPerformanceReviews(filter = {}, sort, limit) {
  return apiRequest(`/api/performance-reviews${queryString(filter, sort, limit)}`);
}

export async function getPerformanceReview(id) {
  return apiRequest(`/api/performance-reviews/${encodeURIComponent(id)}`);
}

export async function upsertPerformanceReview(data) {
  return apiRequest("/api/performance-reviews", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function deletePerformanceReview(id) {
  return apiRequest(`/api/performance-reviews/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
