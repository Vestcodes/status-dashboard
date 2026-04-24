import crypto from "node:crypto";

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

async function testEverything() {
  try {
    const token = await getAuthToken();
    
    // Grab a random patient ID from the database first
    const pRes = await fetch(`${BASE_URL}/fhir/R4/Patient?_count=1`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      }
    });
    const pData = await pRes.json();
    const patientId = pData.entry[0].resource.id;
    console.log(`Using Patient ID: ${patientId}`);

    // Fire the $everything request
    console.log(`Firing $everything request...`);
    const res = await fetch(`${BASE_URL}/fhir/R4/Patient/${patientId}/$everything`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      }
    });

    console.log(`Status: ${res.status}`);
    
    // Dump rate limit headers to see exact point consumption
    console.log("\nRate Limit Headers:");
    res.headers.forEach((val, key) => {
      if (key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('retry')) {
        console.log(`${key}: ${val}`);
      }
    });

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testEverything();
