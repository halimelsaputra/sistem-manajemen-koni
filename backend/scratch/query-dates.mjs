import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key.trim()] = val.join('=').trim().replace(/(^['"]|['"]$)/g, '');
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: kep } = await supabase.from('kepengurusan').select('*');
  console.log("=== KEPENGURUSAN DATA ===");
  console.log(kep);

  const { data: pres } = await supabase.from('prestasi').select('*');
  console.log("\n=== PRESTASI DATA ===");
  console.log(pres);
}
check();
