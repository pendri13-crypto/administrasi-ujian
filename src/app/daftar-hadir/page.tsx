'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  DEMO_RUANG, 
  DEMO_PESERTA, 
  DEMO_KELAS, 
  DEMO_MAPEL, 
  DEMO_JADWAL, 
  generatePesertaFromSiswa
} from '@/lib/demo-data';
import { PesertaUjian, Siswa, Ruang, JadwalUjian, Mapel, Kelas } from '@/types/database';
import { 
  Printer, 
  DoorOpen, 
  Calendar, 
  Clock, 
  Layers, 
  GraduationCap, 
  Eye, 
  EyeOff,
  TableProperties,
  FileSpreadsheet,
  LayoutTemplate,
  PenTool
} from 'lucide-react';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { 
  fetchSiswaFromCloud, 
  fetchRuangFromCloud,
  getStoredRuang, 
  getStoredJadwal, 
  getStoredMapel, 
  fetchJadwalFromCloud,
  fetchSplitRulesFromCloud
} from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AutoTrimmedLogo } from '@/components/AutoTrimmedLogo';

export default function DaftarHadirPage() {
  const [filterMode, setFilterMode] = useState<'ruang' | 'kelas'>('ruang');
  const [selectedRuangId, setSelectedRuangId] = useState<number>(1);
  const [selectedKelasId, setSelectedKelasId] = useState<number>(1);
  const [kelasList, setKelasList] = useState<Kelas[]>(DEMO_KELAS);
  const [selectedJadwalId, setSelectedJadwalId] = useState<number | null>(null);
  const [selectedSesiMode, setSelectedSesiMode] = useState<string>('1_2'); // '1_2', '1', '2', 'auto'
  const [ruangList, setRuangList] = useState<Ruang[]>(getStoredRuang());
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>(getStoredJadwal());
  const [mapelList, setMapelList] = useState<Mapel[]>(getStoredMapel());
  const [pesertaList, setPesertaList] = useState<PesertaUjian[]>(DEMO_PESERTA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [showNoPeserta, setShowNoPeserta] = useState<boolean>(false);
  const [showTtdPengawas, setShowTtdPengawas] = useState<boolean>(false);
  const [templateMode, setTemplateMode] = useState<'multi' | 'single'>('multi'); // 'multi' (Sesuai Gambar Lampiran) atau 'single'
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // 1. Sinkronisasi Pengaturan Sekolah (Kop Dokumen)
  useEffect(() => {
    const updateSettings = () => {
      const s = getStoredSchoolSettings();
      setSchoolSettings(s);
      setShowNoPeserta(s.tampilkanNoPeserta ?? false);
    };
    updateSettings();
    window.addEventListener('school-settings-updated', updateSettings);
    return () => window.removeEventListener('school-settings-updated', updateSettings);
  }, []);

  // 2. Sinkronisasi Daftar Ruangan
  useEffect(() => {
    const updateRuang = () => {
      setRuangList(getStoredRuang());
    };
    updateRuang();
    window.addEventListener('ruang-data-updated', updateRuang);

    if (isSupabaseConfigured) {
      fetchRuangFromCloud().then(cloudRuang => {
        if (cloudRuang && cloudRuang.length > 0) {
          setRuangList(cloudRuang);
        }
      });
    }

    return () => window.removeEventListener('ruang-data-updated', updateRuang);
  }, []);

  // 3. Sinkronisasi Master Mata Pelajaran & Jadwal Ujian
  useEffect(() => {
    const updateJadwalAndMapel = () => {
      setJadwalList(getStoredJadwal());
      setMapelList(getStoredMapel());
    };
    updateJadwalAndMapel();

    window.addEventListener('jadwal-data-updated', updateJadwalAndMapel);
    window.addEventListener('mapel-data-updated', updateJadwalAndMapel);

    if (isSupabaseConfigured) {
      fetchJadwalFromCloud().then(cloudJadwal => {
        if (cloudJadwal && cloudJadwal.length > 0) {
          setJadwalList(cloudJadwal);
        }
      });
    }

    return () => {
      window.removeEventListener('jadwal-data-updated', updateJadwalAndMapel);
      window.removeEventListener('mapel-data-updated', updateJadwalAndMapel);
    };
  }, []);

  // 4. Sinkronisasi Data Peserta Ujian Per Ruangan
  useEffect(() => {
    // 1. Baca data lokal pertama kali (cepat & instan)
    const currentStoredRuang = getStoredRuang();
    const saved = localStorage.getItem('adm_siswa_data');
    if (saved) {
      try {
        const parsedSiswa: Siswa[] = JSON.parse(saved);
        if (Array.isArray(parsedSiswa) && parsedSiswa.length > 0) {
          setPesertaList(generatePesertaFromSiswa(parsedSiswa, currentStoredRuang));
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Tarik update terbaru dari Cloud HANYA SEKALI saat halaman dimuat
    if (isSupabaseConfigured) {
      Promise.all([
        fetchRuangFromCloud(),
        fetchSplitRulesFromCloud(),
        fetchSiswaFromCloud()
      ]).then(([cloudRuang, rules, cloudSiswa]) => {
        const activeRuang = (cloudRuang && cloudRuang.length > 0) ? cloudRuang : (currentStoredRuang.length > 0 ? currentStoredRuang : getStoredRuang());
        if (cloudRuang && cloudRuang.length > 0) {
          setRuangList(cloudRuang);
        }
        if (cloudSiswa && cloudSiswa.length > 0) {
          setPesertaList(generatePesertaFromSiswa(cloudSiswa, activeRuang, rules || undefined));
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    // 3. Listener hanya untuk update lokal dari tab lain / form tanpa loop cloud
    const handleLocalUpdate = () => {
      try {
        const activeRuang = getStoredRuang();
        const localSaved = localStorage.getItem('adm_siswa_data');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPesertaList(generatePesertaFromSiswa(parsed, activeRuang));
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('siswa-data-updated', handleLocalUpdate);
    return () => {
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('siswa-data-updated', handleLocalUpdate);
    };
  }, []);

  // Format Hari dan Tanggal Indonesia resmi
  const formatHariTanggalIndo = (tglStr?: string) => {
    if (!tglStr) return '-';
    try {
      const date = new Date(tglStr + 'T00:00:00');
      if (isNaN(date.getTime())) return tglStr;
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return tglStr;
    }
  };

  // Urutkan jadwal berdasarkan tanggal dan waktu pelaksanaan
  const sortedJadwalList = useMemo(() => {
    const list = jadwalList.length > 0 ? jadwalList : DEMO_JADWAL;
    return [...list].sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
      return a.jam_mulai.localeCompare(b.jam_mulai);
    });
  }, [jadwalList]);

  // Tentukan jadwal yang sedang aktif dipilih
  const currentJadwal = useMemo(() => {
    if (selectedJadwalId !== null) {
      const found = sortedJadwalList.find(j => j.id === selectedJadwalId);
      if (found) return found;
    }
    return sortedJadwalList[0] || null;
  }, [selectedJadwalId, sortedJadwalList]);

  // Resolusi Mata Pelajaran dari Jadwal Aktif
  const currentMapel = useMemo(() => {
    if (currentJadwal) {
      const mapelFromList = mapelList.find(m => m.id === currentJadwal.mapel_id);
      if (mapelFromList) return mapelFromList;
      if (currentJadwal.mapel) return currentJadwal.mapel;
      const demoMapel = DEMO_MAPEL.find(m => m.id === currentJadwal.mapel_id);
      if (demoMapel) return demoMapel;
    }
    return DEMO_MAPEL[0];
  }, [currentJadwal, mapelList]);

  // Resolusi Sesi Ujian (otomatis dari jadwal atau override manual)
  const autoSesi = useMemo(() => {
    if (!currentJadwal) return 1;
    if (currentJadwal.sesi === 2) return 2;
    if (currentJadwal.sesi === 1) return 1;
    // Auto inference berdasarkan jam mulai: jika >= 09:45 maka Sesi 2
    const jamMulaiClean = (currentJadwal.jam_mulai || '').slice(0, 5);
    return jamMulaiClean >= '09:45' ? 2 : 1;
  }, [currentJadwal]);

  const displaySesi = useMemo(() => {
    if (selectedSesiMode === '1_2') return 'Sesi 1 dan Sesi 2';
    if (selectedSesiMode === '1') return 'Sesi 1';
    if (selectedSesiMode === '2') return 'Sesi 2';
    if (templateMode === 'multi') return 'Sesi 1 dan Sesi 2';
    return `Sesi ${autoSesi}`;
  }, [selectedSesiMode, autoSesi, templateMode]);

  // Opsi Format Waktu Pelaksanaan Ujian (Default: 08.00 - Selesai sesuai permintaan, atau sinkron jadwal)
  const [waktuMode, setWaktuMode] = useState<'selesai' | 'jadwal' | 'custom'>('selesai');
  const [customWaktuText, setCustomWaktuText] = useState<string>('08.00 - Selesai');

  // Waktu pelaksanaan ujian
  const displayWaktu = useMemo(() => {
    if (waktuMode === 'custom' && customWaktuText.trim()) {
      return customWaktuText.trim();
    }
    const jamMulaiRaw = currentJadwal?.jam_mulai ? currentJadwal.jam_mulai.slice(0, 5).replace(':', '.') : '08.00';
    // Jika masih 07.30 (default demo lama), ubah ke 08.00
    const jamMulai = jamMulaiRaw === '07.30' ? '08.00' : jamMulaiRaw;

    if (waktuMode === 'jadwal' && currentJadwal) {
      const jamSelesaiRaw = currentJadwal.jam_selesai ? currentJadwal.jam_selesai.slice(0, 5).replace(':', '.') : 'Selesai';
      return `${jamMulai} - ${jamSelesaiRaw} WIB`;
    }

    return `${jamMulai} - Selesai`;
  }, [waktuMode, customWaktuText, currentJadwal]);

  // Ruangan yang sedang dipilih
  const currentRuang = ruangList.find(r => r.id === selectedRuangId) || ruangList[0] || DEMO_RUANG[0];

  // Kelas yang sedang dipilih
  const currentKelas = kelasList.find(k => k.id === selectedKelasId) || kelasList[0] || DEMO_KELAS[0];

  // Peserta yang ditampilkan (Per Ruang atau Per Kelas)
  const pesertaRuang = pesertaList
    .filter(p => {
      if (filterMode === 'ruang') {
        if (p.ruang_id === selectedRuangId) return true;
        if (currentRuang && p.ruang?.id === currentRuang.id) return true;
        if (currentRuang && p.ruang?.kode_ruang && currentRuang.kode_ruang && p.ruang.kode_ruang.trim().toLowerCase() === currentRuang.kode_ruang.trim().toLowerCase()) return true;
        const rNumP = Number(p.ruang?.kode_ruang?.replace(/\D/g, ''));
        const rNumC = Number(currentRuang?.kode_ruang?.replace(/\D/g, ''));
        if (rNumP && rNumC && rNumP === rNumC) return true;
        return false;
      } else {
        const targetK = currentKelas;
        return p.siswa?.kelas_id === selectedKelasId ||
          (targetK && p.siswa?.kelas?.nama_kelas?.toLowerCase() === targetK.nama_kelas.toLowerCase()) ||
          (targetK && (p.siswa as any)?.nama_kelas?.toLowerCase() === targetK.nama_kelas.toLowerCase());
      }
    })
    .sort((a, b) => {
      if (filterMode === 'ruang') {
        return (a.no_meja || 0) - (b.no_meja || 0);
      } else {
        return (a.no_meja || 0) - (b.no_meja || 0);
      }
    });

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {filterMode === 'ruang' ? 'Daftar Hadir Per Ruang Ujian' : `Daftar Hadir Per Rombel Kelas (${currentKelas.nama_kelas})`}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mode: <b>{filterMode === 'ruang' ? `Ruang ${currentRuang.kode_ruang}` : `Kelas ${currentKelas.nama_kelas}`}</b> &bull; Waktu, sesi, dan mata pelajaran otomatis sinkron dengan Jadwal Ujian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Pilihan Template: Multi-Mapel Mingguan (Sesuai Gambar) vs Harian Per Mapel */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setTemplateMode('multi');
                  setPrintOrientation('landscape');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  templateMode === 'multi'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                Format Multi-Mapel (Senin-Kamis)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateMode('single');
                  setPrintOrientation('portrait');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  templateMode === 'single'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Format Per Mapel
              </button>
            </div>

            {/* Mode Switch: Per Ruangan vs Per Kelas */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterMode('ruang')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterMode === 'ruang'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                Per Ruangan
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('kelas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterMode === 'kelas'
                    ? 'bg-white text-purple-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Per Kelas
              </button>
            </div>

            {/* Dropdown sesuai mode */}
            {filterMode === 'ruang' ? (
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <select
                  value={selectedRuangId}
                  onChange={(e) => setSelectedRuangId(Number(e.target.value))}
                  className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ruangList.map((r) => (
                    <option key={r.id} value={r.id}>{r.kode_ruang} - {r.nama_ruang}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(Number(e.target.value))}
                  className="text-xs font-semibold border border-purple-300 rounded-lg px-3 py-2 bg-white text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Pilih Jadwal Ujian (Sinkron Waktu, Tanggal, & Mapel) */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <select
                value={currentJadwal?.id || ''}
                onChange={(e) => setSelectedJadwalId(Number(e.target.value))}
                className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-[280px] sm:max-w-xs truncate"
              >
                {sortedJadwalList.map((j) => {
                  const mapelObj = mapelList.find(m => m.id === j.mapel_id) || j.mapel || DEMO_MAPEL.find(m => m.id === j.mapel_id);
                  const s = (j.sesi === 2 || (j.jam_mulai && j.jam_mulai.slice(0, 5) >= '09:45')) ? 2 : 1;
                  return (
                    <option key={j.id} value={j.id}>
                      {j.tanggal} • Sesi {s} • {mapelObj?.nama_mapel || 'Mapel'} ({j.jam_mulai.slice(0, 5)}-{j.jam_selesai.slice(0, 5)})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Opsi Sesi (Auto dari Jadwal atau Pilihan Manual) */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={selectedSesiMode}
                onChange={(e) => setSelectedSesiMode(e.target.value)}
                className="text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1_2">Sesi 1 dan Sesi 2 (Default)</option>
                <option value="1">Sesi 1</option>
                <option value="2">Sesi 2</option>
                <option value="auto">Sesi {autoSesi} (Otomatis)</option>
              </select>
            </div>

            {/* Pilihan Format Pukul / Waktu Ujian */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <select
                value={waktuMode}
                onChange={(e) => setWaktuMode(e.target.value as any)}
                className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                title="Pilih Format Pukul / Waktu Ujian"
              >
                <option value="selesai">08.00 - Selesai (Default)</option>
                <option value="jadwal">
                  Sinkron Jadwal ({currentJadwal ? `${(currentJadwal.jam_mulai || '08:00').slice(0, 5).replace(':', '.')} - ${(currentJadwal.jam_selesai || '09:30').slice(0, 5).replace(':', '.')}` : '08.00 - 09.30'})
                </option>
                <option value="custom">Kustom Teks...</option>
              </select>
              {waktuMode === 'custom' && (
                <input
                  type="text"
                  value={customWaktuText}
                  onChange={(e) => setCustomWaktuText(e.target.value)}
                  placeholder="08.00 - Selesai"
                  className="text-xs font-medium border border-slate-300 rounded px-2 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Toggle Tampilkan / Hilangkan No. Peserta */}
            <button
              type="button"
              onClick={() => setShowNoPeserta(!showNoPeserta)}
              title={showNoPeserta ? "Nomor Peserta Ditampilkan (Klik untuk hilangkan)" : "Nomor Peserta Dihilangkan (Klik untuk tampilkan)"}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                showNoPeserta 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
            >
              {showNoPeserta ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>No. Peserta: Tampil</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>No. Peserta: Dihilangkan</span>
                </>
              )}
            </button>

            {/* Toggle Tampilkan / Hilangkan TTD Pengawas */}
            <button
              type="button"
              onClick={() => setShowTtdPengawas(!showTtdPengawas)}
              title={showTtdPengawas ? "Tanda Tangan Pengawas Ditampilkan (Klik untuk hilangkan)" : "Tanda Tangan Pengawas Dihilangkan (Klik untuk tampilkan)"}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                showTtdPengawas 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <PenTool className={`w-3.5 h-3.5 ${showTtdPengawas ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span>TTD Pengawas: {showTtdPengawas ? 'Tampil' : 'Dihilangkan'}</span>
            </button>

            {/* Pilihan Orientasi Kertas Cetak */}
            <button
              type="button"
              onClick={() => setPrintOrientation(printOrientation === 'landscape' ? 'portrait' : 'landscape')}
              title="Ganti Orientasi Kertas Cetak"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border bg-white border-slate-300 hover:bg-slate-50 text-slate-700 transition"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
              <span>{printOrientation === 'landscape' ? 'Landscape (Mendatar)' : 'Portrait (Tegak)'}</span>
            </button>

            {/* Tombol Cetak Dokumen */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Cetak Daftar Hadir
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${printOrientation};
            margin: 8mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />

      {/* Lembar Dokumen Siap Cetak (A4 / F4) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        {templateMode === 'multi' ? (
          /* ============================================================== */
          /* TEMPLATE MULTI-MAPEL MINGGUAN (SENIN - KAMIS SESUAI GAMBAR)    */
          /* ============================================================== */
          <div>
            {/* Header Format Panitia Ujian dengan Logo Kiri (Pemda) & Kanan (Sekolah) Menyesuaikan KOP */}
            <div className="flex items-center justify-between gap-3 sm:gap-4 mb-2 pb-1">
              {/* Logo Kiri: Pemerintah Daerah */}
              <div className="w-[58px] sm:w-[68px] h-[58px] sm:h-[68px] flex-shrink-0 flex items-center justify-center">
                <AutoTrimmedLogo
                  src={schoolSettings.logoPemdaUrl || schoolSettings.logoTasikmalayaUrl}
                  fallbackSrc="/images/logo-tasikmalaya.png"
                  alt="Logo Pemda"
                  className="w-full h-full object-contain filter drop-shadow-sm select-none"
                />
              </div>

              {/* Teks Kop Tengah */}
              <div className="flex-1 text-center font-bold text-slate-950 space-y-0.5 px-2">
                <p className="text-xs sm:text-sm md:text-[15px] font-black tracking-wide uppercase text-slate-950">
                  PANITIA PELAKSANA ASESMEN DAN UJIAN
                </p>
                <h1 className="text-xs sm:text-sm md:text-[15px] font-black tracking-wide uppercase text-slate-950">
                  {schoolSettings.namaSekolah === 'SMP NEGERI 1 RAJAPOLAH' ? 'SMPN 1 RAJAPOLAH' : (schoolSettings.namaSekolah || 'SMPN 1 RAJAPOLAH')}
                </h1>
                <p className="text-xs sm:text-sm md:text-[15px] font-black tracking-wide uppercase text-slate-950">
                  DAFTAR HADIR PESERTA UJIAN {filterMode === 'kelas' ? `(KELAS ${currentKelas.nama_kelas})` : ''}
                </p>
                <p className="text-[11px] sm:text-xs md:text-[13px] font-black tracking-wide uppercase text-slate-900">
                  {schoolSettings.namaUjian || 'SUMATIF AKHIR SEMESTER (SAS)'} TAHUN PELAJARAN {schoolSettings.tahunAjaran || '2026/2027'}
                </p>
              </div>

              {/* Logo Kanan: Sekolah (SMPN 1 Rajapolah) */}
              <div className="w-[58px] sm:w-[68px] h-[58px] sm:h-[68px] flex-shrink-0 flex items-center justify-center">
                <AutoTrimmedLogo
                  src={schoolSettings.logoSekolahUrl}
                  fallbackSrc="/images/logo-smpn1-rajapolah.png"
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain filter drop-shadow-sm select-none"
                />
              </div>
            </div>

            {/* Garis Ganda Pembatas Standar */}
            <div className="border-b-4 border-double border-slate-950 mb-3" />

            {/* Metadata Ruang & Jadwal 2 Kolom Sesuai Gambar */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-xs text-slate-950 mb-3 font-semibold">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-32">Ruang</span>
                  <span className="w-4">:</span>
                  <span className="font-bold">
                    {filterMode === 'ruang' 
                      ? `${currentRuang.kode_ruang} (${currentRuang.nama_ruang})`
                      : `Kelas ${currentKelas.nama_kelas}`
                    }
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32">Mata Pelajaran</span>
                  <span className="w-4">:</span>
                  <span>Terlampir pada tabel (8 Mata Pelajaran)</span>
                </div>
                <div className="flex">
                  <span className="w-32">Sesi</span>
                  <span className="w-4">:</span>
                  <span className="font-semibold text-slate-900">{displaySesi}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex">
                  <span className="w-32">Hari / Tanggal</span>
                  <span className="w-4">:</span>
                  <span>Senin - Kamis</span>
                </div>
                <div className="flex">
                  <span className="w-32">Pukul / Waktu</span>
                  <span className="w-4">:</span>
                  <span className="font-semibold text-slate-900">{displayWaktu}</span>
                </div>
                <div className="flex">
                  <span className="w-32">Kapasitas Ruang</span>
                  <span className="w-4">:</span>
                  <span>{currentRuang.kapasitas || 36} Kursi ({pesertaRuang.length} Siswa Terisi)</span>
                </div>
              </div>
            </div>

            {/* Tabel Presensi Siswa Sesuai Gambar */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-900 text-xs table-fixed">
                <colgroup>
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: showNoPeserta ? '18%' : '26%' }} />
                  <col style={{ width: '5%' }} />
                  {showNoPeserta && <col style={{ width: '8%' }} />}
                  {/* 8 Kolom Tanda Tangan Mapel dibuat 100% SAMA LEBAR (masing-masing 6.875% = 55% total) */}
                  <col style={{ width: showNoPeserta ? '6.875%' : '6.875%' }} />
                  <col style={{ width: showNoPeserta ? '6.875%' : '6.875%' }} />
                  <col style={{ width: showNoPeserta ? '6.875%' : '6.875%' }} />
                  <col style={{ width: showNoPeserta ? '6.875%' : '6.875%' }} />
                  <col style={{ width: showNoPeserta ? '6.875%' : '6.875%' }} />
                  <col style={{ width: showNoPeserta ? '6.875%' : '6.875%' }} />
                  <col style={{ width: showNoPeserta ? '6.875%' : '6.875%' }} />
                  <col style={{ width: showNoPeserta ? '6.875%' : '6.875%' }} />
                </colgroup>
                <thead>
                  {/* Baris 1: Kolom Utama & Header Induk Tanda Tangan */}
                  <tr className="bg-white text-slate-950 font-bold text-center">
                    <th rowSpan={3} className="border border-slate-900 px-1 py-2 text-center">No</th>
                    <th rowSpan={3} className="border border-slate-900 px-1 py-2 text-center">NIS</th>
                    <th rowSpan={3} className="border border-slate-900 px-2 py-2 text-left truncate">Nama Peserta</th>
                    <th rowSpan={3} className="border border-slate-900 px-1 py-2 text-center">Kelas</th>
                    {showNoPeserta && (
                      <th rowSpan={3} className="border border-slate-900 px-1 py-2 text-center font-mono">No. Peserta</th>
                    )}
                    <th colSpan={8} className="border border-slate-900 px-2 py-1.5 text-center font-black tracking-wide text-xs">
                      Tanda Tangan
                    </th>
                  </tr>

                  {/* Baris 2: Hari-Hari (Senin, Selasa, Rabu, Kamis - Masing-masing persis 2 kolom sama lebar) */}
                  <tr className="bg-white text-slate-950 font-bold text-center text-xs">
                    <th colSpan={2} className="border border-slate-900 px-1 py-1">Senin</th>
                    <th colSpan={2} className="border border-slate-900 px-1 py-1">Selasa</th>
                    <th colSpan={2} className="border border-slate-900 px-1 py-1">Rabu</th>
                    <th colSpan={2} className="border border-slate-900 px-1 py-1">Kamis</th>
                  </tr>

                  {/* Baris 3: 8 Mata Pelajaran - Lebar Seragam & Simetris */}
                  <tr className="bg-white text-slate-950 font-bold text-center text-[10px]">
                    <th className="border border-slate-900 px-0.5 py-1 font-bold">PAIBP</th>
                    <th className="border border-slate-900 px-0.5 py-1 font-bold">B. Indo</th>
                    <th className="border border-slate-900 px-0.5 py-1 font-bold">IPS</th>
                    <th className="border border-slate-900 px-0.5 py-1 font-bold">B. Inggris</th>
                    <th className="border border-slate-900 px-0.5 py-1 font-bold">IPA</th>
                    <th className="border border-slate-900 px-0.5 py-1 font-bold">PPKN</th>
                    <th className="border border-slate-900 px-0.5 py-1 font-bold">Matematika</th>
                    <th className="border border-slate-900 px-0.5 py-1 font-bold">B. Sunda</th>
                  </tr>
                </thead>
                <tbody>
                  {pesertaRuang.length === 0 ? (
                    <tr>
                      <td colSpan={showNoPeserta ? 13 : 12} className="border border-slate-900 py-10 text-center text-slate-500 italic">
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            Sedang memuat data peserta ujian...
                          </span>
                        ) : (
                          'Belum ada peserta ujian di ruangan ini. Silakan masukkan atau impor data siswa pada menu Data Siswa.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    pesertaRuang.map((peserta, idx) => {
                      const siswa = peserta.siswa;
                      const kelasNama = siswa?.kelas?.nama_kelas || DEMO_KELAS.find(k => k.id === siswa?.kelas_id)?.nama_kelas || '-';

                      return (
                        <tr key={peserta.id} className="h-8 print:h-[28px] hover:bg-slate-50 text-slate-950">
                          <td className="border border-slate-900 px-2 py-0.5 text-center font-medium">{idx + 1}</td>
                          <td className="border border-slate-900 px-2 py-0.5 text-center font-mono font-medium">{siswa?.nis || siswa?.nisn || '-'}</td>
                          <td className="border border-slate-900 px-3 py-0.5 font-bold uppercase text-slate-950 truncate max-w-[200px]">{siswa?.nama_lengkap}</td>
                          <td className="border border-slate-900 px-2 py-0.5 text-center font-medium">{kelasNama}</td>
                          {showNoPeserta && (
                            <td className="border border-slate-900 px-2 py-0.5 text-center font-mono font-bold">{peserta.no_peserta}</td>
                          )}
                          {/* 8 Kotak Kosong Tanda Tangan Siswa */}
                          <td className="border border-slate-900 px-1 py-0.5 text-center"></td>
                          <td className="border border-slate-900 px-1 py-0.5 text-center"></td>
                          <td className="border border-slate-900 px-1 py-0.5 text-center"></td>
                          <td className="border border-slate-900 px-1 py-0.5 text-center"></td>
                          <td className="border border-slate-900 px-1 py-0.5 text-center"></td>
                          <td className="border border-slate-900 px-1 py-0.5 text-center"></td>
                          <td className="border border-slate-900 px-1 py-0.5 text-center"></td>
                          <td className="border border-slate-900 px-1 py-0.5 text-center"></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Berita Acara Singkat & Tanda Tangan Pengawas (Opsional: Default Sembunyi) */}
            {showTtdPengawas && (
              <div className="mt-4 pt-2 text-xs text-slate-900 font-medium">
                <div className="grid grid-cols-2 gap-8 items-start">
                  <div className="border border-slate-900 rounded p-2.5 bg-slate-50/50 print:bg-transparent">
                    <p className="font-bold mb-1 text-[11px] text-slate-950 uppercase">Catatan Pengawas Ruang:</p>
                    <div className="text-[10px] space-y-1 text-slate-800">
                      <p>&bull; Jumlah Peserta Seharusnya : <strong>{pesertaRuang.length}</strong> orang</p>
                      <p>&bull; Jumlah Peserta Hadir : ......... orang</p>
                      <p>&bull; Jumlah Peserta Tidak Hadir : ......... orang</p>
                    </div>
                  </div>

                  <div className="flex justify-around text-center text-xs">
                    <div>
                      <p className="font-semibold">Pengawas 1,</p>
                      <div className="h-10"></div>
                      <p className="font-bold border-b border-slate-900 inline-block px-4 min-w-[140px]">(.....................................)</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">NIP.</p>
                    </div>

                    <div>
                      <p className="font-semibold">Pengawas 2,</p>
                      <div className="h-10"></div>
                      <p className="font-bold border-b border-slate-900 inline-block px-4 min-w-[140px]">(.....................................)</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">NIP.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* TEMPLATE HARIAN PER MATA PELAJARAN (FORMAT LAMA)              */
          /* ============================================================== */
          <div>
            {/* Header Format Panitia Ujian dengan Logo Kiri (Pemda) & Kanan (Sekolah) Menyesuaikan KOP */}
            <div className="flex items-center justify-between gap-3 sm:gap-4 mb-2 pb-1">
              {/* Logo Kiri: Pemerintah Daerah */}
              <div className="w-[58px] sm:w-[68px] h-[58px] sm:h-[68px] flex-shrink-0 flex items-center justify-center">
                <AutoTrimmedLogo
                  src={schoolSettings.logoPemdaUrl || schoolSettings.logoTasikmalayaUrl}
                  fallbackSrc="/images/logo-tasikmalaya.png"
                  alt="Logo Pemda"
                  className="w-full h-full object-contain filter drop-shadow-sm select-none"
                />
              </div>

              {/* Teks Kop Tengah */}
              <div className="flex-1 text-center font-bold text-slate-950 space-y-0.5 px-2">
                <p className="text-xs sm:text-sm md:text-[15px] font-black tracking-wide uppercase text-slate-950">
                  PANITIA PELAKSANA ASESMEN DAN UJIAN
                </p>
                <h1 className="text-xs sm:text-sm md:text-[15px] font-black tracking-wide uppercase text-slate-950">
                  {schoolSettings.namaSekolah === 'SMP NEGERI 1 RAJAPOLAH' ? 'SMPN 1 RAJAPOLAH' : (schoolSettings.namaSekolah || 'SMPN 1 RAJAPOLAH')}
                </h1>
                <p className="text-xs sm:text-sm md:text-[15px] font-black tracking-wide uppercase text-slate-950">
                  DAFTAR HADIR PESERTA UJIAN {filterMode === 'kelas' ? `(KELAS ${currentKelas.nama_kelas})` : ''}
                </p>
                <p className="text-[11px] sm:text-xs md:text-[13px] font-black tracking-wide uppercase text-slate-900">
                  {schoolSettings.namaUjian || 'SUMATIF AKHIR SEMESTER (SAS)'} TAHUN PELAJARAN {schoolSettings.tahunAjaran || '2026/2027'}
                </p>
              </div>

              {/* Logo Kanan: Sekolah (SMPN 1 Rajapolah) */}
              <div className="w-[58px] sm:w-[68px] h-[58px] sm:h-[68px] flex-shrink-0 flex items-center justify-center">
                <AutoTrimmedLogo
                  src={schoolSettings.logoSekolahUrl}
                  fallbackSrc="/images/logo-smpn1-rajapolah.png"
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain filter drop-shadow-sm select-none"
                />
              </div>
            </div>

            {/* Garis Ganda Pembatas Standar */}
            <div className="border-b-4 border-double border-slate-950 mb-3" />

            {/* Informasi Detail Ruang & Jadwal (Sinkron Penuh) */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-900 mb-4 pb-3 border-b border-dashed border-slate-400">
              <div className="space-y-1">
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-600">{filterMode === 'ruang' ? 'Ruangan' : 'Rombel Kelas'}</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-7 font-bold">
                    {filterMode === 'ruang' 
                      ? `${currentRuang.kode_ruang} (${currentRuang.nama_ruang})`
                      : `Kelas ${currentKelas.nama_kelas}`
                    }
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-600">Mata Pelajaran</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-7 font-bold">{currentMapel?.nama_mapel} ({currentMapel?.kode_mapel})</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-600">Sesi</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-7 font-bold text-indigo-900 print:text-black">{displaySesi}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-600">Hari / Tanggal</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-7 font-medium">{formatHariTanggalIndo(currentJadwal?.tanggal)}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-600">Pukul / Waktu</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-7 font-medium">{displayWaktu}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-600">Jumlah Peserta</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-7 font-medium">{pesertaRuang.length} {filterMode === 'ruang' ? `/ ${currentRuang.kapasitas}` : ''} Peserta</span>
                </div>
              </div>
            </div>

            {/* Tabel Presensi Siswa */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 uppercase font-bold text-[10px] text-center tracking-wider">
                    <th className="border border-slate-400 px-2 py-2 w-10">No</th>
                    <th className="border border-slate-400 px-2 py-2 w-16">No Meja</th>
                    {showNoPeserta && (
                      <th className="border border-slate-400 px-3 py-2 w-32">Nomor Peserta</th>
                    )}
                    <th className="border border-slate-400 px-3 py-2 w-28">NIS</th>
                    <th className="border border-slate-400 px-3 py-2 text-left">Nama Peserta Ujian</th>
                    <th className="border border-slate-400 px-2 py-2 w-16">Kelas</th>
                    <th className="border border-slate-400 px-3 py-2 w-44" colSpan={2}>
                      Tanda Tangan / Kehadiran
                    </th>
                    <th className="border border-slate-400 px-2 py-2 w-20">Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {pesertaRuang.length === 0 && (
                    <tr>
                      <td colSpan={showNoPeserta ? 9 : 8} className="border border-slate-400 py-10 text-center text-slate-500 italic">
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            Sedang memuat data peserta ujian...
                          </span>
                        ) : (
                          'Belum ada peserta ujian di ruangan ini. Silakan masukkan atau impor data siswa pada menu Data Siswa.'
                        )}
                      </td>
                    </tr>
                  )}
                  {pesertaRuang.map((peserta, idx) => {
                    const siswa = peserta.siswa;
                    const kelasNama = siswa?.kelas?.nama_kelas || DEMO_KELAS.find(k => k.id === siswa?.kelas_id)?.nama_kelas || '-';
                    const isEven = (idx + 1) % 2 === 0;

                    return (
                      <tr key={peserta.id} className="h-10 hover:bg-slate-50">
                        <td className="border border-slate-400 px-2 py-1 text-center font-medium">{idx + 1}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center font-bold font-mono bg-slate-50/50">
                          {peserta.no_meja || idx + 1}
                        </td>
                        {showNoPeserta && (
                          <td className="border border-slate-400 px-3 py-1 text-center font-mono font-bold text-slate-900">
                            {peserta.no_peserta}
                          </td>
                        )}
                        <td className="border border-slate-400 px-3 py-1 text-center font-mono text-slate-700">
                          {siswa?.nis || siswa?.nisn || '-'}
                        </td>
                        <td className="border border-slate-400 px-3 py-1 font-bold text-slate-900 uppercase">
                          {siswa?.nama_lengkap}
                        </td>
                        <td className="border border-slate-400 px-2 py-1 text-center font-medium">
                          {kelasNama}
                        </td>

                        {/* Kolom Tanda Tangan Ganjil */}
                        <td className="border border-slate-400 px-2 py-1 w-22 align-top text-[10px] text-slate-600">
                          {!isEven && (
                            <span>{idx + 1}. ....................</span>
                          )}
                        </td>

                        {/* Kolom Tanda Tangan Genap */}
                        <td className="border border-slate-400 px-2 py-1 w-22 align-top text-[10px] text-slate-600">
                          {isEven && (
                            <span>{idx + 1}. ....................</span>
                          )}
                        </td>

                        <td className="border border-slate-400 px-2 py-1 text-center text-[10px] text-slate-400">
                          [ &nbsp; ] Hadir
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Berita Acara Singkat & Tanda Tangan Pengawas (Opsional: Default Sembunyi) */}
            {showTtdPengawas && (
              <div className="mt-6 pt-3 border-t border-slate-300 text-xs text-slate-800">
                <div className="grid grid-cols-2 gap-8">
                  <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50">
                    <p className="font-bold mb-1 text-[11px] text-slate-900 uppercase">Catatan Pengawas Ruang:</p>
                    <div className="text-[10px] space-y-1 text-slate-700">
                      <p>&bull; Jumlah Peserta Seharusnya : <strong>{pesertaRuang.length}</strong> orang</p>
                      <p>&bull; Jumlah Peserta Hadir : ......... orang</p>
                      <p>&bull; Jumlah Peserta Tidak Hadir : ......... orang</p>
                    </div>
                  </div>

                  <div className="flex justify-around text-center text-xs">
                    <div>
                      <p>Pengawas 1,</p>
                      <div className="h-12"></div>
                      <p className="font-bold border-b border-slate-900 inline-block px-4">(.....................................)</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">NIP.</p>
                    </div>

                    <div>
                      <p>Pengawas 2,</p>
                      <div className="h-12"></div>
                      <p className="font-bold border-b border-slate-900 inline-block px-4">(.....................................)</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">NIP.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
