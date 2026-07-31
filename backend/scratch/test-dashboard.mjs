// Script to test the newly updated dashboard endpoint
import fs from 'fs';

// Load .env
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key.trim()] = val.join('=').trim().replace(/(^['"]|['"]$)/g, '');
  }
});

async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/dashboard");
    const json = await res.json();
    console.log("=== DASHBOARD API RESPONSE ===");
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Failed to connect to dev server:", err.message);
  }
}
run();
