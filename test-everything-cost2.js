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
    const patientId = "c8c809dd-ff02-4576-a75c-59d05b5e7bb8";

    // Fire 1 to get base
    const res1 = await fetch(`${BASE_URL}/fhir/R4/Patient/${patientId}/$everything`, {
      method: "GET", headers: { "Authorization": `Bearer ${token}` }
    });
    
    let startPoints = 0;
    res1.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'ratelimit') {
        const match = val.match(/r=(\d+)/);
        if (match) startPoints = parseInt(match[1]);
      }
    });

    console.log(`Initial Points Remaining: ${startPoints}`);

    // Fire a second time
    const res2 = await fetch(`${BASE_URL}/fhir/R4/Patient/${patientId}/$everything`, {
      method: "GET", headers: { "Authorization": `Bearer ${token}` }
    });

    let endPoints = 0;
    res2.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'ratelimit') {
        const match = val.match(/r=(\d+)/);
        if (match) endPoints = parseInt(match[1]);
      }
    });

    console.log(`Ending Points Remaining: ${endPoints}`);
    console.log(`Cost per $everything operation: ${startPoints - endPoints}`);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testEverything();
