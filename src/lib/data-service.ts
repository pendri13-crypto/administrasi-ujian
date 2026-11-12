import { supabase, isSupabaseConfigured } from './supabase';
import { Siswa, NilaiUjian, PesertaUjian, Ruang, SplitGroupRule } from '@/types/database';
import { SchoolSettings, getStoredSchoolSettings, saveStoredSchoolSettings } from './school-settings';
import { DEMO_KELAS, DEMO_RUANG } from './demo-data';

const SISWA_STORAGE_KEY = 'adm_siswa_data';
const NILAI_STORAGE_KEY = 'adm_nilai_data';
const RUANG_STORAGE_KEY = 'adm_ruang_data';
const SPLIT_RULES_STORAGE_KEY = 'adm_split_rules';

/**
 * Mengambil aturan split & mapping ruang siswa dari localStorage
 */
export function getStoredSplitRules(): SplitGroupRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SPLIT_RULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading split rules from localStorage:', e);
  }
  return [];
}

/**
 * Menyimpan aturan split & mapping ruang siswa ke localStorage
 */
export function saveStoredSplitRules(rules: SplitGroupRule[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SPLIT_RULES_STORAGE_KEY, JSON.stringify(rules));
  window.dispatchEvent(new Event('split-rules-updated'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Mengambil data ruang dari localStorage atau default ke DEMO_RUANG
 */
export function getStoredRuang(): Ruang[] {
  if (typeof window === 'undefined') return DEMO_RUANG;
  try {
    const raw = localStorage.getItem(RUANG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading ruang from localStorage:', e);
  }
  return DEMO_RUANG;
}

/**
 * Menyimpan data ruang ke localStorage dan trigger event
 */
export function saveStoredRuang(ruangList: Ruang[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RUANG_STORAGE_KEY, JSON.stringify(ruangList));
  window.dispatchEvent(new Event('ruang-data-updated'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Mengambil data ruang dari Supabase Cloud
 */
export async function fetchRuangFromCloud(): Promise<Ruang[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('ruang')
      .select('id, kode_ruang, nama_ruang, kapasitas')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching ruang from Supabase:', error);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      const formatted: Ruang[] = data.map((r: any) => ({
        id: Number(r.id),
        kode_ruang: String(r.kode_ruang || ''),
        nama_ruang: String(r.nama_ruang || ''),
        kapasitas: Number(r.kapasitas) || 20,
      }));

      saveStoredRuang(formatted);
      return formatted;
    }

    return null;
  } catch (err) {
    console.error('Failed to communicate with Supabase:', err);
    return null;
  }
}

/**
 * Menyimpan daftar ruang ke Supabase Cloud
 */
export async function pushRuangToCloud(ruangList: Ruang[]): Promise<{ success: boolean; count: number; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, count: 0, error: 'Supabase belum dikonfigurasi' };
  }

  if (ruangList.length === 0) return { success: true, count: 0 };

  try {
    const seenKode = new Set<string>();
    const payload: Array<{ kode_ruang: string; nama_ruang: string; kapasitas: number }> = [];

    for (let i = 0; i < ruangList.length; i++) {
      const r = ruangList[i];
      let kode = r.kode_ruang.trim();
      if (!kode) kode = `R-${(i + 1).toString().padStart(2, '0')}`;
      if (seenKode.has(kode)) kode = `${kode}-${i + 1}`;
      seenKode.add(kode);

      payload.push({
        kode_ruang: kode,
        nama_ruang: r.nama_ruang.trim(),
        kapasitas: Number(r.kapasitas) || 20,
      });
    }

    const { data, error } = await supabase
      .from('ruang')
      .upsert(payload, { onConflict: 'kode_ruang' })
      .select('id, kode_ruang');

    if (error) {
      console.error('Error upserting ruang to Supabase:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: data?.length || payload.length };
  } catch (err: any) {
    console.error('Push ruang error:', err);
    return { success: false, count: 0, error: err?.message || 'Gagal menyimpan ruang ke cloud' };
  }
}

/**
 * Menghapus ruang dari Supabase Cloud berdasarkan ID
 */
export async function deleteRuangFromCloud(id: number): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase belum dikonfigurasi' };
  }
  try {
    const { error } = await supabase.from('ruang').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus ruang' };
  }
}

