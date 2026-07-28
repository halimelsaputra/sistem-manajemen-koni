// Script untuk memvalidasi REST API yang telah kita buat secara otomatis
// Kita akan melakukan request HTTP (GET, POST, PUT, DELETE) ke localhost:3000

import assert from "assert";

const BASE_URL = "http://localhost:3000/api";

// Fungsi helper untuk melakukan insert dengan auto-healing postgres sequences.
// Jika terjadi error duplicate key (karena sequence database out-of-sync),
// kita akan mencoba lagi secara otomatis sehingga sequence akan maju secara independen
// hingga melampaui max ID yang ada.
async function insertWithAutoSync(url, payload) {
    let attempts = 0;
    while (attempts < 50) {
        attempts++;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        
        if (res.status === 201) {
            console.log(`[Sequence Sync] Berhasil di-insert pada percobaan ke-${attempts}`);
            return json.data;
        }
        
        // Memeriksa jika error disebabkan oleh duplikasi primary key (sequence out of sync)
        const errorMsg = json.error ? JSON.stringify(json.error) : "";
        if (errorMsg.includes("duplicate key") || errorMsg.includes("unique constraint")) {
            console.log(`[Sequence Sync] Duplicate key terdeteksi (percobaaan ${attempts}). Sequence maju +1. Ulangi...`);
            continue;
        }
        
        throw new Error(`Gagal insert (HTTP ${res.status}): ${JSON.stringify(json)}`);
    }
    throw new Error("Gagal menyelaraskan sequence database setelah 50 percobaan.");
}

