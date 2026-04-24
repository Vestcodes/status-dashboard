const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!supabaseUrl) {
  console.log("No URL in local");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: projects, error: pErr } = await supabase.from('projects').select('*').limit(5);
  console.log("Projects Error:", pErr);
  console.log("Projects Data:", projects);
}
run();
