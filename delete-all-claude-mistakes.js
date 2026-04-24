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

async function sweepAndDelete() {
  try {
    const token = await getAuthToken();
    
    // We search for any patients whose family name starts with "Mistake-" 
    // (which is what the script generated).
    const res = await fetch(`${BASE_URL}/fhir/R4/Patient?family:contains=Mistake-&_count=1000`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      }
    });

    const data = await res.json();
    
    if (!data.entry || data.entry.length === 0) {
      console.log("No dangling Claude Mistake patients found in the system. The database is clean.");
      return;
    }

    console.log(`Found ${data.entry.length} dangling 'Mistake-' patients. Issuing batch delete...`);

    const deleteBundle = {
      resourceType: "Bundle",
      type: "batch",
      entry: data.entry.map(e => ({
        request: {
          method: "DELETE",
          url: `Patient/${e.resource.id}` 
        }
      }))
    };

    const delRes = await fetch(`${BASE_URL}/fhir/R4/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(deleteBundle)
    });

    if (delRes.ok) {
      console.log("Successfully wiped all dangling Claude Mistake patients from the server.");
    } else {
      console.log(`Delete failed: ${delRes.status}`);
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

sweepAndDelete();
