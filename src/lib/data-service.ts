import { supabase, isSupabaseConfigured } from './supabase';
import { Siswa, NilaiUjian, PesertaUjian, Ruang, SplitGroupRule, JadwalUjian, Mapel } from '@/types/database';
import { SchoolSettings, getStoredSchoolSettings, saveStoredSchoolSettings } from './school-settings';
import { DEMO_KELAS, DEMO_RUANG, DEMO_MAPEL, DEMO_JADWAL } from './demo-data';

const SISWA_STORAGE_KEY = 'adm_siswa_data';
const NILAI_STORAGE_KEY = 'adm_nilai_data';
const RUANG_STORAGE_KEY = 'adm_ruang_data';
const SPLIT_RULES_STORAGE_KEY = 'adm_split_rules';
const JADWAL_STORAGE_KEY = 'adm_jadwal_data';
const MAPEL_STORAGE_KEY = 'adm_mapel_data';

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
 * Menyimpan aturan split & mapping ruang ke Supabase Cloud (melalui kolom jurusan tabel kelas dengan format compact)
 */
export async function pushSplitRulesToCloud(rules: SplitGroupRule[]): Promise<{ success: boolean; error?: string }> {
  const client = supabase;
  if (!client || !isSupabaseConfigured || rules.length === 0) {
    return { success: false, error: 'Supabase belum dikonfigurasi' };
  }

  try {
    const mapByKelas: Record<number, SplitGroupRule[]> = {};
    rules.forEach(r => {
      const kId = Number(r.kelas_id);
      if (!mapByKelas[kId]) mapByKelas[kId] = [];
      mapByKelas[kId].push(r);
    });

    const updates = Object.entries(mapByKelas).map(async ([kIdStr, rList]) => {
      const kId = Number(kIdStr);
      // Format ringkas: "ruangId:pos:start:end:startMeja|..."
      const compactStr = rList.map(r => {
        const posCode = r.posisi === 'kanan' ? 'r' : 'k';
        const startMeja = r.start_meja !== undefined ? r.start_meja : (posCode === 'r' ? 18 : 1);
        return `${r.target_ruang_id}:${posCode}:${r.start_urut}:${r.end_urut}:${startMeja}`;
      }).join('|');

      return client.from('kelas').update({ jurusan: compactStr }).eq('id', kId);
    });

    await Promise.all(updates);
    return { success: true };
  } catch (err: any) {
    console.error('Push split rules error:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan aturan ke cloud' };
  }
}

/**
 * Mengambil aturan split & mapping ruang dari Supabase Cloud
 */
export async function fetchSplitRulesFromCloud(): Promise<SplitGroupRule[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('kelas')
      .select('id, nama_kelas, jurusan')
      .order('id', { ascending: true });

    if (error || !data) return null;

    const reconstructedRules: SplitGroupRule[] = [];
    let hasCustom = false;

    data.forEach(k => {
      if (k.jurusan && typeof k.jurusan === 'string' && k.jurusan.includes(':')) {
        hasCustom = true;
        const parts = k.jurusan.split('|');
        parts.forEach((part, idx) => {
          const [ruangStr, posCode, startStr, endStr, mejaStr] = part.split(':');
          const targetRuangId = Number(ruangStr) || k.id;
          const pos = posCode === 'r' ? 'kanan' : 'kiri';
          const startUrut = Number(startStr) || (idx === 0 ? 1 : 18);
          const endUrut = Number(endStr) || (idx === 0 ? 17 : 34);
          const startMeja = mejaStr ? Number(mejaStr) : (pos === 'kanan' ? 18 : 1);

          reconstructedRules.push({
            id: `rule-${k.id}-part${idx + 1}`,
            kelas_id: k.id,
            label: `${k.nama_kelas} (No. ${startUrut}-${endUrut})`,
            start_urut: startUrut,
            end_urut: endUrut,
            target_ruang_id: targetRuangId,
            posisi: pos,
            start_meja: startMeja
          });
        });
      }
    });

    if (hasCustom && reconstructedRules.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SPLIT_RULES_STORAGE_KEY, JSON.stringify(reconstructedRules));
        window.dispatchEvent(new Event('split-rules-updated'));
        window.dispatchEvent(new Event('storage'));
      }
      return reconstructedRules;
    }

    return null;
  } catch (err) {
    console.error('Fetch split rules exception:', err);
    return null;
  }
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
 * Mengambil data master mapel dari localStorage atau default
 */
