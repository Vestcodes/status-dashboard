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

function generateCreateBundle() {
  return {
    resourceType: "Bundle",
    type: "batch",
    entry: Array.from({ length: 1000 }).map(() => ({
      request: {
        method: "POST",
        url: "Patient" 
      },
      resource: {
        resourceType: "Patient",
        name: [
          {
            given: ["Claude"],
            family: "Mistake-" + crypto.randomBytes(4).toString('hex')
          }
        ]
      }
    }))
  };
}

let createdPatientIds = [];

async function createPatients() {
  try {
    const token = await getAuthToken();
    console.log(`\n[${new Date().toISOString()}] (Minute 1): Dispatching Batch CREATE (1000 Patients)...`);

    const res = await fetch(`${BASE_URL}/fhir/R4/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(generateCreateBundle())
    });

    if (res.ok) {
      const data = await res.json();
      createdPatientIds = data.entry
        .filter(e => e.response && e.response.status.startsWith('201'))
        .map(e => e.response.location.split('/')[1]); // e.g., "Patient/uuid/_history/1" -> "uuid"

      console.log(`[${new Date().toISOString()}] Successfully created ${createdPatientIds.length} patients.`);
    } else {
      console.log(`[${new Date().toISOString()}] Create batch rejected: ${res.status}`);
      const text = await res.text();
      console.log(text.substring(0, 200));
    }
  } catch (err) {
    console.error("Create Error:", err.message);
  }
}

async function deletePatients() {
  if (createdPatientIds.length === 0) {
    console.log(`[${new Date().toISOString()}] No patients to delete.`);
    return;
  }

  try {
    const token = await getAuthToken();
    console.log(`\n[${new Date().toISOString()}] (Minute 2): Dispatching Batch DELETE (${createdPatientIds.length} Patients)...`);

    const deleteBundle = {
      resourceType: "Bundle",
      type: "batch",
      entry: createdPatientIds.map(id => ({
        request: {
          method: "DELETE",
          url: `Patient/${id}` 
        }
      }))
    };

    const res = await fetch(`${BASE_URL}/fhir/R4/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(deleteBundle)
    });

    if (res.ok) {
      console.log(`[${new Date().toISOString()}] Successfully deleted the 1000 patients.`);
      createdPatientIds = []; // reset for the next loop
    } else {
      console.log(`[${new Date().toISOString()}] Delete batch rejected: ${res.status}`);
    }
  } catch (err) {
    console.error("Delete Error:", err.message);
  }
}

// State machine: 1 = Create, 2 = Delete
let state = 1;

async function tick() {
  if (state === 1) {
    await createPatients();
    state = 2;
  } else {
    await deletePatients();
    state = 1;
  }
}

console.log("Starting Claude Code mistake loop: Create 1000 -> Wait 60s -> Delete 1000 -> Wait 60s...");

// Run immediately, then every 60 seconds
tick();
setInterval(tick, 60000);
