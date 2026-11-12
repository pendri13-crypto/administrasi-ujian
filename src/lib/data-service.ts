import { supabase, isSupabaseConfigured } from './supabase';
import { Siswa, NilaiUjian, PesertaUjian } from '@/types/database';
import { SchoolSettings, getStoredSchoolSettings, saveStoredSchoolSettings } from './school-settings';
import { DEMO_KELAS } from './demo-data';

const SISWA_STORAGE_KEY = 'adm_siswa_data';
const NILAI_STORAGE_KEY = 'adm_nilai_data';

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
    // Siapkan payload yang sesuai skema tabel 'siswa'
    const payload = siswaList.map((s, index) => ({
      // Jangan sertakan ID jika ingin Supabase generate, atau sertakan jika numeric valid
      nisn: String(s.nisn).trim(),
      nis: s.nis ? String(s.nis).trim() : null,
      nama_lengkap: s.nama_lengkap.trim(),
      jenis_kelamin: s.jenis_kelamin === 'P' ? 'P' : 'L',
      kelas_id: Number(s.kelas_id) || 1,
      foto_url: s.foto_url || null,
    }));

    // Upsert berdasarkan 'nisn' yang unik
    const { data, error } = await supabase
      .from('siswa')
      .upsert(payload, { onConflict: 'nisn' })
      .select('id, nisn');

    if (error) {
      console.error('Error upserting to Supabase:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: data?.length || payload.length };
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
    const settings = getStoredSchoolSettings();

    const backupData = {
      app: 'ADM UJIAN SMPN 1 RAJAPOLAH',
      version: '1.0.1',
      exportedAt: new Date().toISOString(),
      schoolSettings: settings,
      siswa: siswaRaw ? JSON.parse(siswaRaw) : [],
      nilai: nilaiRaw ? JSON.parse(nilaiRaw) : [],
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

        if (data.schoolSettings) {
          saveStoredSchoolSettings(data.schoolSettings);
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('school-settings-updated'));

        // Jika Supabase terhubung, otomatis sinkronkan data siswa ke Supabase juga
        if (Array.isArray(data.siswa) && data.siswa.length > 0 && isSupabaseConfigured) {
          await pushSiswaToCloud(data.siswa);
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

