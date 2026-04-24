import crypto from "node:crypto";
import fs from "node:fs";

const BASE_URL = "https://fhir.dev.ovok.com";
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

// Load the exact patients calculated to burn ~8333 points per sweep
const targetPatients = JSON.parse(fs.readFileSync("/home/ubuntu/.openclaw/workspace/status-dashboard/100k-patients.json", "utf8"));

async function burnPoints() {
  try {
    const token = await getAuthToken();
    console.log(`\n[${new Date().toISOString()}] Firing $everything for ${targetPatients.length} patients...`);

    // The mistake: An AI trying to bulk-fetch all linked patient data concurrently
    const promises = targetPatients.map(p => 
      fetch(`${BASE_URL}/fhir/R4/Patient/${p.id}/$everything`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      })
    );

    // This blasts the Medplum DB concurrently, consuming the exact mathematical points requested
    const responses = await Promise.allSettled(promises);
    
    // Check remaining points from the first successful response
    const firstOk = responses.find(r => r.status === 'fulfilled' && r.value.ok);
    if (firstOk) {
      let remaining = "Unknown";
      firstOk.value.headers.forEach((val, key) => {
        if (key.toLowerCase() === 'ratelimit') {
          const match = val.match(/r=(\d+)/);
          if (match) remaining = match[1];
        }
      });
      console.log(`[${new Date().toISOString()}] Sweep complete. Remaining quota: ${remaining}`);
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

console.log(`Starting Claude Code $everything simulator.`);
console.log(`Targeting ${targetPatients.length} specific patients every 5 seconds.`);
console.log(`Estimated burn rate: 100,104 points per minute.`);
console.log("Press Ctrl+C to stop.");

// Fire immediately, then every 5 seconds
burnPoints();
setInterval(burnPoints, 5000);