/**
 * Mengambil data siswa dari Supabase Cloud.
 * Jika berhasil, data juga disimpan ke localStorage agar cepat dibuka berikutnya.
 */
export async function fetchSiswaFromCloud(): Promise<Siswa[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('siswa')
      .select('id, nisn, nis, nama_lengkap, jenis_kelamin, kelas_id, foto_url, kelas(id, nama_kelas, tingkat, jurusan)')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching siswa from Supabase:', error);
      return null;
    }

    if (Array.isArray(data)) {
      // Map format data dari Supabase ke interface Siswa
      const formatted: Siswa[] = data.map((item: any) => {
        let kelasObj = item.kelas;
        if (!kelasObj && item.kelas_id) {
          kelasObj = DEMO_KELAS.find(k => k.id === item.kelas_id);
        }
        return {
          id: item.id,
          nisn: String(item.nisn || ''),
          nis: item.nis ? String(item.nis) : undefined,
          nama_lengkap: item.nama_lengkap || '',
          jenis_kelamin: (item.jenis_kelamin === 'P' ? 'P' : 'L') as 'L' | 'P',
          kelas_id: item.kelas_id || 1,
          foto_url: item.foto_url || null,
          kelas: kelasObj,
        };
      });

      // Update cache di localStorage jika ada data
      if (typeof window !== 'undefined' && formatted.length > 0) {
        localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(formatted));
        window.dispatchEvent(new Event('storage'));
      }

      return formatted;
    }

    return null;
  } catch (err) {
    console.error('Failed to communicate with Supabase:', err);
    return null;
  }
}

/**
 * Menyimpan / memperbarui daftar siswa ke Supabase Cloud (Batch Upsert).
 */
export async function pushSiswaToCloud(siswaList: Siswa[]): Promise<{ success: boolean; count: number; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, count: 0, error: 'Supabase belum dikonfigurasi' };
  }

  if (siswaList.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    // Pastikan seluruh 33 rombel kelas sudah ada di tabel 'kelas' Supabase
    // agar tidak melanggar foreign key constraint 'siswa_kelas_id_fkey'
    try {
      const kelasPayload = DEMO_KELAS.map(k => ({
        id: k.id,
        nama_kelas: k.nama_kelas,
        tingkat: k.tingkat,
        jurusan: k.jurusan || null,
      }));
      await supabase.from('kelas').upsert(kelasPayload);
    } catch (kErr) {
      console.warn('Warning syncing kelas to Supabase:', kErr);
    }

    // 2. Sanitasi & Pastikan NISN 100% Unik (Mencegah PostgreSQL ON CONFLICT DO UPDATE cannot affect row a second time)
    const seenNisn = new Set<string>();
    const payload: Array<{
      nisn: string;
      nis: string | null;
      nama_lengkap: string;
      jenis_kelamin: 'L' | 'P';
      kelas_id: number;
      foto_url: string | null;
    }> = [];

    for (let i = 0; i < siswaList.length; i++) {
      const s = siswaList[i];
      let nisn = String(s.nisn || '').trim();
      
      // Jika NISN kosong, buat ID unik sementara agar tidak bentrok dengan siswa tanpa NISN lainnya
      if (!nisn) {
        nisn = `NONISN-${s.id || (i + 1)}-${Date.now()}`;
      } else if (seenNisn.has(nisn)) {
        // Jika terdapat duplikasi NISN di dalam daftar yang diunggah
        nisn = `${nisn}-DUP${i + 1}`;
      }
      seenNisn.add(nisn);

      payload.push({
        nisn,
        nis: s.nis ? String(s.nis).trim() : null,
        nama_lengkap: (s.nama_lengkap || `Siswa ${i + 1}`).trim(),
        jenis_kelamin: s.jenis_kelamin === 'P' ? 'P' : 'L',
        kelas_id: Number(s.kelas_id) || 1,
        foto_url: s.foto_url || null,
      });
    }

    // 3. Eksekusi Upsert secara bertahap / chunk (200 baris per batch) untuk stabilitas maksimal
    const chunkSize = 200;
    let totalUpserted = 0;

    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('siswa')
        .upsert(chunk, { onConflict: 'nisn' })
        .select('id, nisn');

      if (error) {
        console.error('Error upserting chunk to Supabase:', error);
        return { success: false, count: totalUpserted, error: error.message };
      }
      totalUpserted += data?.length || chunk.length;
    }

    return { success: true, count: totalUpserted };
  } catch (err: any) {
    console.error('Push siswa error:', err);
    return { success: false, count: 0, error: err?.message || 'Gagal menyimpan ke cloud' };
  }
}

