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
  namaInstansi: 'PEMERINTAH PROVINSI / DINAS PENDIDIKAN',
  namaSekolah: 'SMA / SMK NEGERI 1 KOTA PENDIDIKAN',
  alamatSekolah: 'Jl. Pendidikan No. 45 • Telp: (021) 7891011',
  namaUjian: 'Sumatif Akhir Semester (SAS) Ganjil',
  tahunAjaran: '2026/2027',
  semester: 'Ganjil',
  namaKepsek: 'Drs. H. Mulyadi, M.Pd.',
  nipKepsek: '19780512 200501 1 002',
  kotaTtd: 'Kota Pendidikan',
  tanggalTtd: '25 November 2026',
  logoUrl: null,
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

