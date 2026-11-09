# Sistem Administrasi Ujian Sekolah (Next.js + Supabase + Vercel)

Aplikasi administrasi ujian sekolah modern yang siap dihosting **100% GRATIS** menggunakan **Vercel** dan **Supabase**.

---

## 🌟 Fitur Utama

1. **Cetak Kartu Peserta Ujian:**
   * Layout kertas A4 presisi (pilihan 4 kartu/halaman atau 2 kartu/halaman).
   * Dilengkapi pas foto 3x4 siswa.
   * Nomor peserta, ruang ujian, nomor meja, sesi, kop surat sekolah, dan tanda tangan kepala sekolah.
2. **Daftar Nilai Per Kelas (Leger):**
   * Matriks nilai seluruh mata pelajaran per rombel.
   * Total nilai, rata-rata nilai siswa, dan deteksi otomatis status KKM (Tuntas/Remedial).
3. **Daftar Nilai Per Mata Pelajaran:**
   * Laporan nilai pilihan ganda, esai, dan nilai akhir untuk guru pengampu.
   * Pemeringkatan/ranking otomatis dari nilai tertinggi ke terendah.
   * Statistik ringkas: rata-rata kelas, nilai tertinggi/terendah, dan persentase kelulusan KKM.
4. **Daftar Hadir Per Ruang:**
   * Lembar presensi resmi per ruangan ujian.
   * Kolom tanda tangan selang-seling (ganjil di kiri, genap di kanan).
   * Catatan berita acara ringkas pengawas ruang 1 dan pengawas 2.
5. **Manajemen Siswa & Upload Foto:**
   * Form tambah siswa cepat.
   * Fitur upload dan ganti foto siswa langsung dari tabel.

---

## 🚀 Panduan Setup & Hosting Gratis

### Langkah 1: Buat Database Gratis di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan daftar akun gratis.
2. Klik **New Project**, beri nama (misal: `adm-ujian-sekolah`) dan buat password database.
3. Buka menu **SQL Editor** di dashboard Supabase.
4. Salin seluruh isi file `supabase_schema.sql` di proyek ini, tempelkan ke SQL Editor Supabase, lalu klik **Run**.
5. Buka menu **Project Settings > API**:
   * Salin `Project URL`
   * Salin `anon public key`

---

### Langkah 2: Deploy Gratis ke Vercel
1. Buat repository baru di [GitHub](https://github.com) dan unggah (*push*) kode aplikasi ini.
2. Buka [https://vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
3. Klik **Add New Project** dan pilih repository `adm-ujian` Anda.
4. Pada bagian **Environment Variables**, tambahkan:
   * `NEXT_PUBLIC_SUPABASE_URL` = (Project URL dari Supabase)
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Anon Key dari Supabase)
5. Klik **Deploy**.
6. Dalam 1–2 menit, website Anda sudah aktif di internet dengan domain gratis (contoh: `https://adm-ujian.vercel.app`) dan dapat langsung digunakan oleh panitia ujian!

---

## 💻 Menjalankan di Komputer Lokal

Jika ingin menjalankan atau mengembangkan di laptop/PC:
```bash
# 1. Install dependencies
npm install

# 2. Jalankan server lokal
npm run dev

# 3. Buka di browser
# http://localhost:3000
```
> **Catatan:** Jika Anda bekerja di Google Drive Desktop Sync, disarankan untuk meng-copy folder proyek ke drive lokal (seperti `C:\Users\...`) agar proses `npm install` tidak terganggu oleh sinkronisasi file cloud.

