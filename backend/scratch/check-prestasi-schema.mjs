// Read-only: cek skema asli tabel prestasi (dan pembanding kepengurusan) di Supabase.
// Tidak mengubah apa pun — hanya introspection via OpenAPI REST.
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key.trim()] = val.join('=').trim().replace(/(^['"]|['"]$)/g, '');
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL / SUPABASE_SECRET_KEY tidak ditemukan di backend/.env');
  process.exit(1);
}

async function main() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: 'application/openapi+json',
    },
  });

  if (!res.ok) {
    console.error(`Introspection gagal (HTTP ${res.status}):`, await res.text());
    process.exit(1);
  }

  const spec = await res.json();
  const schemas = spec.components?.schemas || {};
  const defs = spec.definitions || {};

  function showTable(name) {
    const def = schemas[name] || defs[name];
    if (!def) {
      console.log(`\n=== Tabel "${name}": TIDAK DITEMUKAN di skema OpenAPI ===`);
      return;
    }
    const props = def.properties || {};
    console.log(`\n=== Tabel "${name}" — kolom saat ini di Supabase: ===`);
    for (const [col, meta] of Object.entries(props)) {
      const type = meta.format ? `${meta.type} (${meta.format})` : meta.type;
      const nullable = meta.nullable === true ? ' NULL' : ' NOT NULL';
      console.log(`  - ${col}: ${type}${nullable}`);
    }
  }

  showTable('prestasi');
  showTable('kepengurusan');

  console.log('\nSelesai. (Introspeksi read-only — tidak ada data yang diubah.)');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
