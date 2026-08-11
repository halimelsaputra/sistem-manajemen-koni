import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('mv_medals_by_region').select('*');
  if (error) {
    console.error("Failed to query mv_medals_by_region:", error);
  } else {
    console.log("mv_medals_by_region data:", data);
  }
}
test();
