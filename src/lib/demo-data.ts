import { TahunAjaran, Kelas, Siswa, Mapel, Ruang, Ujian, JadwalUjian, PesertaUjian, NilaiUjian } from '@/types/database';

export const DEMO_TAHUN_AJARAN: TahunAjaran[] = [
  { id: 1, nama: '2026/2027', semester: 'Ganjil', status_aktif: true }
];

export const DEMO_KELAS: Kelas[] = [
  { id: 1, nama_kelas: 'X MIPA 1', tingkat: '10', jurusan: 'MIPA' },
  { id: 2, nama_kelas: 'X MIPA 2', tingkat: '10', jurusan: 'MIPA' },
  { id: 3, nama_kelas: 'X IPS 1', tingkat: '10', jurusan: 'IPS' },
];

export const DEMO_RUANG: Ruang[] = [
  { id: 1, kode_ruang: 'R-01', nama_ruang: 'Ruang 01 (Lab Komputer 1)', kapasitas: 20 },
  { id: 2, kode_ruang: 'R-02', nama_ruang: 'Ruang 02 (Lab Komputer 2)', kapasitas: 20 },
  { id: 3, kode_ruang: 'R-03', nama_ruang: 'Ruang 03 (Ruang Kelas 10A)', kapasitas: 24 },
];

export const DEMO_MAPEL: Mapel[] = [
  { id: 1, kode_mapel: 'BIN-10', nama_mapel: 'Bahasa Indonesia', kkm: 75.00 },
  { id: 2, kode_mapel: 'MTK-10', nama_mapel: 'Matematika Wajib', kkm: 70.00 },
  { id: 3, kode_mapel: 'BIG-10', nama_mapel: 'Bahasa Inggris', kkm: 75.00 },
  { id: 4, kode_mapel: 'FIS-10', nama_mapel: 'Fisika', kkm: 70.00 },
];

export const DEMO_SISWA: Siswa[] = [
  {
    id: 1,
    nisn: '0081234501',
    nis: '26001',
    nama_lengkap: 'Ahmad Fauzi Pratama',
    jenis_kelamin: 'L',
    kelas_id: 1,
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop'
  },
  {
    id: 2,
    nisn: '0081234502',
    nis: '26002',
    nama_lengkap: 'Bunga Citra Lestari',
    jenis_kelamin: 'P',
    kelas_id: 1,
    foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop'
  },
  {
    id: 3,
    nisn: '0081234503',
    nis: '26003',
    nama_lengkap: 'Candra Wijaya',
    jenis_kelamin: 'L',
    kelas_id: 1,
    foto_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=400&fit=crop'
  },
  {
    id: 4,
    nisn: '0081234504',
    nis: '26004',
    nama_lengkap: 'Dewi Sartika',
    jenis_kelamin: 'P',
    kelas_id: 1,
    foto_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop'
  },
  {
    id: 5,
    nisn: '0081234505',
    nis: '26005',
    nama_lengkap: 'Eko Prasetyo',
    jenis_kelamin: 'L',
    kelas_id: 1,
    foto_url: null
  },
  {
    id: 6,
    nisn: '0081234506',
    nis: '26006',
    nama_lengkap: 'Fitri Handayani',
    jenis_kelamin: 'P',
    kelas_id: 2,
    foto_url: null
  }
];

export const DEMO_UJIAN: Ujian[] = [
  {
    id: 1,
    tahun_ajaran_id: 1,
    nama_ujian: 'Sumatif Akhir Semester (SAS) Ganjil',
    jenis_ujian: 'SAS',
    tgl_mulai: '2026-11-20',
    tgl_selesai: '2026-11-28',
    tahun_ajaran: DEMO_TAHUN_AJARAN[0]
  }
];

export const DEMO_JADWAL: JadwalUjian[] = [
  { id: 1, ujian_id: 1, mapel_id: 1, tanggal: '2026-11-20', jam_mulai: '07:30', jam_selesai: '09:30', mapel: DEMO_MAPEL[0] },
  { id: 2, ujian_id: 1, mapel_id: 2, tanggal: '2026-11-21', jam_mulai: '07:30', jam_selesai: '09:30', mapel: DEMO_MAPEL[1] },
  { id: 3, ujian_id: 1, mapel_id: 3, tanggal: '2026-11-22', jam_mulai: '07:30', jam_selesai: '09:30', mapel: DEMO_MAPEL[2] },
  { id: 4, ujian_id: 1, mapel_id: 4, tanggal: '2026-11-23', jam_mulai: '07:30', jam_selesai: '09:30', mapel: DEMO_MAPEL[3] },
];

