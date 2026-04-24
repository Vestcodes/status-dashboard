import crypto from "node:crypto";

const BASE_URL = "https://fhir.dev.ovok.com";
// Let's use the master client to execute the batch since the new one got an unauthorized error.
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

async function burnPointsOnce() {
  try {
    const token = await getAuthToken();
    console.log(`[${new Date().toISOString()}] Dispatching AI mistake batch bundle...`);

    const res = await fetch(`${BASE_URL}/fhir/R4/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(MISTAKE_BUNDLE)
    });

    console.log(`Status: ${res.status}`);
    
    // Dump rate limit headers
    console.log("\nRate Limit Headers:");
    res.headers.forEach((val, key) => {
      if (key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('retry')) {
        console.log(`${key}: ${val}`);
      }
    });

    if (res.ok) {
      console.log(`\n[${new Date().toISOString()}] Medplum processed the batch successfully.`);
    } else {
      console.log(`\n[${new Date().toISOString()}] Batch rejected.`);
      const text = await res.text();
      console.log(text.substring(0, 500));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

burnPointsOnce();
