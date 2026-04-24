const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://axhstdudmucxhtruwppq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aHN0ZHVkbXVjeGh0cnV3cHBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM1NjA1MCwiZXhwIjoyMDgyOTMyMDUwfQ.mtwDAiubSOcbfpfetvttrEz_rMCvPWL3v5BBZAecNyU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('statuses')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(100);
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("Latest statuses count:", data.length);
  const regions = {};
  data.forEach(d => {
    const r = d.meta?.region || 'missing';
    regions[r] = (regions[r] || 0) + 1;
  });
  console.log("Region distribution in latest 100:", regions);
  console.log("First record:", data[0]);
}

check();
