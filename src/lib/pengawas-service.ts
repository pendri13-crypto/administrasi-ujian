import { Pengawas, JadwalPengawasSession } from '@/types/database';

export const PENGAWAS_STORAGE_KEY = 'adm_pengawas_data';
export const JADWAL_PENGAWAS_STORAGE_KEY = 'adm_jadwal_pengawas_data';

export const INITIAL_PENGAWAS: Pengawas[] = [
  { id: 1, kode: 1, nama: 'H. Yusuf Nurjaman, S.Pd., M.M.Pd.', nip: '-' },
  { id: 2, kode: 2, nama: 'Didi Sadri Usman, S.Pd.', nip: '-' },
  { id: 3, kode: 3, nama: 'Dra. Teti Rohdiati, M.Pd.', nip: '-' },
  { id: 4, kode: 4, nama: 'H.Tatang Sudanawan, S.Pd', nip: '-' },
  { id: 5, kode: 5, nama: 'Hj. Srinaningsih, S.Pd.', nip: '-' },
  { id: 6, kode: 6, nama: 'Ai Tarliani, S.Pd.', nip: '-' },
  { id: 7, kode: 7, nama: 'Imas Halimah, S.Pd', nip: '-' },
  { id: 8, kode: 8, nama: 'Ade Ipin Supriatin, S.Pd.', nip: '-' },
  { id: 9, kode: 9, nama: 'Basar, S.Ag, M.M.Pd.', nip: '-' },
  { id: 10, kode: 10, nama: 'Kendra Permana, S.Pd', nip: '-' },
  { id: 11, kode: 11, nama: 'Widi Restuti, S.Pd.', nip: '-' },
  { id: 12, kode: 12, nama: 'Dra. Yeyeh Sopiah', nip: '-' },
  { id: 13, kode: 13, nama: "Be'ah Rubae'ah, S.Pd.", nip: '-' },
  { id: 14, kode: 14, nama: 'Enung Wasilah, S.Pd.', nip: '-' },
  { id: 15, kode: 15, nama: 'Anwar Musadad, S.Pd.', nip: '-' },
  { id: 16, kode: 16, nama: 'Mamat Rahmat, A.Md.', nip: '-' },
  { id: 17, kode: 17, nama: 'Reni Nuraeni, S.Pd', nip: '-' },
  { id: 18, kode: 18, nama: 'Enung Riwayati, S.Pd.', nip: '-' },
  { id: 19, kode: 19, nama: 'Dede Nurhayati, S.Pd.', nip: '-' },
  { id: 20, kode: 20, nama: 'Nanik Dwi Astuti, M.Pd.', nip: '-' },
  { id: 21, kode: 21, nama: 'Nenden Sri Utari, S.Pd', nip: '-' },
  { id: 22, kode: 22, nama: 'Mey Mey Trikusdiani, S.Pd.', nip: '-' },
  { id: 23, kode: 23, nama: 'Edi Darwadi, S.Pd', nip: '-' },
  { id: 24, kode: 24, nama: 'Hj. Ani Mardiani, S.Pd', nip: '-' },
  { id: 25, kode: 25, nama: 'Miftah Saepul Anwar, S.Pd', nip: '-' },
  { id: 26, kode: 26, nama: 'Rika Mudrika, S.HI', nip: '-' },
  { id: 27, kode: 27, nama: 'Elis Kurniati, S.Pd', nip: '-' },
  { id: 28, kode: 28, nama: 'Tarisniati Darisman, S.Pd.', nip: '-' },
  { id: 29, kode: 29, nama: 'Siti Saadah, S.Pd', nip: '-' },
  { id: 30, kode: 30, nama: 'Santi Sri Rahayu, S.Pd.', nip: '-' },
  { id: 31, kode: 31, nama: 'Cepi Romdoni Fajar, S.Pd', nip: '-' },
  { id: 32, kode: 32, nama: 'Heni Nur Azizah, S.Pd.', nip: '-' },
  { id: 33, kode: 33, nama: 'Fauzan Ilham, S.Pd', nip: '-' },
  { id: 34, kode: 34, nama: 'Aris Sunandar, S.Pd', nip: '-' },
  { id: 35, kode: 35, nama: 'Widya Imardhea, S.Pd', nip: '-' },
  { id: 36, kode: 36, nama: 'Saepul Hakim, S.Pd', nip: '-' },
  { id: 37, kode: 37, nama: 'Yona Mahya Maulani, S.Pd', nip: '-' },
];

