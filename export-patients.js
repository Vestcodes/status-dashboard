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

async function exportPatients() {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BASE_URL}/fhir/R4/Patient?_count=1000`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/fhir+json"
      }
    });

    const data = await res.json();
    
    if (data.entry && data.entry.length > 0) {
      let csvContent = "ID,Given Name,Family Name,Gender,BirthDate,LastUpdated\n";
      
      data.entry.forEach((e) => {
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
      console.log(`Successfully exported ${data.entry.length} patients to CSV.`);
    } else {
      console.log("No patients found to export.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

exportPatients();