export function getStoredMapel(): Mapel[] {
  if (typeof window === 'undefined') return DEMO_MAPEL;
  try {
    const raw = localStorage.getItem(MAPEL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading mapel from localStorage:', e);
  }
  return DEMO_MAPEL;
}

/**
 * Menyimpan data master mapel ke localStorage
 */
export function saveStoredMapel(mapelList: Mapel[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MAPEL_STORAGE_KEY, JSON.stringify(mapelList));
  window.dispatchEvent(new Event('mapel-data-updated'));
}

/**
 * Mengambil data jadwal ujian dari localStorage atau default
 */
export function getStoredJadwal(): JadwalUjian[] {
  if (typeof window === 'undefined') return DEMO_JADWAL;
  try {
    const raw = localStorage.getItem(JADWAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading jadwal from localStorage:', e);
  }
  return DEMO_JADWAL;
}

const JADWAL_SESI_MAP_KEY = 'adm_jadwal_sesi_map';

/**
 * Mengambil peta mapping sesi jadwal dari localStorage
 */
export function getStoredJadwalSesiMap(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(JADWAL_SESI_MAP_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading jadwal sesi map:', e);
  }
  return {};
}

/**
 * Menyimpan peta mapping sesi jadwal ke localStorage
 */
export function saveStoredJadwalSesiMap(map: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(JADWAL_SESI_MAP_KEY, JSON.stringify(map));
}

/**
 * Menyimpan data jadwal ujian ke localStorage dan trigger event
 */
export function saveStoredJadwal(jadwalList: JadwalUjian[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(jadwalList));

  // Simpan mapping sesi secara persisten
  const sesiMap = getStoredJadwalSesiMap();
  jadwalList.forEach(j => {
    const sesiVal = j.sesi || (j.jam_mulai >= '09:45' ? 2 : 1);
    if (j.id) sesiMap[String(j.id)] = sesiVal;
    if (j.tanggal && j.jam_mulai) {
      sesiMap[`${j.tanggal}_${j.jam_mulai.slice(0, 5)}`] = sesiVal;
      sesiMap[`${j.tanggal}_${j.mapel_id}`] = sesiVal;
    }
  });
  saveStoredJadwalSesiMap(sesiMap);

  window.dispatchEvent(new Event('jadwal-data-updated'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Mengambil data jadwal ujian dari Supabase Cloud
 */
export async function fetchJadwalFromCloud(): Promise<JadwalUjian[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('jadwal_ujian')
      .select('id, ujian_id, mapel_id, tanggal, jam_mulai, jam_selesai, mapel(id, kode_mapel, nama_mapel, kkm)')
      .order('tanggal', { ascending: true })
      .order('jam_mulai', { ascending: true });

    if (error) {
      console.error('Error fetching jadwal from Supabase:', error);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      const sesiMap = getStoredJadwalSesiMap();

      const formatted: JadwalUjian[] = data.map((item: any) => {
        let mapelObj = item.mapel;
        if (!mapelObj && item.mapel_id) {
          mapelObj = DEMO_MAPEL.find(m => m.id === item.mapel_id);
        }
        const jamMulaiClean = String(item.jam_mulai || '').slice(0, 5);
        const jamSelesaiClean = String(item.jam_selesai || '').slice(0, 5);

        // Resolusi Sesi:
        // 1. Dari item.sesi (jika ada)
        // 2. Dari sesiMap berdasarkan ID
        // 3. Dari sesiMap berdasarkan tanggal_jamMulai
        // 4. Dari sesiMap berdasarkan tanggal_mapelId
        // 5. Dari jam mulai: jika >= 09:45 otomatis Sesi 2, sebaliknya Sesi 1
        let sesi = 1;
        const timeKey = `${item.tanggal}_${jamMulaiClean}`;
        const mapelKey = `${item.tanggal}_${item.mapel_id}`;

        if (item.sesi) {
          sesi = Number(item.sesi);
        } else if (sesiMap[String(item.id)]) {
          sesi = sesiMap[String(item.id)];
        } else if (sesiMap[timeKey]) {
          sesi = sesiMap[timeKey];
        } else if (sesiMap[mapelKey]) {
          sesi = sesiMap[mapelKey];
        } else if (jamMulaiClean >= '09:45') {
          sesi = 2;
        } else {
          sesi = 1;
        }

        return {
          id: item.id,
          ujian_id: item.ujian_id || 1,
          mapel_id: item.mapel_id,
          tanggal: String(item.tanggal || ''),
          jam_mulai: jamMulaiClean,
          jam_selesai: jamSelesaiClean,
          sesi: sesi,
          mapel: mapelObj
        };
      });

      // Gabungkan dengan jadwal lokal agar jadwal baru tidak terhapus jika belum tersinkron
      const currentLocal = getStoredJadwal();
      const cloudIds = new Set(formatted.map(f => f.id));
      const localOnly = currentLocal.filter(l => !cloudIds.has(l.id));
      const combined = [...formatted, ...localOnly];

      if (typeof window !== 'undefined') {
        localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(combined));
        window.dispatchEvent(new Event('jadwal-data-updated'));
      }
      return combined;
    }
    return null;
  } catch (err) {
    console.error('Fetch jadwal exception:', err);
    return null;
  }
}

/**
 * Menyimpan daftar jadwal ujian ke Supabase Cloud
 */
export async function pushJadwalToCloud(jadwalList: JadwalUjian[]): Promise<{ success: boolean; count: number; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, count: 0, error: 'Koneksi Supabase belum terkonfigurasi' };
  }
  if (jadwalList.length === 0) return { success: true, count: 0 };

  try {
    // 1. Pastikan seluruh Mapel yang digunakan terdaftar di Supabase agar tidak melanggar foreign key
    const allMapel = getStoredMapel();
    if (allMapel.length > 0) {
      const uniqueMapelMap = new Map<number, any>();
      allMapel.forEach(m => {
        uniqueMapelMap.set(m.id, {
          id: m.id,
          kode_mapel: m.kode_mapel,
          nama_mapel: m.nama_mapel,
          kkm: m.kkm
        });
      });
      await supabase.from('mapel').upsert(Array.from(uniqueMapelMap.values()), { onConflict: 'id' });
    }

    // 2. Simpan mapping sesi secara persisten di local
    const sesiMap = getStoredJadwalSesiMap();
    jadwalList.forEach(j => {
      const sesiVal = j.sesi || (j.jam_mulai >= '09:45' ? 2 : 1);
      if (j.id) sesiMap[String(j.id)] = sesiVal;
      if (j.tanggal && j.jam_mulai) {
        sesiMap[`${j.tanggal}_${j.jam_mulai.slice(0, 5)}`] = sesiVal;
        sesiMap[`${j.tanggal}_${j.mapel_id}`] = sesiVal;
      }
    });
    saveStoredJadwalSesiMap(sesiMap);

    const uniqueJadwalMap = new Map<number, any>();
    jadwalList.forEach(j => {
      uniqueJadwalMap.set(j.id, {
        id: j.id,
        ujian_id: j.ujian_id || 1,
        mapel_id: j.mapel_id,
        tanggal: j.tanggal,
        jam_mulai: j.jam_mulai.length === 5 ? `${j.jam_mulai}:00` : j.jam_mulai,
        jam_selesai: j.jam_selesai.length === 5 ? `${j.jam_selesai}:00` : j.jam_selesai
      });
    });
    const payload = Array.from(uniqueJadwalMap.values());

    const { error } = await supabase
      .from('jadwal_ujian')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting jadwal to Supabase:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: payload.length };
  } catch (err: any) {
    console.error('Push jadwal error:', err);
    return { success: false, count: 0, error: err?.message || 'Gagal menyimpan jadwal ke cloud' };
  }
}

