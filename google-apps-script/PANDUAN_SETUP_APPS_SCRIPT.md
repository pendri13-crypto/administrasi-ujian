# PANDUAN LENGKAP: MENGUBAH APLIKASI KE GOOGLE SPREADSHEET & APPS SCRIPT
### SMP NEGERI 1 RAJAPOLAH

Sistem ini memungkinkan seluruh data (1.094 siswa, ruang, kartu peserta, daftar hadir) disimpan di **Google Spreadsheet** dan tampilannya dijalankan gratis via **Google Apps Script Web App** tanpa perlu server, hosting, XAMPP, atau Laragon.

---

### File yang Telah Disiapkan:
1. **`Database_Administrasi_Ujian_SMPN1Rajapolah.xlsx`** (File Excel lengkap dengan 7 sheet: `Data_Siswa`, `Kartu_Peserta`, `Ruang_Ujian`, `Kelas`, `Mata_Pelajaran`, `Jadwal_Ujian`, `Pengaturan`).
2. **`google-apps-script/Code.gs`** (Kode backend Apps Script untuk membaca data dari Spreadsheet).
3. **`google-apps-script/Index.html`** (Tampilan web responsif + Cetak F4 Folio Grid 2x3).

---

### Langkah 1: Unggah Database ke Google Drive & Spreadsheet
1. Buka [Google Drive](https://drive.google.com).
2. Klik tombol **+ Baru (+ New)** &rarr; **Upload File**.
3. Pilih file **`Database_Administrasi_Ujian_SMPN1Rajapolah.xlsx`** yang ada di folder proyek ini.
4. Setelah terunggah, klik ganda file tersebut &rarr; pilih **Buka dengan Google Spreadsheet (Open with Google Sheets)**.
5. Simpan sebagai Google Spreadsheet resmi (**File &rarr; Simpan sebagai Google Spreadsheet**).

---

### Langkah 2: Buka Editor Google Apps Script
1. Di halaman Google Spreadsheet tadi, klik menu:
   👉 **Ekstensi (Extensions)** &rarr; **Apps Script**.
2. Editor Apps Script akan terbuka di tab baru.

---

### Langkah 3: Masukkan Kode Apps Script
1. **File `Code.gs`**:
   - Hapus semua kode default di `Code.gs`.
   - Buka file [google-apps-script/Code.gs](file:///c:/xampp/htdocs/ADM%20UJIAN/google-apps-script/Code.gs) pada komputer Anda, salin seluruh kodenya, lalu tempel (*paste*) ke `Code.gs` di Apps Script.
   
2. **File `Index.html`**:
   - Di panel kiri Apps Script, klik tombol **+ (Tambah file)** di sebelah tulisan *Files / File* &rarr; pilih **HTML**.
   - Beri nama file: `Index` (huruf I besar, tanpa mengetik .html).
   - Hapus kode bawaan di `Index.html`.
   - Buka file [google-apps-script/Index.html](file:///c:/xampp/htdocs/ADM%20UJIAN/google-apps-script/Index.html) pada komputer Anda, salin seluruh isinya, lalu tempel (*paste*) ke `Index.html`.

3. Klik ikon **Simpan (Save)** 💾 di bagian atas.

---

### Langkah 4: Terapkan Sebagai Aplikasi Web (Deploy Web App)
1. Di pojok kanan atas Apps Script, klik tombol biru **Terapkan (Deploy)** &rarr; pilih **Penerapan baru (New deployment)**.
2. Di sebelah kiri (ikon gerigi / roda gigi), pilih **Aplikasi web (Web app)**.
3. Konfigurasikan:
   - **Deskripsi:** `Aplikasi Administrasi Ujian SMPN 1 Rajapolah`
   - **Jalankan sebagai (Execute as):** `Saya (email Anda)`
   - **Siapa yang memiliki akses (Who has access):** `Siapa saja (Anyone)` *(agar guru/panitia lain bisa membuka tanpa login)*
4. Klik tombol **Terapkan (Deploy)**.
5. Jika muncul jendela otorisasi izin Google:
   - Klik **Tinjau Izin (Review Permissions)**.
   - Pilih akun Google Anda.
   - Klik **Lanjutan (Advanced)** di kiri bawah &rarr; klik **Buka Sistem Administrasi Ujian (tidak aman) / Go to ... (unsafe)**.
   - Klik **Izinkan (Allow)**.

---

### Langkah 5: Aplikasi Siap Digunakan!
Google akan memberikan tautan **URL Aplikasi Web**, contoh:
`https://script.google.com/macros/s/AKfycbx.../exec`

- Klik link tersebut dan aplikasi akan langsung terbuka di browser!
- Anda dapat mencetak Kartu Peserta Ujian (Kertas F4 / Folio Grid 2x3), Daftar Hadir Ruangan, dan melihat data siswa.
- **Setiap ada data baru yang Anda ketik atau ubah di Google Spreadsheet, aplikasi web ini akan otomatis ter-update!**
