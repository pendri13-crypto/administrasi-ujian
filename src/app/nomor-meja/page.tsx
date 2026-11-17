'use client';

import { useState, useEffect } from 'react';
import { DEMO_PESERTA, DEMO_SISWA, DEMO_RUANG, DEMO_KELAS, generatePesertaFromSiswa } from '@/lib/demo-data';
import { PesertaUjian, Siswa, Ruang, Kelas } from '@/types/database';
import { Printer, Filter, DoorOpen, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { fetchSiswaFromCloud, fetchRuangFromCloud, getStoredRuang, fetchSplitRulesFromCloud } from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function NomorMejaPage() {
  const [filterMode, setFilterMode] = useState<'ruang' | 'kelas'>('ruang');
  const [selectedRuangId, setSelectedRuangId] = useState<string>('all');
  const [selectedKelasId, setSelectedKelasId] = useState<string>('all');
  const [ruangList, setRuangList] = useState<Ruang[]>(getStoredRuang());
  const [kelasList, setKelasList] = useState<Kelas[]>(DEMO_KELAS);
  const [pesertaList, setPesertaList] = useState<PesertaUjian[]>(DEMO_PESERTA);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [showNoPeserta, setShowNoPeserta] = useState<boolean>(false);

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

  useEffect(() => {
    // 1. Baca data lokal pertama kali (cepat & instan)
    const currentStoredRuang = getStoredRuang();
    const saved = localStorage.getItem('adm_siswa_data');
    if (saved) {
      try {
        const parsedSiswa: Siswa[] = JSON.parse(saved);
        if (Array.isArray(parsedSiswa) && parsedSiswa.length > 0) {
          setPesertaList(generatePesertaFromSiswa(parsedSiswa, currentStoredRuang));
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
      }).catch(err => {
        console.error(err);
      });
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

  const filteredPeserta = pesertaList
    .filter((p) => {
      if (filterMode === 'ruang') {
        if (selectedRuangId === 'all') return true;
        const rId = Number(selectedRuangId);
        if (p.ruang_id === rId) return true;
        if (p.ruang?.id === rId) return true;
        const curR = ruangList.find(r => r.id === rId);
        if (curR && p.ruang?.kode_ruang && curR.kode_ruang && p.ruang.kode_ruang.trim().toLowerCase() === curR.kode_ruang.trim().toLowerCase()) return true;
        return false;
      } else {
        if (selectedKelasId === 'all') return true;
        const kId = Number(selectedKelasId);
        const targetK = kelasList.find(k => k.id === kId);
        return p.siswa?.kelas_id === kId ||
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

  const activeLabelTitle = filterMode === 'ruang'
    ? (selectedRuangId === 'all' ? 'Semua Ruangan' : (ruangList.find(r => r.id.toString() === selectedRuangId)?.kode_ruang || 'Ruang Terpilih'))
    : (selectedKelasId === 'all' ? 'Semua Kelas' : (kelasList.find(k => k.id.toString() === selectedKelasId)?.nama_kelas || 'Kelas Terpilih'));

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Cetak Nomor Meja / Label Bangku</h2>
            <p className="text-xs text-slate-500 mt-1">
              Label meja peserta ujian siap tempel (Kertas F4 / A4) &bull; Filter: <b>{activeLabelTitle}</b> &bull; Menampilkan {filteredPeserta.length} label meja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switch: Per Ruangan vs Per Kelas */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('ruang');
                  setSelectedKelasId('all');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterMode === 'ruang'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                Per Ruangan
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('kelas');
                  setSelectedRuangId('all');
                }}
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

            {/* Filter Dropdown sesuai mode */}
            {filterMode === 'ruang' ? (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedRuangId}
                  onChange={(e) => setSelectedRuangId(e.target.value)}
                  className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                >
                  <option value="all">Semua Ruang Ujian ({ruangList.length} Ruangan)</option>
                  {ruangList.map((r) => (
                    <option key={r.id} value={r.id}>{r.kode_ruang} - {r.nama_ruang}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-400" />
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="text-xs font-semibold border border-purple-300 rounded-lg px-3 py-2 bg-white text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                >
                  <option value="all">Semua Kelas ({kelasList.length} Kelas)</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Toggle Tampilkan / Hilangkan No. Peserta */}
            <button
              type="button"
              onClick={() => setShowNoPeserta(!showNoPeserta)}
              title={showNoPeserta ? "Nomor Peserta Ditampilkan (Klik untuk hilangkan)" : "Nomor Peserta Dihilangkan (Klik untuk tampilkan)"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showNoPeserta 
                  ? 'bg-blue-50 text-blue-700 border-blue-300' 
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
            >
              {showNoPeserta ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>No. Peserta: Tampil</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>No. Peserta: Dihilangkan</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Cetak Label Meja
            </button>
          </div>
        </div>
      </div>

      {/* Grid Label Meja - 2 Kolom x 4 Baris = 8 label per halaman A4 */}
      {filteredPeserta.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
          <p className="font-bold text-slate-800 text-base">Belum Ada Data Nomor Meja</p>
          <p className="text-xs text-slate-400 mt-1.5">
            Silakan masukkan atau impor data siswa pada menu <b>Data Siswa</b> untuk mencetak nomor meja ujian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
        {filteredPeserta.map((peserta) => {
          const siswa = peserta.siswa;
          const kelas = DEMO_KELAS.find(k => k.id === siswa?.kelas_id);
          const ruang = peserta.ruang;

          return (
            <div
              key={peserta.id}
              className="card-item bg-white border-2 border-dashed border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
              style={{ minHeight: '62mm' }}
            >
              {/* Kop Kecil */}
              <div className="border-b border-slate-700 pb-1.5 flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-700 uppercase">{schoolSettings.namaUjian}</span>
                <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-bold text-[9px]">
                  {ruang?.kode_ruang}
                </span>
              </div>

              {/* Badan Label */}
              <div className="flex items-center justify-between py-2 gap-4">
                <div className="space-y-1.5 text-xs flex-1">
                  {showNoPeserta && (
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Nomor Peserta:</p>
                      <p className="text-base font-black font-mono tracking-wider text-slate-950">
                        {peserta.no_peserta}
                      </p>
                    </div>
                  )}
                  <p className={`font-black text-slate-950 uppercase ${!showNoPeserta ? 'text-sm' : 'text-xs pt-1'}`}>
                    {siswa?.nama_lengkap}
                  </p>
                  <p className="text-xs text-slate-700 font-medium">
                    NIS: <span className="font-mono font-bold text-slate-900">{siswa?.nis || siswa?.nisn || '-'}</span>
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Kelas: <span className="font-bold text-slate-900">{kelas?.nama_kelas || '-'}</span>
                  </p>
                </div>

                {/* Nomor Meja Besar */}
                <div className="text-center bg-slate-100 border-2 border-slate-800 rounded-xl p-2.5 min-w-[70px]">
                  <span className="text-[9px] uppercase font-bold text-slate-600 block">MEJA</span>
                  <span className="text-3xl font-black text-slate-950 font-mono">
                    {peserta.no_meja ? String(peserta.no_meja).padStart(2, '0') : '--'}
                  </span>
                  <span className="text-[8px] font-semibold text-blue-700 block mt-0.5">Sesi {peserta.sesi}</span>
                </div>
              </div>

              {/* Garis Potong Sticker */}
              <div className="border-t border-dotted border-slate-400 pt-1 flex justify-between items-center text-[8px] text-slate-400 italic">
                <span>✂ Gunting sesuai garis tepi</span>
                <span>Tempelkan pada sudut kanan atas meja</span>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