/**
 * Menghapus siswa dari Supabase Cloud berdasarkan NISN atau ID.
 */
export async function deleteSiswaFromCloud(nisnList: string[]): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || nisnList.length === 0) return false;

  try {
    const { error } = await supabase
      .from('siswa')
      .delete()
      .in('nisn', nisnList);

    if (error) {
      console.error('Error deleting from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete siswa error:', err);
    return false;
  }
}

/**
 * Ekspor seluruh data (Siswa, Pengaturan, Nilai) ke 1 Berkas Backup JSON
 */
export function exportBackupJSON(): void {
  if (typeof window === 'undefined') return;

  try {
    const siswaRaw = localStorage.getItem(SISWA_STORAGE_KEY);
    const nilaiRaw = localStorage.getItem(NILAI_STORAGE_KEY);
    const ruangRaw = localStorage.getItem(RUANG_STORAGE_KEY);
    const splitRulesRaw = localStorage.getItem(SPLIT_RULES_STORAGE_KEY);
    const settings = getStoredSchoolSettings();

    const backupData = {
      app: 'ADM UJIAN SMPN 1 RAJAPOLAH',
      version: '1.0.1',
      exportedAt: new Date().toISOString(),
      schoolSettings: settings,
      siswa: siswaRaw ? JSON.parse(siswaRaw) : [],
      nilai: nilaiRaw ? JSON.parse(nilaiRaw) : [],
      ruang: ruangRaw ? JSON.parse(ruangRaw) : [],
      splitRules: splitRulesRaw ? JSON.parse(splitRulesRaw) : [],
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_ADM_Ujian_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Gagal mengekspor backup:', e);
    alert('Terjadi kesalahan saat membuat file backup.');
  }
}

/**
 * Memulihkan data dari Berkas Backup JSON
 */
export function restoreBackupJSON(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result as string;
        if (!raw) {
          resolve({ success: false, message: 'File kosong atau tidak terbaca.' });
          return;
        }

        const data = JSON.parse(raw);
        if (!data || (!data.siswa && !data.schoolSettings)) {
          resolve({ success: false, message: 'Format file backup tidak sesuai.' });
          return;
        }

        if (Array.isArray(data.siswa)) {
          localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(data.siswa));
        }

        if (Array.isArray(data.nilai)) {
          localStorage.setItem(NILAI_STORAGE_KEY, JSON.stringify(data.nilai));
        }

        if (Array.isArray(data.ruang)) {
          localStorage.setItem(RUANG_STORAGE_KEY, JSON.stringify(data.ruang));
          window.dispatchEvent(new Event('ruang-data-updated'));
        }

        if (Array.isArray(data.splitRules)) {
          localStorage.setItem(SPLIT_RULES_STORAGE_KEY, JSON.stringify(data.splitRules));
          window.dispatchEvent(new Event('split-rules-updated'));
        }

        if (data.schoolSettings) {
          saveStoredSchoolSettings(data.schoolSettings);
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('school-settings-updated'));

        // Jika Supabase terhubung, otomatis sinkronkan data siswa & ruang ke Supabase juga
        if (Array.isArray(data.siswa) && data.siswa.length > 0 && isSupabaseConfigured) {
          await pushSiswaToCloud(data.siswa);
        }
        if (Array.isArray(data.ruang) && data.ruang.length > 0 && isSupabaseConfigured) {
          await pushRuangToCloud(data.ruang);
        }

        resolve({ 
          success: true, 
          message: `Berhasil memulihkan ${data.siswa?.length || 0} siswa dan pengaturan sekolah!` 
        });
      } catch (err: any) {
        console.error('Restore error:', err);
        resolve({ success: false, message: 'Gagal memproses file: ' + (err?.message || 'format rusak') });
      }
    };
    reader.readAsText(file);
  });
}

