// Test validation error returns 400, and empty collection returns 200
async function run() {
  const BASE = "http://localhost:3000/api";

  // Test 1: POST atlet tanpa body → harus 400
  console.log("=== Test 1: POST /api/atlet tanpa field wajib → 400 ===");
  const r1 = await fetch(`${BASE}/atlet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  console.log(`Status: ${r1.status}`);
  console.log(await r1.json());

  // Test 2: GET atlet dengan search yang tidak ada → harus 200 + data:[]
  console.log("\n=== Test 2: GET /api/atlet?search=xyznotexist → 200 ===");
  const r2 = await fetch(`${BASE}/atlet?search=xyznotexist`);
  console.log(`Status: ${r2.status}`);
  console.log(await r2.json());

  // Test 3: POST prestasi dengan mendali tidak valid → harus 400
  console.log("\n=== Test 3: POST /api/prestasi mendali tidak valid → 400 ===");
  const r3 = await fetch(`${BASE}/prestasi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      atlet_id: 1,
      event_kejuaraan: "Test",
      tahun: 2024,
      tingkat_lomba: "Nasional",
      mendali: "Platinum"
    })
  });
  console.log(`Status: ${r3.status}`);
  console.log(await r3.json());

  // Test 4: GET dashboard → harus 200
  console.log("\n=== Test 4: GET /api/dashboard → 200 ===");
  const r4 = await fetch(`${BASE}/dashboard`);
  console.log(`Status: ${r4.status}`);
  const j4 = await r4.json();
  console.log(`totalAtlet: ${j4.data.totalAtlet}, skWarnings: ${j4.data.skWarnings.length}`);
}
run();
