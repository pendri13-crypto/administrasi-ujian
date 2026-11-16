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
import { PesertaUjian, Siswa, Ruang, JadwalUjian, Mapel } from '@/types/database';
import { Printer, DoorOpen, Calendar, Clock, Layers } from 'lucide-react';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { 
  fetchSiswaFromCloud, 
  getStoredRuang, 
  getStoredJadwal, 
  getStoredMapel, 
  fetchJadwalFromCloud 
} from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function DaftarHadirPage() {
  const [selectedRuangId, setSelectedRuangId] = useState<number>(1);
  const [selectedJadwalId, setSelectedJadwalId] = useState<number | null>(null);
  const [selectedSesiMode, setSelectedSesiMode] = useState<string>('auto'); // 'auto', '1', '2'
  const [ruangList, setRuangList] = useState<Ruang[]>(getStoredRuang());
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>(getStoredJadwal());
  const [mapelList, setMapelList] = useState<Mapel[]>(getStoredMapel());
  const [pesertaList, setPesertaList] = useState<PesertaUjian[]>(DEMO_PESERTA);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);

  // 1. Sinkronisasi Pengaturan Sekolah (Kop Dokumen)
  useEffect(() => {
    const updateSettings = () => {
      setSchoolSettings(getStoredSchoolSettings());
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
    const syncData = () => {
      try {
        const currentStoredRuang = getStoredRuang();
        const saved = localStorage.getItem('adm_siswa_data');
        if (saved) {
          const parsedSiswa: Siswa[] = JSON.parse(saved);
          if (Array.isArray(parsedSiswa) && parsedSiswa.length > 0) {
            if (parsedSiswa.some(s => s.nama_lengkap === 'ADELFIO PRADITYA PUTRA' && s.id === 1)) {
              localStorage.removeItem('adm_siswa_data');
              setPesertaList([]);
              return;
            }
            setPesertaList(generatePesertaFromSiswa(parsedSiswa, currentStoredRuang));
            return;
          }
        }
        if (isSupabaseConfigured) {
          fetchSiswaFromCloud().then(cloudSiswa => {
            if (cloudSiswa && cloudSiswa.length > 0) {
              setPesertaList(generatePesertaFromSiswa(cloudSiswa, currentStoredRuang));
            }
          });
        }
        setPesertaList([]);
      } catch (e) {
        console.error(e);
      }
    };

    syncData();
    window.addEventListener('storage', syncData);
    return () => window.removeEventListener('storage', syncData);
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

  const displaySesi = selectedSesiMode === 'auto' ? autoSesi : Number(selectedSesiMode);

  // Waktu pelaksanaan ujian dari jadwal aktif
  const displayWaktu = currentJadwal
    ? `${currentJadwal.jam_mulai.slice(0, 5)} - ${currentJadwal.jam_selesai.slice(0, 5)} WIB`
    : '08:00 - 09:30 WIB';

  // Ruangan yang sedang dipilih
  const currentRuang = ruangList.find(r => r.id === selectedRuangId) || ruangList[0] || DEMO_RUANG[0];

  // Peserta yang ditempatkan di ruang ini
  const pesertaRuang = pesertaList
    .filter(p => p.ruang_id === selectedRuangId)
    .sort((a, b) => (a.no_meja || 0) - (b.no_meja || 0));

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Daftar Hadir Per Ruang Ujian</h2>
          <p className="text-xs text-slate-500 mt-1">
            Waktu, sesi, dan mata pelajaran otomatis sinkron dengan Manajemen Jadwal Ujian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Pilih Ruangan */}
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
              <option value="auto">Sesi {autoSesi} (Otomatis)</option>
              <option value="1">Sesi 1</option>
              <option value="2">Sesi 2</option>
            </select>
          </div>

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

      {/* Lembar Dokumen Siap Cetak (A4 Standard) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        {/* Kop Resmi Ujian */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
          <p className="text-[10px] tracking-widest font-bold text-slate-700 uppercase">
            PANITIA PELAKSANA ASESMEN DAN UJIAN • {schoolSettings.namaSekolah}
          </p>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
            DAFTAR HADIR PESERTA UJIAN
          </h2>
          <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">
            {schoolSettings.namaUjian} • TAHUN PELAJARAN {schoolSettings.tahunAjaran}
          </p>
        </div>

        {/* Informasi Detail Ruang & Jadwal (Sinkron Penuh) */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-900 mb-4 pb-3 border-b border-dashed border-slate-400">
          <div className="space-y-1">
            <div className="grid grid-cols-12">
              <span className="col-span-4 font-semibold text-slate-600">Ruangan</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-bold">{currentRuang.kode_ruang} ({currentRuang.nama_ruang})</span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4 font-semibold text-slate-600">Mata Pelajaran</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-bold">{currentMapel?.nama_mapel} ({currentMapel?.kode_mapel})</span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4 font-semibold text-slate-600">Sesi</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-bold text-indigo-900 print:text-black">Sesi {displaySesi}</span>
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
              <span className="col-span-4 font-semibold text-slate-600">Kapasitas Ruang</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-medium">{pesertaRuang.length} / {currentRuang.kapasitas} Peserta</span>
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
                <th className="border border-slate-400 px-3 py-2 w-32">Nomor Peserta</th>
                <th className="border border-slate-400 px-3 py-2 w-24">NISN</th>
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
                  <td colSpan={9} className="border border-slate-400 py-10 text-center text-slate-400 italic">
                    Belum ada peserta ujian di ruangan ini. Silakan masukkan atau impor data siswa pada menu <b>Data Siswa</b>.
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
                    <td className="border border-slate-400 px-3 py-1 text-center font-mono font-bold text-slate-900">
                      {peserta.no_peserta}
                    </td>
                    <td className="border border-slate-400 px-3 py-1 text-center font-mono text-slate-700">
                      {siswa?.nisn}
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

        {/* Berita Acara Singkat & Tanda Tangan Pengawas */}
        <div className="mt-6 pt-3 border-t border-slate-300 text-xs text-slate-800">
          <div className="grid grid-cols-2 gap-8">
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50">
              <p className="font-bold mb-1 text-[11px] text-slate-900 uppercase">Catatan Pengawas Ruang:</p>
              <div className="text-[10px] space-y-1 text-slate-700">
                <p>• Jumlah Peserta Seharusnya : <strong>{pesertaRuang.length}</strong> orang</p>
                <p>• Jumlah Peserta Hadir : ......... orang</p>
                <p>• Jumlah Peserta Tidak Hadir : ......... orang</p>
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

      </div>
    </div>
  );
}
