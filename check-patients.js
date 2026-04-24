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

async function getPatients() {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BASE_URL}/fhir/R4/Patient?_count=10`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      }
    });

    const data = await res.json();
    
    if (data.entry && data.entry.length > 0) {
      console.log(`Found ${data.total || data.entry.length} total patients. Here are the first few names:`);
      data.entry.forEach((e, idx) => {
        const patient = e.resource;
        const nameObj = patient.name && patient.name[0];
        if (nameObj) {
          const given = nameObj.given ? nameObj.given.join(" ") : "";
          const family = nameObj.family || "";
          console.log(`${idx + 1}. ${given} ${family}`.trim());
        } else {
          console.log(`${idx + 1}. (No Name Provided) - ID: ${patient.id}`);
        }
      });
    } else {
      console.log("No patients found in the database.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

getPatients();
