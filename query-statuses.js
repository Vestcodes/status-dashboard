const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('statuses').select('meta').limit(10).order('checked_at', { ascending: false });
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}
run();
