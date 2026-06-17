const PARTICIPANTS_KEY = "ennea_path_participants";
const RESULTS_KEY = "ennea_path_results";

const isBrowser = () => typeof window !== "undefined" && window.localStorage;

function readList(key) {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(list));
}

function makeId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function matchesFilter(item, filter = {}) {
  return Object.entries(filter).every(([key, value]) => item[key] === value);
}

function applySortAndLimit(items, sort, limit) {
  let sorted = [...items];
  if (sort) {
    const desc = sort.startsWith("-");
    const key = desc ? sort.slice(1) : sort;
    sorted.sort((a, b) => {
      const av = a[key] || "";
      const bv = b[key] || "";
      return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function createParticipant(data) {
  const now = new Date().toISOString();
  const participant = {
    ...data,
    id: makeId("participant"),
    answers: "{}",
    current_index: 0,
    created_date: now,
    updated_date: now
  };
  const participants = readList(PARTICIPANTS_KEY);
  participants.push(participant);
  writeList(PARTICIPANTS_KEY, participants);
  return participant;
}

export function getParticipant(id) {
  return readList(PARTICIPANTS_KEY).find((participant) => participant.id === id) || null;
}

export function filterParticipants(filter = {}, sort, limit) {
  const participants = readList(PARTICIPANTS_KEY).filter((participant) => matchesFilter(participant, filter));
  return applySortAndLimit(participants, sort, limit);
}

export function updateParticipant(id, patch) {
  const participants = readList(PARTICIPANTS_KEY);
  let updated = null;
  const next = participants.map((participant) => {
    if (participant.id !== id) return participant;
    updated = { ...participant, ...patch, updated_date: new Date().toISOString() };
    return updated;
  });
  writeList(PARTICIPANTS_KEY, next);
  return updated;
}

export function createResult(data) {
  const now = new Date().toISOString();
  const result = {
    ...data,
    id: makeId("result"),
    created_date: now,
    updated_date: now
  };
  const results = readList(RESULTS_KEY);
  results.push(result);
  writeList(RESULTS_KEY, results);
  return result;
}

export function getResult(id) {
  return readList(RESULTS_KEY).find((result) => result.id === id) || null;
}

export function filterResults(filter = {}, sort, limit) {
  const results = readList(RESULTS_KEY).filter((result) => matchesFilter(result, filter));
  return applySortAndLimit(results, sort, limit);
}

export function updateResult(id, patch) {
  const results = readList(RESULTS_KEY);
  let updated = null;
  const next = results.map((result) => {
    if (result.id !== id) return result;
    updated = { ...result, ...patch, updated_date: new Date().toISOString() };
    return updated;
  });
  writeList(RESULTS_KEY, next);
  return updated;
}