/**
 * Menghapus jadwal ujian dari Supabase Cloud berdasarkan ID
 */
export async function deleteJadwalFromCloud(id: number): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Koneksi Supabase belum terkonfigurasi' };
  }
  try {
    const { error } = await supabase.from('jadwal_ujian').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus jadwal' };
  }
}

/**
 * Mengambil data siswa tersimpan dari localStorage atau fallback
 */
export function getStoredSiswa(): Siswa[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SISWA_STORAGE_KEY);
    if (raw) {
      const parsed: Siswa[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed.some(s => s.nama_lengkap === 'ADELFIO PRADITYA PUTRA' && s.id === 1)) {
          localStorage.removeItem(SISWA_STORAGE_KEY);
          return [];
        }
        return parsed.map(s => {
          const kId = Number(s.kelas_id) || 1;
          if (!s.kelas && s.kelas_id) {
            const k = DEMO_KELAS.find(c => c.id === kId);
            if (k) return { ...s, kelas_id: kId, kelas: k };
          }
          return { ...s, kelas_id: kId };
        });
      }
    }
  } catch (e) {
    console.error('Error reading siswa from localStorage:', e);
  }
  return [];
}

/**
 * Menyimpan data siswa ke localStorage dan memancarkan event pembaruan
 */
export function saveStoredSiswa(siswaList: Siswa[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(siswaList));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('siswa-data-updated'));
}