function arrayToRoomMap(arr: number[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (let i = 0; i < arr.length; i++) {
    map[i + 1] = arr[i];
  }
  return map;
}

export const INITIAL_JADWAL_PENGAWAS: JadwalPengawasSession[] = [
  {
    id: 1,
    hari_tanggal: 'Senin, 30 November 2026',
    waktu: '08.00 – 09.30',
    mapel: 'PAIBP',
    ruang_pengawas: arrayToRoomMap([
      33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 37, 36, 35, 7, 6, 5, 4, 3, 2
    ]),
  },
  {
    id: 2,
    hari_tanggal: 'Senin, 30 November 2026',
    waktu: '10.00 – 11.30',
    mapel: 'Bahasa Indonesia',
    ruang_pengawas: arrayToRoomMap([
      2, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 37, 36, 35, 7, 6, 5, 4, 3
    ]),
  },
  {
    id: 3,
    hari_tanggal: 'Selasa, 1 Desember 2026',
    waktu: '08.00 – 09.30',
    mapel: 'IPS',
    ruang_pengawas: arrayToRoomMap([
      18, 19, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 34, 35, 36, 37
    ]),
  },
  {
    id: 4,
    hari_tanggal: 'Selasa, 1 Desember 2026',
    waktu: '10.00 – 11.30',
    mapel: 'Bahasa Inggris',
    ruang_pengawas: arrayToRoomMap([
      37, 18, 19, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 34, 35, 36
    ]),
  },
  {
    id: 5,
    hari_tanggal: 'Rabu, 2 Desember 2026',
    waktu: '08.00 – 09.30',
    mapel: 'IPA',
    ruang_pengawas: arrayToRoomMap([
      36, 37, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 7, 10, 11, 12, 13, 14, 15, 16, 17, 1, 2, 3, 4
    ]),
  },
  {
    id: 6,
    hari_tanggal: 'Rabu, 2 Desember 2026',
    waktu: '10.00 – 11.30',
    mapel: 'Pend. Pancasila',
    ruang_pengawas: arrayToRoomMap([
      4, 36, 37, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 7, 10, 11, 12, 13, 14, 15, 16, 17, 1, 2, 3
    ]),
  },
  {
    id: 7,
    hari_tanggal: 'Kamis, 3 Desember 2026',
    waktu: '08.00 – 09.30',
    mapel: 'Matematika',
    ruang_pengawas: arrayToRoomMap([
      31, 32, 33, 34, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
    ]),
  },
  {
    id: 8,
    hari_tanggal: 'Kamis, 3 Desember 2026',
    waktu: '10.00 – 11.30',
    mapel: 'Bahasa Sunda',
    ruang_pengawas: arrayToRoomMap([
      30, 31, 32, 33, 34, 21, 22, 23, 24, 25, 26, 27, 28, 29, 20, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
    ]),
  },
];

export function getStoredPengawas(): Pengawas[] {
  if (typeof window === 'undefined') return INITIAL_PENGAWAS;
  try {
    const raw = localStorage.getItem(PENGAWAS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading pengawas from localStorage:', e);
  }
  return INITIAL_PENGAWAS;
}

export function saveStoredPengawas(list: Pengawas[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENGAWAS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('pengawas-updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error saving pengawas to localStorage:', e);
  }
}

export function getStoredJadwalPengawas(): JadwalPengawasSession[] {
  if (typeof window === 'undefined') return INITIAL_JADWAL_PENGAWAS;
  try {
    const raw = localStorage.getItem(JADWAL_PENGAWAS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading jadwal pengawas from localStorage:', e);
  }
  return INITIAL_JADWAL_PENGAWAS;
}

export function saveStoredJadwalPengawas(list: JadwalPengawasSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(JADWAL_PENGAWAS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('jadwal-pengawas-updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error saving jadwal pengawas to localStorage:', e);
  }
}
