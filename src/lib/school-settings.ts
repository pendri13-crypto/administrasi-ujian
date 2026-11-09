export interface SchoolSettings {
  namaInstansi: string;
  namaSekolah: string;
  alamatSekolah: string;
  namaUjian: string;
  tahunAjaran: string;
  semester: string;
  namaKepsek: string;
  nipKepsek: string;
  kotaTtd: string;
  tanggalTtd: string;
  logoUrl?: string | null;
}

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  namaInstansi: 'PEMERINTAH KABUPATEN TASIKMALAYA',
  namaSekolah: 'SMP NEGERI 1 RAJAPOLAH',
  alamatSekolah: 'Jl. Raya Rajapolah No. 1 • Kab. Tasikmalaya',
  namaUjian: 'Sumatif Akhir Semester (SAS)',
  tahunAjaran: '2025/2026',
  semester: 'Ganjil',
  namaKepsek: 'H. UCU KARNI, M.Pd.',
  nipKepsek: '19671116 199203 1 005',
  kotaTtd: 'Rajapolah',
  tanggalTtd: '30 November 2026',
  logoUrl: '/images/logo-smpn1-rajapolah.png',
};

export function getStoredSchoolSettings(): SchoolSettings {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_SETTINGS;
  try {
    const saved = localStorage.getItem('adm_ujian_school_settings');
    return saved ? { ...DEFAULT_SCHOOL_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SCHOOL_SETTINGS;
  } catch {
    return DEFAULT_SCHOOL_SETTINGS;
  }
}

export function saveStoredSchoolSettings(settings: SchoolSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adm_ujian_school_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('school-settings-updated'));
  }
}

