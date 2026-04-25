import crypto from "node:crypto";
import fs from "node:fs";

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

async function exportAllPatients() {
  try {
    const token = await getAuthToken();
    let url = `${BASE_URL}/fhir/R4/Patient?_count=1000`;
    let allPatients = [];
    let hasMore = true;
    
    while (hasMore) {
      console.log(`Fetching from: ${url}`);
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/fhir+json"
        }
      });
      const data = await res.json();
      
      if (data.entry && data.entry.length > 0) {
        allPatients = allPatients.concat(data.entry);
      }
      
      const nextLink = data.link && data.link.find(l => l.relation === "next");
      if (nextLink && nextLink.url) {
        url = nextLink.url;
      } else {
        hasMore = false;
      }
    }

    if (allPatients.length > 0) {
      let csvContent = "ID,Given Name,Family Name,Gender,BirthDate,LastUpdated\n";
      
      allPatients.forEach((e) => {
        const patient = e.resource;
        const id = patient.id || "";
        const nameObj = patient.name && patient.name[0];
        let given = "";
        let family = "";
        if (nameObj) {
          given = nameObj.given ? nameObj.given.join(" ") : "";
          family = nameObj.family || "";
        }
        const gender = patient.gender || "";
        const birthDate = patient.birthDate || "";
        const lastUpdated = patient.meta && patient.meta.lastUpdated ? patient.meta.lastUpdated : "";
        
        // Escape quotes and commas
        const safeGiven = `"${given.replace(/"/g, '""')}"`;
        const safeFamily = `"${family.replace(/"/g, '""')}"`;
        
        csvContent += `${id},${safeGiven},${safeFamily},${gender},${birthDate},${lastUpdated}\n`;
      });
      
      fs.writeFileSync("/home/ubuntu/.openclaw/workspace/status-dashboard/patients_export.csv", csvContent);
      console.log(`Successfully exported ${allPatients.length} total patients to CSV.`);
    } else {
      console.log("No patients found to export.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

exportAllPatients();
