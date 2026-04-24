import { randomUUID } from "node:crypto";
import process from "node:process";

const BASE_URL = (process.env.MEDPLUM_BASE_URL ?? "https://fhir.dev.ovok.com").replace(/\/+$/, "");
const CLIENT_ID = process.env.MEDPLUM_CLIENT_ID ?? "28b147ac-f98a-401d-9f7b-06365c05f34e";
const CLIENT_SECRET =
  process.env.MEDPLUM_CLIENT_SECRET ?? "4427c8cb5b47eb7285714e49eb19dcc49994a52dfd6de800c58565abf7d85df5";
const TOTAL_POINTS = readInt("TOTAL_POINTS", 100_000);
const CONCURRENCY = readInt("CONCURRENCY", 25);
const TIMEOUT_MS = readInt("TIMEOUT_MS", 30_000);
const MODE = (process.env.MODE ?? "read").toLowerCase(); // read | search | metadata | mixed
const DRY_RUN = readBool("DRY_RUN", false);

// Medplum quota: by default every FHIR interaction counts as 1 point. The cheapest
// operations (read-by-id, metadata, trivial search) stay at 1 point each, so hitting
// TOTAL_POINTS is ~= making TOTAL_POINTS requests.
const POINT_COST_PER_REQUEST = 1;
const TOTAL_REQUESTS = Math.ceil(TOTAL_POINTS / POINT_COST_PER_REQUEST);

const RESOURCE_TYPES = [
  "Patient",
  "Practitioner",
  "Observation",
  "Device",
  "Organization",
  "Encounter",
  "Condition",
];

console.log("Medplum FHIR points load runner");
console.log(
  JSON.stringify(
    {
      baseUrl: BASE_URL,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET ? "<redacted>" : "",
      totalPoints: TOTAL_POINTS,
      totalRequests: TOTAL_REQUESTS,
      concurrency: CONCURRENCY,
      mode: MODE,
      timeoutMs: TIMEOUT_MS,
      dryRun: DRY_RUN,
    },
    null,
    2,
  ),
);

if (DRY_RUN) {
  console.log("\nDry run — exiting before auth.");
  process.exit(0);
}

const tokenInfo = await fetchAccessToken();
console.log(
  `Authenticated. Token expires in ~${tokenInfo.expiresInSeconds}s (will refresh automatically).`,
);

const stats = {
  attempted: 0,
  completed: 0,
  ok: 0,
  failed: 0,
  timedOut: 0,
  networkErrors: 0,
  latenciesMs: [],
  statusCounts: new Map(),
  sampleFailures: [],
};

const startedAt = Date.now();
let nextIndex = 0;
let stopProgress = false;

const progressTimer = setInterval(() => {
  if (stopProgress) return;
  const elapsedSec = Math.max(1, (Date.now() - startedAt) / 1000);
  const rps = (stats.completed / elapsedSec).toFixed(2);
  const pointsDone = stats.ok * POINT_COST_PER_REQUEST;
  console.log(
    `[progress] completed=${stats.completed}/${TOTAL_REQUESTS} ok=${stats.ok} failed=${stats.failed} rps=${rps} pointsApprox=${pointsDone}/${TOTAL_POINTS}`,
  );
}, 5_000);

try {
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
} finally {
  stopProgress = true;
  clearInterval(progressTimer);
}

printSummary();

async function worker() {
  while (true) {
    const index = nextIndex++;
    if (index >= TOTAL_REQUESTS) return;
    await sendOne(index);
  }
}

