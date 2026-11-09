export interface SchoolSettings {
  namaInstansi: string;
  namaSekolah: string;
  alamatSekolah: string;
  jenisAsesmen: 'SAS' | 'SAT';
  namaUjian: string;
  tahunAjaran: string;
  semester: string;
  jabatanKepsek: string;
  namaKepsek: string;
  nipKepsek: string;
  kotaTtd: string;
  tanggalTtd: string;
  ttdKepsekUrl: string;
  logoTasikmalayaUrl?: string | null;
  logoSekolahUrl?: string | null;
}

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  namaInstansi: 'PEMERINTAH KABUPATEN TASIKMALAYA',
  namaSekolah: 'SMP NEGERI 1 RAJAPOLAH',
  alamatSekolah: 'Jl. Raya Rajapolah No. 1 • Kab. Tasikmalaya',
  jenisAsesmen: 'SAS',
  namaUjian: 'SUMATIF AKHIR SEMESTER (SAS)',
  tahunAjaran: '2025/2026',
  semester: 'Ganjil',
  jabatanKepsek: 'Kepala SMPN 1 Rajapolah,',
  namaKepsek: 'H. UCU KARNI, M.Pd.',
  nipKepsek: '19671116 199203 1 005',
  kotaTtd: 'Rajapolah',
  tanggalTtd: '30 November 2026',
  ttdKepsekUrl: '/images/ttd-kepsek.png',
  logoTasikmalayaUrl: '/images/logo-tasikmalaya.png',
  logoSekolahUrl: '/images/logo-smpn1-rajapolah.png',
};

const SETTINGS_KEY = 'adm_ujian_school_settings';

export function getStoredSchoolSettings(): SchoolSettings {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SCHOOL_SETTINGS;
    return { ...DEFAULT_SCHOOL_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_SCHOOL_SETTINGS;
  }
}

export function saveStoredSchoolSettings(settings: SchoolSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('school-settings-updated'));
  }
}

export function resetStoredSchoolSettings(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SETTINGS_KEY);
    window.dispatchEvent(new Event('school-settings-updated'));
  }
}
