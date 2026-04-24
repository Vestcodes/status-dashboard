const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: qData, error: qErr } = await supabase.from('projects').select('*').limit(1);
  console.log("Error:", qErr);
  console.log("Data:", qData);
}
run();