async function sendOne(index) {
  stats.attempted += 1;

  const spec = buildRequestSpec(index);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedMs = Date.now();

  try {
    const token = await getFreshToken();
    const response = await fetch(`${BASE_URL}${spec.path}`, {
      method: spec.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/fhir+json",
        "X-Request-Id": randomUUID(),
      },
      signal: controller.signal,
    });

    // Drain body so the connection can be reused and Content-Length is stable.
    await response.text();

    const latencyMs = Date.now() - startedMs;
    stats.latenciesMs.push(latencyMs);
    stats.completed += 1;
    incrementStatus(response.status);

    if (response.ok || response.status === 404) {
      // 404 on read-by-random-id still consumes a point and is expected in this load.
      stats.ok += 1;
    } else {
      stats.failed += 1;
      rememberFailure({ index, path: spec.path, status: response.status, latencyMs });
      if (response.status === 401) {
        await refreshToken();
      }
      if (response.status === 429) {
        await sleep(500 + Math.floor(Math.random() * 500));
      }
    }
  } catch (error) {
    const latencyMs = Date.now() - startedMs;
    stats.latenciesMs.push(latencyMs);
    stats.completed += 1;
    stats.failed += 1;

    if (error?.name === "AbortError") {
      stats.timedOut += 1;
      rememberFailure({ index, path: spec.path, status: "timeout", latencyMs });
    } else {
      stats.networkErrors += 1;
      rememberFailure({
        index,
        path: spec.path,
        status: "network-error",
        latencyMs,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  } finally {
    clearTimeout(timeout);
  }
}

function buildRequestSpec(index) {
  const mode = MODE === "mixed" ? pickMixed(index) : MODE;
  const resource = RESOURCE_TYPES[index % RESOURCE_TYPES.length];

  switch (mode) {
    case "metadata":
      return { method: "GET", path: "/fhir/R4/metadata" };
    case "search":
      return { method: "GET", path: `/fhir/R4/${resource}?_count=1&_total=none` };
    case "read":
    default:
      // Reading by a random UUID is the cheapest authenticated interaction; Medplum
      // returns 404 but still charges 1 point, which is exactly what we want.
      return { method: "GET", path: `/fhir/R4/${resource}/${randomUUID()}` };
  }
}

function pickMixed(index) {
  const pool = ["read", "search", "metadata"];
  return pool[index % pool.length];
}

// ---------------- Auth ----------------

var cachedToken = null;
var cachedTokenExpiresAtMs = 0;
var refreshInflight = null;

async function fetchAccessToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const response = await fetch(`${BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Auth failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const parsed = JSON.parse(text);
  if (!parsed.access_token) {
    throw new Error(`Auth response missing access_token: ${text.slice(0, 300)}`);
  }

  const expiresInSeconds = Number(parsed.expires_in) || 3600;
  cachedToken = parsed.access_token;
  // Refresh 60s before expiry to stay safely valid under load.
  cachedTokenExpiresAtMs = Date.now() + Math.max(30_000, (expiresInSeconds - 60) * 1000);
  return { accessToken: cachedToken, expiresInSeconds };
}

async function getFreshToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAtMs) return cachedToken;
  return refreshToken();
}

async function refreshToken() {
  if (refreshInflight) return refreshInflight;
  refreshInflight = fetchAccessToken()
    .then((info) => info.accessToken)
    .finally(() => {
      refreshInflight = null;
    });
  return refreshInflight;
}

// ---------------- Reporting ----------------

function printSummary() {
  const elapsedMs = Date.now() - startedAt;
  const elapsedSec = Math.max(1, elapsedMs / 1000);
  const sorted = [...stats.latenciesMs].sort((a, b) => a - b);

  console.log("\nSummary:");
  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        mode: MODE,
        targetPoints: TOTAL_POINTS,
        approxPointsConsumed: stats.ok * POINT_COST_PER_REQUEST,
        requestsAttempted: stats.attempted,
        requestsCompleted: stats.completed,
        ok: stats.ok,
        failed: stats.failed,
        timedOut: stats.timedOut,
        networkErrors: stats.networkErrors,
        successRate: pct(stats.ok, Math.max(1, stats.completed)),
        elapsedMs,
        throughputRps: Number((stats.completed / elapsedSec).toFixed(2)),
        p50LatencyMs: percentile(sorted, 50),
        p95LatencyMs: percentile(sorted, 95),
        p99LatencyMs: percentile(sorted, 99),
        maxLatencyMs: sorted.at(-1) ?? 0,
        statusCounts: Object.fromEntries(
          [...stats.statusCounts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
        ),
        sampleFailures: stats.sampleFailures,
      },
      null,
      2,
    ),
  );
}

function incrementStatus(status) {
  stats.statusCounts.set(status, (stats.statusCounts.get(status) ?? 0) + 1);
}

function rememberFailure(failure) {
  if (stats.sampleFailures.length < 10) stats.sampleFailures.push(failure);
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function pct(num, den) {
  return Number(((num / den) * 100).toFixed(2));
}

function readInt(name, fallback) {
  const raw = process.env[name];
  if (!raw?.trim()) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer, got: ${raw}`);
  }
  return parsed;
}

function readBool(name, fallback) {
  const raw = process.env[name];
  if (!raw?.trim()) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