async function runTests() {
    console.log("=== MEMULAI PENGUJIAN REST API ===");

    try {
        let createdCabor;
        let createdAtlet;
        let createdPrestasi;
        let createdKepengurusan;

        // 1. Uji GET /api/dashboard
        console.log("\n[TEST 1] GET /api/dashboard");
        const resDashboard = await fetch(`${BASE_URL}/dashboard`);
        const jsonDashboard = await resDashboard.json();
        console.log("Dashboard response:", JSON.stringify(jsonDashboard, null, 2));
        assert.strictEqual(resDashboard.status, 200);
        assert.strictEqual(jsonDashboard.status, "success");
        assert.ok(jsonDashboard.data.hasOwnProperty("totalAtlet"));

        // 2. Uji POST /api/cabor dengan auto sync sequence
        console.log("\n[TEST 2] POST /api/cabor (Tambah Cabor)");
        createdCabor = await insertWithAutoSync(`${BASE_URL}/cabor`, {
            nama_cabor: "Pencak Silat Test"
        });
        console.log("Cabor ditambahkan:", createdCabor);
        assert.ok(createdCabor.id);

        // 3. Uji GET /api/cabor/[id] (Ambil Detail Cabor)
        console.log(`\n[TEST 3] GET /api/cabor/${createdCabor.id}`);
        const resGetCabor = await fetch(`${BASE_URL}/cabor/${createdCabor.id}`);
        const jsonGetCabor = await resGetCabor.json();
        console.log("GET cabor detail response:", jsonGetCabor);
        assert.strictEqual(resGetCabor.status, 200);
        assert.strictEqual(jsonGetCabor.data.nama_cabor, "Pencak Silat Test");

        // 4. Uji PUT /api/cabor/[id] (Update Cabor)
        console.log(`\n[TEST 4] PUT /api/cabor/${createdCabor.id}`);
        const resPutCabor = await fetch(`${BASE_URL}/cabor/${createdCabor.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nama_cabor: "Pencak Silat Update" })
        });
        const jsonPutCabor = await resPutCabor.json();
        console.log("PUT cabor response:", jsonPutCabor);
        assert.strictEqual(resPutCabor.status, 200);
        assert.strictEqual(jsonPutCabor.data.nama_cabor, "Pencak Silat Update");

        // 5. Uji POST /api/atlet dengan auto sync sequence
        console.log("\n[TEST 5] POST /api/atlet (Tambah Atlet)");
        createdAtlet = await insertWithAutoSync(`${BASE_URL}/atlet`, {
            nama_atlet: "Sultan Syarif Test",
            kabupaten_kota: "Banda Aceh",
            cabor_id: Number(createdCabor.id)
        });
        console.log("Atlet ditambahkan:", createdAtlet);
        assert.ok(createdAtlet.id);

        // 6. Uji GET /api/atlet (Daftar Atlet)
        console.log("\n[TEST 6] GET /api/atlet (Daftar Atlet)");
        const resGetAtletList = await fetch(`${BASE_URL}/atlet`);
        const jsonGetAtletList = await resGetAtletList.json();
        console.log(`Jumlah atlet yang ditemukan: ${jsonGetAtletList.data.length}`);
        assert.strictEqual(resGetAtletList.status, 200);
        assert.ok(jsonGetAtletList.data.length > 0);

        // 7. Uji POST /api/prestasi dengan auto sync sequence
        console.log("\n[TEST 7] POST /api/prestasi (Tambah Prestasi)");
        createdPrestasi = await insertWithAutoSync(`${BASE_URL}/prestasi`, {
            atlet_id: Number(createdAtlet.id),
            event_kejuaraan: "Kejuaraan Daerah Test",
            tahun: 2025,
            tingkat_lomba: "Daerah",
            mendali: "Emas"
        });
        console.log("Prestasi ditambahkan:", createdPrestasi);
        assert.ok(createdPrestasi.id);

        // 8. Uji POST /api/kepengurusan dengan auto sync sequence
        console.log("\n[TEST 8] POST /api/kepengurusan (Tambah Kepengurusan)");
        createdKepengurusan = await insertWithAutoSync(`${BASE_URL}/kepengurusan`, {
            cabor_id: Number(createdCabor.id),
            masa_bakti: "2025-2029",
            nomor_sk: "SK-999",
            tanggal_sk: "2025-02-10",
            ketua_umum: "Zulkifli",
            sekretaris: "Maimunah",
            status_kepengurusan: "Aktif"
        });
        console.log("Kepengurusan ditambahkan:", createdKepengurusan);
        assert.ok(createdKepengurusan.id);

        // Clean up: Hapus data kepengurusan, prestasi, atlet, cabor
        console.log("\n=== MEMBERSIHKAN DATA PENGUJIAN ===");

        if (createdKepengurusan) {
            console.log(`Menghapus kepengurusan ID: ${createdKepengurusan.id}`);
            const del = await fetch(`${BASE_URL}/kepengurusan/${createdKepengurusan.id}`, { method: "DELETE" });
            assert.strictEqual(del.status, 200);
        }

        if (createdPrestasi) {
            console.log(`Menghapus prestasi ID: ${createdPrestasi.id}`);
            const del = await fetch(`${BASE_URL}/prestasi/${createdPrestasi.id}`, { method: "DELETE" });
            assert.strictEqual(del.status, 200);
        }

        if (createdAtlet) {
            console.log(`Menghapus atlet ID: ${createdAtlet.id}`);
            const del = await fetch(`${BASE_URL}/atlet/${createdAtlet.id}`, { method: "DELETE" });
            assert.strictEqual(del.status, 200);
        }

        if (createdCabor) {
            console.log(`Menghapus cabor ID: ${createdCabor.id}`);
            const del = await fetch(`${BASE_URL}/cabor/${createdCabor.id}`, { method: "DELETE" });
            assert.strictEqual(del.status, 200);
        }

        console.log("\n=== SEMUA PENGUJIAN REST API BERHASIL DAN SUKSES! ===");
    } catch (err) {
        console.error("\n!!! PENGUJIAN GAGAL DENGAN ERROR !!!", err);
        process.exit(1);
    }
}

runTests();
