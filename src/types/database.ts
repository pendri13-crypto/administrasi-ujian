export interface TahunAjaran {
  id: number;
  nama: string;
  semester: 'Ganjil' | 'Genap';
  status_aktif: boolean;
}

export interface Kelas {
  id: number;
  nama_kelas: string;
  tingkat: string;
  jurusan?: string | null;
}

export interface Siswa {
  id: number;
  nisn: string;
  nis?: string | null;
  nama_lengkap: string;
  jenis_kelamin: 'L' | 'P';
  kelas_id: number;
  foto_url?: string | null;
  kelas?: Kelas;
}

export interface Mapel {
  id: number;
  kode_mapel: string;
  nama_mapel: string;
  kkm: number;
}

export interface Ruang {
  id: number;
  kode_ruang: string;
  nama_ruang: string;
  kapasitas: number;
}

export interface Ujian {
  id: number;
  tahun_ajaran_id: number;
  nama_ujian: string;
  jenis_ujian: 'PTS' | 'PAS' | 'PAT' | 'US' | 'Simulasi' | 'SAS' | 'STS';
  tgl_mulai: string;
  tgl_selesai: string;
  tahun_ajaran?: TahunAjaran;
}

export interface JadwalUjian {
  id: number;
  ujian_id: number;
  mapel_id: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  mapel?: Mapel;
}

export interface PesertaUjian {
  id: number;
  ujian_id: number;
  siswa_id: number;
  no_peserta: string;
  ruang_id?: number | null;
  no_meja?: number | null;
  sesi: number;
  siswa?: Siswa;
  ruang?: Ruang;
  ujian?: Ujian;
}

export interface NilaiUjian {
  id: number;
  peserta_ujian_id: number;
  jadwal_ujian_id: number;
  nilai_pg: number;
  nilai_esai: number;
  nilai_akhir: number;
  keterangan: 'Hadir' | 'Susulan' | 'Tidak Hadir';
  peserta?: PesertaUjian;
  jadwal?: JadwalUjian;
}

export interface SplitGroupRule {
  id: string;
  kelas_id: number;
  label?: string;
  start_urut: number;
  end_urut: number;
  target_ruang_id: number;
  posisi: 'kiri' | 'kanan';
  start_meja?: number;
}

