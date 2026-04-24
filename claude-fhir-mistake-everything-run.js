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

const targetPatients = JSON.parse(fs.readFileSync("/home/ubuntu/.openclaw/workspace/status-dashboard/100k-patients.json", "utf8"));

let sweepsCompleted = 0;
let lastKnownQuota = "Unknown";

async function burnPoints() {
  try {
    const token = await getAuthToken();
    sweepsCompleted++;
    
    console.log(`[${new Date().toISOString()}] Sweep ${sweepsCompleted}: Firing $everything for 366 patients...`);
    
    // Fire the promises but don't await them immediately here 
    // so we don't block the interval loop if the server gets slow
    const promises = targetPatients.map(p => 
      fetch(`${BASE_URL}/fhir/R4/Patient/${p.id}/$everything`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      })
    );

    Promise.allSettled(promises).then(responses => {
      const firstOk = responses.find(r => r.status === 'fulfilled' && r.value.ok);
      if (firstOk) {
        firstOk.value.headers.forEach((val, key) => {
          if (key.toLowerCase() === 'ratelimit') {
            const match = val.match(/r=(\d+)/);
            if (match) lastKnownQuota = match[1];
          }
        });
      }
    });

  } catch (err) {
    // ignore fetch setup errors
  }
}

function checkRateLimit() {
  console.log(`\n======================================================`);
  console.log(`[MINUTE SUMMARY] - ${new Date().toISOString()}`);
  console.log(`Sweeps fired in last 60s: ${sweepsCompleted}`);
  console.log(`Approx points burned: ${(sweepsCompleted * 8342).toLocaleString()}`);
  console.log(`CURRENT REMAINING QUOTA: ${Number(lastKnownQuota).toLocaleString()}`);
  console.log(`======================================================\n`);
  
  // Reset sweep counter for the next minute
  sweepsCompleted = 0;
}

console.log(`Starting Claude Code $everything simulator (REDUCED LOAD).`);
console.log(`Targeting 366 specific patients 3 times per minute (every 20 seconds).`);
console.log(`Estimated burn rate: ~25,000 points per minute.`);

// Fire immediately, then every 20 seconds (3 times a minute)
burnPoints();
setInterval(burnPoints, 20000);

// Log rate limit every 60 seconds
setInterval(checkRateLimit, 60000);
