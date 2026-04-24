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

async function findPatientsFor100k() {
  try {
    const token = await getAuthToken();
    const TARGET_POINTS_PER_SWEEP = 100000 / 12; // ~8333 points needed per sweep
    
    let currentSweepPoints = 0;
    let selectedPatients = [];
    let url = `${BASE_URL}/fhir/R4/Patient?_count=100`;

    console.log(`Targeting ~8,333 points per sweep... scanning patients...`);

    while (currentSweepPoints < TARGET_POINTS_PER_SWEEP && url) {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/fhir+json"
        }
      });
      const data = await res.json();
      
      if (!data.entry || data.entry.length === 0) break;

      for (const e of data.entry) {
        const patientId = e.resource.id;
        
        // Test cost of this specific patient's $everything
        const testRes = await fetch(`${BASE_URL}/fhir/R4/Patient/${patientId}/$everything`, {
          method: "GET", headers: { "Authorization": `Bearer ${token}` }
        });
        
        let startPoints = 0;
        let endPoints = 0;
        
        // We have to fire it twice to measure the delta exactly
        const testRes2 = await fetch(`${BASE_URL}/fhir/R4/Patient/${patientId}/$everything`, {
          method: "GET", headers: { "Authorization": `Bearer ${token}` }
        });

        testRes.headers.forEach((val, key) => {
          if (key.toLowerCase() === 'ratelimit') {
            const match = val.match(/r=(\d+)/);
            if (match) startPoints = parseInt(match[1]);
          }
        });
        
        testRes2.headers.forEach((val, key) => {
          if (key.toLowerCase() === 'ratelimit') {
            const match = val.match(/r=(\d+)/);
            if (match) endPoints = parseInt(match[1]);
          }
        });

        const cost = startPoints - endPoints;
        
        if (cost > 0) {
          selectedPatients.push({ id: patientId, cost });
          currentSweepPoints += cost;
          
          if (selectedPatients.length % 50 === 0) {
            console.log(`Gathered ${selectedPatients.length} patients... current sweep cost: ${currentSweepPoints} points`);
          }
        }

        if (currentSweepPoints >= TARGET_POINTS_PER_SWEEP) {
          break; // We hit our target
        }
      }
      
      const nextLink = data.link && data.link.find(l => l.relation === "next");
      url = nextLink ? nextLink.url : null;
    }

    console.log(`\nDONE. Found ${selectedPatients.length} specific patients.`);
    console.log(`Total exact cost per sweep: ${currentSweepPoints} points`);
    console.log(`Total cost per minute (x12): ${(currentSweepPoints * 12).toLocaleString()} points`);
    
    // Save to a file so we can run the actual loop later
    import("node:fs").then(fs => {
      fs.writeFileSync("/home/ubuntu/.openclaw/workspace/status-dashboard/100k-patients.json", JSON.stringify(selectedPatients, null, 2));
      console.log("Saved patient list to 100k-patients.json");
    });

  } catch (err) {
    console.error("Error:", err.message);
  }
}

findPatientsFor100k();
