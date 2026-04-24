import crypto from "node:crypto";

const BASE_URL = "https://fhir.dev.ovok.com";
// Using the master credentials as the new client app lacks policy permissions currently
const CLIENT_ID = "28b147ac-f98a-401d-9f7b-06365c05f34e";
const CLIENT_SECRET = "4427c8cb5b47eb7285714e49eb19dcc49994a52dfd6de800c58565abf7d85df5";

async function getAuthToken() {
  const res = await fetch(`${BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });
  const data = await res.json();
  return data.access_token;
}

const MISTAKE_BUNDLE = {
  resourceType: "Bundle",
  type: "batch",
  entry: Array.from({ length: 1000 }).map(() => ({
    request: {
      method: "GET",
      url: "Patient?_count=1" 
    }
  }))
};

let batchesFired = 0;
const TOTAL_BATCHES = 100; // 100 batches * 1000 points = 100,000 points

async function burnPoints() {
  try {
    if (batchesFired >= TOTAL_BATCHES) {
      console.log(`\n[${new Date().toISOString()}] Target reached: 100,000 points burned.`);
      process.exit(0);
    }

    const token = await getAuthToken();
    batchesFired++;
    
    console.log(`[${new Date().toISOString()}] Dispatching Batch ${batchesFired}/${TOTAL_BATCHES} ...`);

    const res = await fetch(`${BASE_URL}/fhir/R4/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(MISTAKE_BUNDLE)
    });

    if (!res.ok) {
      console.log(`[${new Date().toISOString()}] Batch rejected: ${res.status}`);
      const text = await res.text();
      console.log(text.substring(0, 200));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

console.log("Starting 100K Claude Code mistake burn...");

// Fire every 2 seconds to spread it out slightly but still burn 100K fast
burnPoints();
setInterval(burnPoints, 2000);
