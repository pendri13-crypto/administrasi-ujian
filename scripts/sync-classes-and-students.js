const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data_siswa_sekolah.csv');
const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);
const rows = lines.slice(1);

const classNames = [
  'VII-A', 'VII-B', 'VII-C', 'VII-D', 'VII-E', 'VII-F', 'VII-G', 'VII-H', 'VII-I', 'VII-J', 'VII-K',
  'VIII-A', 'VIII-B', 'VIII-C', 'VIII-D', 'VIII-E', 'VIII-F', 'VIII-G', 'VIII-H', 'VIII-I', 'VIII-J', 'VIII-K',
  'IX-A', 'IX-B', 'IX-C', 'IX-D', 'IX-E', 'IX-F', 'IX-G', 'IX-H', 'IX-I', 'IX-J', 'IX-K'
];

const classMap = {};
classNames.forEach((c, idx) => {
  classMap[c] = idx + 1;
});

const samplePhotos = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
];

const studentObjects = rows.map((l, idx) => {
  const parts = l.split(',');
  const nisn = parts[0].trim();
  const nis = parts[1].trim();
  const nama_lengkap = parts[2].trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const jenis_kelamin = parts[3].trim().toUpperCase() === 'P' ? 'P' : 'L';
  const kelas = parts[4].trim();
  const kelas_id = classMap[kelas] || 1;
  const foto = idx < samplePhotos.length ? `'${samplePhotos[idx]}'` : 'null';
  return `  { id: ${idx + 1}, nisn: '${nisn}', nis: '${nis}', nama_lengkap: '${nama_lengkap}', jenis_kelamin: '${jenis_kelamin}', kelas_id: ${kelas_id}, foto_url: ${foto} },`;
});

const out = `import { TahunAjaran, Kelas, Siswa, Mapel, Ruang, Ujian, JadwalUjian, PesertaUjian, NilaiUjian } from '@/types/database';

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

export const DEMO_MAPEL: Mapel[] = [
  { id: 1, kode_mapel: 'BIN-SMP', nama_mapel: 'Bahasa Indonesia', kkm: 75.00 },
  { id: 2, kode_mapel: 'MTK-SMP', nama_mapel: 'Matematika', kkm: 70.00 },
  { id: 3, kode_mapel: 'BIG-SMP', nama_mapel: 'Bahasa Inggris', kkm: 75.00 },
  { id: 4, kode_mapel: 'IPA-SMP', nama_mapel: 'Ilmu Pengetahuan Alam (IPA)', kkm: 72.00 },
  { id: 5, kode_mapel: 'IPS-SMP', nama_mapel: 'Ilmu Pengetahuan Sosial (IPS)', kkm: 75.00 },
  { id: 6, kode_mapel: 'PPKN-SMP', nama_mapel: 'Pendidikan Pancasila & Kewarganegaraan', kkm: 75.00 },
  { id: 7, kode_mapel: 'PAI-SMP', nama_mapel: 'Pendidikan Agama & Budi Pekerti', kkm: 75.00 },
  { id: 8, kode_mapel: 'INF-SMP', nama_mapel: 'Informatika', kkm: 75.00 },
];

export const DEMO_SISWA: Siswa[] = [
${studentObjects.join('\n')}
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

export const DEMO_PESERTA: PesertaUjian[] = (() => {
  const deskCount: Record<number, number> = {};
  return DEMO_SISWA.map((siswa, idx) => {
    const kId = siswa.kelas_id;
    deskCount[kId] = (deskCount[kId] || 0) + 1;
    const noMeja = deskCount[kId];
    const ruang = DEMO_RUANG.find(r => r.id === kId) || DEMO_RUANG[0];
    const noPeserta = '01-' + kId.toString().padStart(2, '0') + '-' + noMeja.toString().padStart(3, '0');
    return {
      id: idx + 1,
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
})();

export const DEMO_NILAI: NilaiUjian[] = (() => {
  const result: NilaiUjian[] = [];
  let id = 1;
  DEMO_PESERTA.forEach(p => {
    DEMO_JADWAL.forEach(j => {
      const pg = 38 + ((p.id * 7 + j.id * 13) % 22);
      const esai = 26 + ((p.id * 11 + j.id * 17) % 14);
      const nilai_akhir = Math.min(100, pg + esai);
      result.push({
        id: id++,
        peserta_ujian_id: p.id,
        jadwal_ujian_id: j.id,
        nilai_pg: pg,
        nilai_esai: esai,
        nilai_akhir: nilai_akhir,
        keterangan: 'Hadir'
      });
    });
  });
  return result;
})();
`;

const destPath = path.join(__dirname, '..', 'src', 'lib', 'demo-data.ts');
fs.writeFileSync(destPath, out, 'utf8');
console.log('Successfully generated', destPath);

