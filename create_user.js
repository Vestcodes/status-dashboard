const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://pvxfpphlxygxdlirqaxf.supabase.co";
// Need service_role key to bypass policies and use admin API
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2eGZwcGhseHlneGRsaXJxYXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgzNjM4OCwiZXhwIjoyMDkyNDEyMzg4fQ._FeSdKY4Ze_uJe9b40Q08dbuRVeQXCrXPREauxgxs_c"; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'contact@vestcodes.co',
    password: 'VestcodesSysAdmin2026!$',
    email_confirm: true
  });
  
  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('User created successfully:', data.user.id);
  }
}

createUser();
