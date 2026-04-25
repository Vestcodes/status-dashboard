import crypto from "node:crypto";

const BASE_URL = "https://fhir.dev.ovok.com";
const CLIENT_ID = "28b147ac-f98a-401d-9f7b-06365c05f34e";
REDACTED

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
    let hasMore = true;
    let totalDeleted = 0;

    while (hasMore) {
      const res = await fetch(`${BASE_URL}/fhir/R4/Patient?family:contains=Mistake-&_count=1000`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/fhir+json"
        }
      });

      const data = await res.json();
      
      if (!data.entry || data.entry.length === 0) {
        console.log("No more dangling Claude Mistake patients found in the system.");
        hasMore = false;
        break;
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
        totalDeleted += data.entry.length;
        console.log(`Successfully wiped ${data.entry.length} dangling Claude Mistake patients.`);
      } else {
        console.log(`Delete failed: ${delRes.status}`);
        hasMore = false;
      }
    }
    console.log(`Total deleted: ${totalDeleted}`);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

sweepAndDelete();
