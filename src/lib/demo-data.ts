import { TahunAjaran, Kelas, Siswa, Mapel, Ruang, Ujian, JadwalUjian, PesertaUjian, NilaiUjian } from '@/types/database';

export const DEMO_TAHUN_AJARAN: TahunAjaran[] = [
  { id: 1, nama: '2026/2027', semester: 'Ganjil', status_aktif: true }
];

export const DEMO_KELAS: Kelas[] = [
  // Tingkat 7 (11 Kelas)
  { id: 1, nama_kelas: 'VII-A', tingkat: '7', jurusan: null },
  { id: 2, nama_kelas: 'VII-B', tingkat: '7', jurusan: null },
  { id: 3, nama_kelas: 'VII-C', tingkat: '7', jurusan: null },
  { id: 4, nama_kelas: 'VII-D', tingkat: '7', jurusan: null },
  { id: 5, nama_kelas: 'VII-E', tingkat: '7', jurusan: null },
  { id: 6, nama_kelas: 'VII-F', tingkat: '7', jurusan: null },
  { id: 7, nama_kelas: 'VII-G', tingkat: '7', jurusan: null },
  { id: 8, nama_kelas: 'VII-H', tingkat: '7', jurusan: null },
  { id: 9, nama_kelas: 'VII-I', tingkat: '7', jurusan: null },
  { id: 10, nama_kelas: 'VII-J', tingkat: '7', jurusan: null },
  { id: 11, nama_kelas: 'VII-K', tingkat: '7', jurusan: null },

  // Tingkat 8 (11 Kelas)
  { id: 12, nama_kelas: 'VIII-A', tingkat: '8', jurusan: null },
  { id: 13, nama_kelas: 'VIII-B', tingkat: '8', jurusan: null },
  { id: 14, nama_kelas: 'VIII-C', tingkat: '8', jurusan: null },
  { id: 15, nama_kelas: 'VIII-D', tingkat: '8', jurusan: null },
  { id: 16, nama_kelas: 'VIII-E', tingkat: '8', jurusan: null },
  { id: 17, nama_kelas: 'VIII-F', tingkat: '8', jurusan: null },
  { id: 18, nama_kelas: 'VIII-G', tingkat: '8', jurusan: null },
  { id: 19, nama_kelas: 'VIII-H', tingkat: '8', jurusan: null },
  { id: 20, nama_kelas: 'VIII-I', tingkat: '8', jurusan: null },
  { id: 21, nama_kelas: 'VIII-J', tingkat: '8', jurusan: null },
  { id: 22, nama_kelas: 'VIII-K', tingkat: '8', jurusan: null },

  // Tingkat 9 (11 Kelas)
  { id: 23, nama_kelas: 'IX-A', tingkat: '9', jurusan: null },
  { id: 24, nama_kelas: 'IX-B', tingkat: '9', jurusan: null },
  { id: 25, nama_kelas: 'IX-C', tingkat: '9', jurusan: null },
  { id: 26, nama_kelas: 'IX-D', tingkat: '9', jurusan: null },
  { id: 27, nama_kelas: 'IX-E', tingkat: '9', jurusan: null },
  { id: 28, nama_kelas: 'IX-F', tingkat: '9', jurusan: null },
  { id: 29, nama_kelas: 'IX-G', tingkat: '9', jurusan: null },
  { id: 30, nama_kelas: 'IX-H', tingkat: '9', jurusan: null },
  { id: 31, nama_kelas: 'IX-I', tingkat: '9', jurusan: null },
  { id: 32, nama_kelas: 'IX-J', tingkat: '9', jurusan: null },
  { id: 33, nama_kelas: 'IX-K', tingkat: '9', jurusan: null },
];

export const DEMO_RUANG: Ruang[] = DEMO_KELAS.map((k, idx) => ({
  id: k.id,
  kode_ruang: 'R-' + (idx + 1).toString().padStart(2, '0'),
  nama_ruang: 'Ruang ' + (idx + 1).toString().padStart(2, '0') + ' (' + k.nama_kelas + ')',
  kapasitas: 36,
}));

// 11 Mata Pelajaran Resmi Sesuai Permintaan
export const DEMO_MAPEL: Mapel[] = [
  { id: 1, kode_mapel: 'PAIBP', nama_mapel: 'PAIBP', kkm: 75.00 },
  { id: 2, kode_mapel: 'PPKN', nama_mapel: 'PPKN', kkm: 75.00 },
  { id: 3, kode_mapel: 'BIND', nama_mapel: 'Bahasa Indonesia', kkm: 75.00 },
  { id: 4, kode_mapel: 'MTK', nama_mapel: 'Matematika', kkm: 70.00 },
  { id: 5, kode_mapel: 'BING', nama_mapel: 'Bahasa Inggris', kkm: 75.00 },
  { id: 6, kode_mapel: 'IPA', nama_mapel: 'IPA', kkm: 72.00 },
  { id: 7, kode_mapel: 'IPS', nama_mapel: 'IPS', kkm: 75.00 },
  { id: 8, kode_mapel: 'INF', nama_mapel: 'Informatika', kkm: 75.00 },
  { id: 9, kode_mapel: 'SBP', nama_mapel: 'Seni Budaya dan Prakarya', kkm: 75.00 },
  { id: 10, kode_mapel: 'PJOK', nama_mapel: 'PJOK', kkm: 75.00 },
  { id: 11, kode_mapel: 'BSUN', nama_mapel: 'Bahasa Sunda', kkm: 75.00 },
];

// Data Siswa Bersih (0 Data Dummy, siap diimpor dari Excel)
export const DEMO_SISWA: Siswa[] = [];

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

export const DEMO_JADWAL: JadwalUjian[] = DEMO_MAPEL.map((mapel, idx) => ({
  id: idx + 1,
  ujian_id: 1,
  mapel_id: mapel.id,
  tanggal: '2026-11-' + (20 + (idx % 8)).toString().padStart(2, '0'),
  jam_mulai: '07:30',
  jam_selesai: '09:30',
  mapel: mapel,
}));

export function generatePesertaFromSiswa(siswaList: Siswa[]): PesertaUjian[] {
  if (!siswaList || siswaList.length === 0) return [];
  const deskCount: Record<number, number> = {};
  return siswaList.map((siswa, idx) => {
    const kId = siswa.kelas_id || 1;
    deskCount[kId] = (deskCount[kId] || 0) + 1;
    const noMeja = deskCount[kId];
    const ruang = DEMO_RUANG.find(r => r.id === kId) || DEMO_RUANG[0];
    const noPeserta = '01-' + kId.toString().padStart(2, '0') + '-' + noMeja.toString().padStart(3, '0');
    return {
      id: siswa.id || (idx + 1),
      ujian_id: 1,
      siswa_id: siswa.id,
      no_peserta: noPeserta,
      ruang_id: ruang.id,
      no_meja: noMeja,
      sesi: 1,
      siswa: siswa,
      ruang: ruang,
      ujian: DEMO_UJIAN[0]
    };
  });
}

export const DEMO_PESERTA: PesertaUjian[] = generatePesertaFromSiswa(DEMO_SISWA);

// Nilai Ujian Bersih (0 Data Dummy, siap diisi/diimpor dari Excel)
export const DEMO_NILAI: NilaiUjian[] = [];
