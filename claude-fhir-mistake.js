import crypto from "node:crypto";

const BASE_URL = "https://fhir.dev.ovok.com";
// Using the "Claude code - Telepress Test" credentials
const CLIENT_ID = "a1ab36d5-eac7-4c94-9d1e-e0bcd3afc794";
const CLIENT_SECRET = "9bdcca40fa9e04c0e1ae74cd995c6b9c049ebf34add84f6d04900e7f143c14fc";

let accessToken = "";
let tokenExpiresAt = 0;

async function getAuthToken() {
  if (Date.now() < tokenExpiresAt && accessToken) return accessToken;
  const res = await fetch(`${BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

// =========================================================================
// THE "CLAUDE CODE" MISTAKE
// 
// Mistake Profile: "The N+1 Batch Illusion"
// AI Assistants know that firing 1,000 HTTP requests in a loop is bad 
// for local network/CPU overhead. To "optimize" the code, the AI naturally 
// decides to wrap 1,000 requests into a single FHIR `batch` Bundle.
//
// Why it's a critical mistake: The AI doesn't understand Medplum's 
// compute-point billing model. Medplum bills by evaluating EVERY ENTRY 
// inside a batch individually.
//
// Result: Node.js uses basically 0% CPU (it's just 1 HTTP POST per minute).
// But Medplum executes 1000 internal queries, instantly burning 1,000 points.
// =========================================================================

const MISTAKE_BUNDLE = {
  resourceType: "Bundle",
  type: "batch",
  entry: Array.from({ length: 1000 }).map(() => ({
    request: {
      method: "GET",
      // A pointless query an AI might write to "poll" for changes
      url: "Patient?_count=1" 
    }
  }))
};

async function burnPoints() {
  try {
    const token = await getAuthToken();
    console.log(`[${new Date().toISOString()}] Dispatching AI mistake batch bundle...`);

    // ONE single HTTP request. Almost 0% CPU footprint locally.
    const res = await fetch(`${BASE_URL}/fhir/R4/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(MISTAKE_BUNDLE)
    });

    if (res.ok) {
      console.log(`[${new Date().toISOString()}] Medplum processed the batch. ~1000 points burned. Sleeping 60s.`);
    } else {
      console.log(`[${new Date().toISOString()}] Batch rejected: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(text);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

console.log("Starting Claude Code mistake simulator. Will burn 1000 points/min.");
console.log("Press Ctrl+C to stop.");

// Fire immediately, then strictly every 60 seconds
burnPoints();
setInterval(burnPoints, 60000);
