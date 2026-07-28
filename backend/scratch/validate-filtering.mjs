// Script untuk memvalidasi fitur filtering API KONI secara otomatis.
// Menghubungkan ke server Next.js lokal di localhost:3000

import assert from "assert";

const BASE_URL = "http://localhost:3000/api";

async function runFilteringTests() {
    console.log("=== MEMULAI PENGUJIAN FITUR FILTERING API ===");

    try {
        // 1. Validasi Endpoint Atlet
        console.log("\n--- [TEST 1] GET /api/atlet (Filtering) ---");
        
        // Ambil data awal/tanpa filter untuk perbandingan
        const resAllAtlet = await fetch(`${BASE_URL}/atlet`);
        const jsonAllAtlet = await resAllAtlet.json();
        assert.strictEqual(resAllAtlet.status, 200, "Mengambil semua atlet gagal");
        console.log(`Total atlet tanpa filter: ${jsonAllAtlet.data.length}`);

        if (jsonAllAtlet.data.length > 0) {
            const firstAtlet = jsonAllAtlet.data[0];
            const testName = firstAtlet.nama_atlet;
            const testKab = firstAtlet.kabupaten_kota;
            const testCaborId = firstAtlet.cabor_id;

            // Test filter by search (sebagian nama)
            const partialName = testName.substring(0, Math.ceil(testName.length / 2));
            console.log(`Menguji filter search atlet dengan keyword: "${partialName}"`);
            const resSearch = await fetch(`${BASE_URL}/atlet?search=${encodeURIComponent(partialName)}`);
            const jsonSearch = await resSearch.json();
            assert.strictEqual(resSearch.status, 200);
            assert.ok(jsonSearch.data.length > 0, "Harus menemukan atlet dengan search name");
            console.log(`Hasil filter search: ditemukan ${jsonSearch.data.length} atlet`);

            // Test filter by kabupaten_kota
            console.log(`Menguji filter kabupaten_kota atlet: "${testKab}"`);
            const resKab = await fetch(`${BASE_URL}/atlet?kabupaten_kota=${encodeURIComponent(testKab)}`);
            const jsonKab = await resKab.json();
            assert.strictEqual(resKab.status, 200);
            assert.ok(jsonKab.data.every(a => a.kabupaten_kota === testKab), "Semua hasil harus memiliki kabupaten_kota yang cocok");
            console.log(`Hasil filter kabupaten_kota: ditemukan ${jsonKab.data.length} atlet`);

            // Test filter by cabor_id
            console.log(`Menguji filter cabor_id atlet: "${testCaborId}"`);
            const resCabor = await fetch(`${BASE_URL}/atlet?cabor_id=${testCaborId}`);
            const jsonCabor = await resCabor.json();
            assert.strictEqual(resCabor.status, 200);
            assert.ok(jsonCabor.data.every(a => a.cabor_id === Number(testCaborId)), "Semua hasil harus memiliki cabor_id yang cocok");
            console.log(`Hasil filter cabor_id: ditemukan ${jsonCabor.data.length} atlet`);
        } else {
            console.log("Lewati pengujian detail atlet karena tidak ada data atlet di database.");
        }

        // 2. Validasi Endpoint Cabor
        console.log("\n--- [TEST 2] GET /api/cabor (Filtering) ---");
        const resAllCabor = await fetch(`${BASE_URL}/cabor`);
        const jsonAllCabor = await resAllCabor.json();
        assert.strictEqual(resAllCabor.status, 200);
        console.log(`Total cabor tanpa filter: ${jsonAllCabor.data.length}`);

        if (jsonAllCabor.data.length > 0) {
            const firstCabor = jsonAllCabor.data[0];
            const partialCaborName = firstCabor.nama_cabor.substring(0, 3);

            console.log(`Menguji filter search cabor dengan keyword: "${partialCaborName}"`);
            const resSearchC = await fetch(`${BASE_URL}/cabor?search=${encodeURIComponent(partialCaborName)}`);
            const jsonSearchC = await resSearchC.json();
            assert.strictEqual(resSearchC.status, 200);
            assert.ok(jsonSearchC.data.length > 0, "Harus menemukan cabor dengan search name");
            console.log(`Hasil filter search cabor: ditemukan ${jsonSearchC.data.length} cabor`);
        }

        // 3. Validasi Endpoint Kepengurusan
        console.log("\n--- [TEST 3] GET /api/kepengurusan (Filtering) ---");
        const resAllKepengurusan = await fetch(`${BASE_URL}/kepengurusan`);
        const jsonAllKepengurusan = await resAllKepengurusan.json();
        assert.strictEqual(resAllKepengurusan.status, 200);
        console.log(`Total kepengurusan tanpa filter: ${jsonAllKepengurusan.data.length}`);

        if (jsonAllKepengurusan.data.length > 0) {
            const firstK = jsonAllKepengurusan.data[0];

            // Test status_kepengurusan
            console.log(`Menguji filter status_kepengurusan: "${firstK.status_kepengurusan}"`);
            const resStatus = await fetch(`${BASE_URL}/kepengurusan?status_kepengurusan=${firstK.status_kepengurusan}`);
            const jsonStatus = await resStatus.json();
            assert.strictEqual(resStatus.status, 200);
            assert.ok(jsonStatus.data.every(k => k.status_kepengurusan === firstK.status_kepengurusan), "Semua hasil harus memiliki status yang cocok");
            console.log(`Hasil filter status: ditemukan ${jsonStatus.data.length} kepengurusan`);

            // Test cabor_id
            console.log(`Menguji filter cabor_id kepengurusan: "${firstK.cabor_id}"`);
            const resCaborK = await fetch(`${BASE_URL}/kepengurusan?cabor_id=${firstK.cabor_id}`);
            const jsonCaborK = await resCaborK.json();
            assert.strictEqual(resCaborK.status, 200);
            assert.ok(jsonCaborK.data.every(k => k.cabor_id === firstK.cabor_id), "Semua hasil harus memiliki cabor_id yang cocok");
            console.log(`Hasil filter cabor_id: ditemukan ${jsonCaborK.data.length} kepengurusan`);

            // Test search
            const searchKeyword = firstK.ketua_umum.substring(0, Math.ceil(firstK.ketua_umum.length / 2));
            console.log(`Menguji filter search kepengurusan (ketua umum): "${searchKeyword}"`);
            const resSearchK = await fetch(`${BASE_URL}/kepengurusan?search=${encodeURIComponent(searchKeyword)}`);
            const jsonSearchK = await resSearchK.json();
            assert.strictEqual(resSearchK.status, 200);
            assert.ok(jsonSearchK.data.length > 0, "Harus menemukan kepengurusan dengan search");
            console.log(`Hasil filter search: ditemukan ${jsonSearchK.data.length} kepengurusan`);
        }

        // 4. Validasi Endpoint Prestasi
        console.log("\n--- [TEST 4] GET /api/prestasi (Filtering) ---");
        const resAllPrestasi = await fetch(`${BASE_URL}/prestasi`);
        const jsonAllPrestasi = await resAllPrestasi.json();
        assert.strictEqual(resAllPrestasi.status, 200);
        console.log(`Total prestasi tanpa filter: ${jsonAllPrestasi.data.length}`);

        if (jsonAllPrestasi.data.length > 0) {
            const firstP = jsonAllPrestasi.data[0];

            // Test tingkat_lomba
            console.log(`Menguji filter tingkat_lomba: "${firstP.tingkat_lomba}"`);
            const resTingkat = await fetch(`${BASE_URL}/prestasi?tingkat_lomba=${firstP.tingkat_lomba}`);
            const jsonTingkat = await resTingkat.json();
            assert.strictEqual(resTingkat.status, 200);
            assert.ok(jsonTingkat.data.every(p => p.tingkat_lomba === firstP.tingkat_lomba), "Semua hasil harus memiliki tingkat lomba yang cocok");
            console.log(`Hasil filter tingkat_lomba: ditemukan ${jsonTingkat.data.length} prestasi`);

            // Test mendali
            console.log(`Menguji filter mendali: "${firstP.mendali}"`);
            const resMedal = await fetch(`${BASE_URL}/prestasi?mendali=${firstP.mendali}`);
            const jsonMedal = await resMedal.json();
            assert.strictEqual(resMedal.status, 200);
            assert.ok(jsonMedal.data.every(p => p.mendali === firstP.mendali), "Semua hasil harus memiliki medali yang cocok");
            console.log(`Hasil filter mendali: ditemukan ${jsonMedal.data.length} prestasi`);

            // Test tahun
            console.log(`Menguji filter tahun: "${firstP.tahun}"`);
            const resTahun = await fetch(`${BASE_URL}/prestasi?tahun=${firstP.tahun}`);
            const jsonTahun = await resTahun.json();
            assert.strictEqual(resTahun.status, 200);
            assert.ok(jsonTahun.data.every(p => Number(p.tahun) === Number(firstP.tahun)), "Semua hasil harus memiliki tahun yang cocok");
            console.log(`Hasil filter tahun: ditemukan ${jsonTahun.data.length} prestasi`);

            // Test search
            const searchKeywordP = firstP.event_kejuaraan.substring(0, Math.ceil(firstP.event_kejuaraan.length / 2));
            console.log(`Menguji filter search prestasi (event): "${searchKeywordP}"`);
            const resSearchP = await fetch(`${BASE_URL}/prestasi?search=${encodeURIComponent(searchKeywordP)}`);
            const jsonSearchP = await resSearchP.json();
            assert.strictEqual(resSearchP.status, 200);
            assert.ok(jsonSearchP.data.length > 0, "Harus menemukan prestasi dengan search");
            console.log(`Hasil filter search: ditemukan ${jsonSearchP.data.length} prestasi`);
        }

        console.log("\n=== SEMUA PENGUJIAN FILTERING BERHASIL DENGAN SUKSES! ===");
    } catch (err) {
        console.error("\n!!! PENGUJIAN FILTERING GAGAL !!!", err);
        process.exit(1);
    }
}

runFilteringTests();
