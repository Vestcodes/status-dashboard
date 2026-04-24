const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.axhstdudmucxhtruwppq:nziTMvNOVKBy0zch@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    const projects = [
      { name: "Ovok Dev API", slug: "ovok-dev", domain: "api.dev.ovok.com" },
      { name: "Ovok Staging API", slug: "ovok-staging", domain: "api.staging.ovok.com" },
      { name: "Ovok API", slug: "ovok", domain: "api.ovok.com" }
    ];
    
    for (const p of projects) {
      await client.query(
        'INSERT INTO projects (name, slug, domain) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET name = $1, domain = $3',
        [p.name, p.slug, p.domain]
      );
    }
    console.log("Success");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
