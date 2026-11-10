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
  logoPemdaUrl: string;
  logoSekolahUrl: string;
  logoTasikmalayaUrl?: string | null;
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
  logoPemdaUrl: '/images/logo-tasikmalaya.png',
  logoSekolahUrl: '/images/logo-sekolah-3d.png',
  logoTasikmalayaUrl: '/images/logo-tasikmalaya.png',
};

const SETTINGS_KEY = 'adm_ujian_school_settings';

export function getStoredSchoolSettings(): SchoolSettings {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SCHOOL_SETTINGS;
    const parsed = JSON.parse(saved);
    const logoPemda = parsed.logoPemdaUrl || parsed.logoTasikmalayaUrl || DEFAULT_SCHOOL_SETTINGS.logoPemdaUrl;
    const logoSekolah = parsed.logoSekolahUrl || DEFAULT_SCHOOL_SETTINGS.logoSekolahUrl;
    return {
      ...DEFAULT_SCHOOL_SETTINGS,
      ...parsed,
      logoPemdaUrl: logoPemda,
      logoTasikmalayaUrl: logoPemda,
      logoSekolahUrl: logoSekolah,
    };
  } catch {
    return DEFAULT_SCHOOL_SETTINGS;
  }
}

export function saveStoredSchoolSettings(settings: SchoolSettings): void {
  if (typeof window !== 'undefined') {
    const toSave: SchoolSettings = {
      ...settings,
      logoTasikmalayaUrl: settings.logoPemdaUrl,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
    window.dispatchEvent(new Event('school-settings-updated'));
  }
}

export function resetStoredSchoolSettings(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SETTINGS_KEY);
    window.dispatchEvent(new Event('school-settings-updated'));
  }
}