/**
 * Mengambil data siswa dari Supabase Cloud dengan paginasi otomatis
 * (Menembus limit 1000 baris PostgREST agar seluruh siswa terbawa lengkap).
 * Jika berhasil, data juga disimpan ke localStorage agar cepat dibuka berikutnya.
 */
export async function fetchSiswaFromCloud(): Promise<Siswa[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;

    // Lakukan paginasi berulang hingga seluruh data siswa dari Cloud terambil
    while (true) {
      const { data, error } = await supabase
        .from('siswa')
        .select('id, nisn, nis, nama_lengkap, jenis_kelamin, kelas_id, foto_url, kelas(id, nama_kelas, tingkat, jurusan)')
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching siswa from Supabase:', error);
        break;
      }

      if (!data || data.length === 0) break;
      allData = allData.concat(data);

      if (data.length < pageSize) break;
      from += pageSize;
    }

    if (allData.length > 0) {
      // Map format data dari Supabase ke interface Siswa
      const formatted: Siswa[] = allData.map((item: any) => {
        const kId = Number(item.kelas_id) || 1;
        let kelasObj = item.kelas;
        if (!kelasObj && item.kelas_id) {
          kelasObj = DEMO_KELAS.find(k => k.id === kId);
        }
        return {
          id: item.id,
          nisn: String(item.nisn || ''),
          nis: item.nis ? String(item.nis) : undefined,
          nama_lengkap: item.nama_lengkap || '',
          jenis_kelamin: (item.jenis_kelamin === 'P' ? 'P' : 'L') as 'L' | 'P',
          kelas_id: kId,
          foto_url: item.foto_url || null,
          kelas: kelasObj,
        };
      });

      // Update cache di localStorage dengan data lengkap
      if (typeof window !== 'undefined' && formatted.length > 0) {
        localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(formatted));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('siswa-data-updated'));
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
    const jadwalRaw = localStorage.getItem(JADWAL_STORAGE_KEY);
    const mapelRaw = localStorage.getItem(MAPEL_STORAGE_KEY);
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
      jadwal: jadwalRaw ? JSON.parse(jadwalRaw) : [],
      mapel: mapelRaw ? JSON.parse(mapelRaw) : [],
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

        if (Array.isArray(data.jadwal)) {
          localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(data.jadwal));
          window.dispatchEvent(new Event('jadwal-data-updated'));
        }

        if (Array.isArray(data.mapel)) {
          localStorage.setItem(MAPEL_STORAGE_KEY, JSON.stringify(data.mapel));
          window.dispatchEvent(new Event('mapel-data-updated'));
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