export const DEMO_PESERTA: PesertaUjian[] = [
  { id: 1, ujian_id: 1, siswa_id: 1, no_peserta: '01-001-001-8', ruang_id: 1, no_meja: 1, sesi: 1, siswa: DEMO_SISWA[0], ruang: DEMO_RUANG[0], ujian: DEMO_UJIAN[0] },
  { id: 2, ujian_id: 1, siswa_id: 2, no_peserta: '01-001-002-7', ruang_id: 1, no_meja: 2, sesi: 1, siswa: DEMO_SISWA[1], ruang: DEMO_RUANG[0], ujian: DEMO_UJIAN[0] },
  { id: 3, ujian_id: 1, siswa_id: 3, no_peserta: '01-001-003-6', ruang_id: 1, no_meja: 3, sesi: 1, siswa: DEMO_SISWA[2], ruang: DEMO_RUANG[0], ujian: DEMO_UJIAN[0] },
  { id: 4, ujian_id: 1, siswa_id: 4, no_peserta: '01-001-004-5', ruang_id: 1, no_meja: 4, sesi: 1, siswa: DEMO_SISWA[3], ruang: DEMO_RUANG[0], ujian: DEMO_UJIAN[0] },
  { id: 5, ujian_id: 1, siswa_id: 5, no_peserta: '01-001-005-4', ruang_id: 1, no_meja: 5, sesi: 1, siswa: DEMO_SISWA[4], ruang: DEMO_RUANG[0], ujian: DEMO_UJIAN[0] },
  { id: 6, ujian_id: 1, siswa_id: 6, no_peserta: '01-001-006-3', ruang_id: 2, no_meja: 1, sesi: 1, siswa: DEMO_SISWA[5], ruang: DEMO_RUANG[1], ujian: DEMO_UJIAN[0] },
];

export const DEMO_NILAI: NilaiUjian[] = [
  { id: 1, peserta_ujian_id: 1, jadwal_ujian_id: 1, nilai_pg: 50, nilai_esai: 35, nilai_akhir: 85, keterangan: 'Hadir' },
  { id: 2, peserta_ujian_id: 2, jadwal_ujian_id: 1, nilai_pg: 55, nilai_esai: 38, nilai_akhir: 93, keterangan: 'Hadir' },
  { id: 3, peserta_ujian_id: 3, jadwal_ujian_id: 1, nilai_pg: 40, nilai_esai: 28, nilai_akhir: 68, keterangan: 'Hadir' },
  { id: 4, peserta_ujian_id: 4, jadwal_ujian_id: 1, nilai_pg: 48, nilai_esai: 32, nilai_akhir: 80, keterangan: 'Hadir' },
  { id: 5, peserta_ujian_id: 5, jadwal_ujian_id: 1, nilai_pg: 35, nilai_esai: 30, nilai_akhir: 65, keterangan: 'Hadir' },
  
  { id: 6, peserta_ujian_id: 1, jadwal_ujian_id: 2, nilai_pg: 45, nilai_esai: 42, nilai_akhir: 87, keterangan: 'Hadir' },
  { id: 7, peserta_ujian_id: 2, jadwal_ujian_id: 2, nilai_pg: 40, nilai_esai: 35, nilai_akhir: 75, keterangan: 'Hadir' },
  { id: 8, peserta_ujian_id: 3, jadwal_ujian_id: 2, nilai_pg: 30, nilai_esai: 25, nilai_akhir: 55, keterangan: 'Hadir' },
  { id: 9, peserta_ujian_id: 4, jadwal_ujian_id: 2, nilai_pg: 48, nilai_esai: 40, nilai_akhir: 88, keterangan: 'Hadir' },
  { id: 10, peserta_ujian_id: 5, jadwal_ujian_id: 2, nilai_pg: 38, nilai_esai: 34, nilai_akhir: 72, keterangan: 'Hadir' },

  { id: 11, peserta_ujian_id: 1, jadwal_ujian_id: 3, nilai_pg: 50, nilai_esai: 40, nilai_akhir: 90, keterangan: 'Hadir' },
  { id: 12, peserta_ujian_id: 2, jadwal_ujian_id: 3, nilai_pg: 45, nilai_esai: 38, nilai_akhir: 83, keterangan: 'Hadir' },
  { id: 13, peserta_ujian_id: 3, jadwal_ujian_id: 3, nilai_pg: 42, nilai_esai: 35, nilai_akhir: 77, keterangan: 'Hadir' },
  { id: 14, peserta_ujian_id: 4, jadwal_ujian_id: 3, nilai_pg: 49, nilai_esai: 42, nilai_akhir: 91, keterangan: 'Hadir' },
  { id: 15, peserta_ujian_id: 5, jadwal_ujian_id: 3, nilai_pg: 35, nilai_esai: 35, nilai_akhir: 70, keterangan: 'Hadir' },
];

