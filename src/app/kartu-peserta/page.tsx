'use client';

import { useState, useEffect } from 'react';
import { DEMO_PESERTA, DEMO_SISWA, DEMO_KELAS, DEMO_RUANG, generatePesertaFromSiswa } from '@/lib/demo-data';
import { PesertaUjian, Siswa } from '@/types/database';
import { Printer, Filter, Image as ImageIcon, QrCode, Eye, EyeOff } from 'lucide-react';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { fetchSiswaFromCloud, fetchRuangFromCloud, getStoredRuang, fetchSplitRulesFromCloud } from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function KartuPesertaPage() {
  const [selectedKelas, setSelectedKelas] = useState<string>('1'); // Default ke Kelas VII-A agar browser langsung enteng & tidak crash
  const [selectedRuang, setSelectedRuang] = useState<string>('all');
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const BATCH_SIZE_PAGES = 10; // Maksimal 10 lembar F4 (80 kartu) per tampilan batch agar memori browser sangat aman
  const [layoutMode, setLayoutMode] = useState<'8' | '6' | '4' | '2'>('8'); // 8 per halaman (F4 penuh hemat kertas), 6 per halaman, 4 per halaman, atau 2 per halaman
  const [ruangList, setRuangList] = useState(getStoredRuang());
  const [pesertaList, setPesertaList] = useState<PesertaUjian[]>(DEMO_PESERTA);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [showNoPeserta, setShowNoPeserta] = useState<boolean>(false);

  // Sinkronisasi data sekolah dan foto siswa dari localStorage
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
    const storedRuang = getStoredRuang();
    const saved = localStorage.getItem('adm_siswa_data');
    if (saved) {
      try {
        const parsedSiswa: Siswa[] = JSON.parse(saved);
        if (Array.isArray(parsedSiswa) && parsedSiswa.length > 0) {
          setPesertaList(generatePesertaFromSiswa(parsedSiswa, storedRuang));
        }
      } catch (e) {
        console.error('Gagal membaca cache lokal:', e);
      }
    }

    // 2. Tarik update terbaru dari Cloud HANYA SEKALI saat halaman dimuat
    if (isSupabaseConfigured) {
      Promise.all([
        fetchRuangFromCloud(),
        fetchSplitRulesFromCloud(),
        fetchSiswaFromCloud()
      ]).then(([cloudRuang, rules, cloudSiswa]) => {
        const activeRuang = (cloudRuang && cloudRuang.length > 0) ? cloudRuang : (storedRuang.length > 0 ? storedRuang : getStoredRuang());
        if (cloudRuang && cloudRuang.length > 0) {
          setRuangList(cloudRuang);
        }
        if (cloudSiswa && cloudSiswa.length > 0) {
          setPesertaList(generatePesertaFromSiswa(cloudSiswa, activeRuang, rules || undefined));
        }
      }).catch(err => {
        console.error('Gagal sinkron cloud:', err);
      });
    }

    // 3. Listener hanya untuk update lokal dari tab lain / form tanpa loop cloud
    const handleLocalUpdate = () => {
      try {
        const currentRuang = getStoredRuang();
        const localSaved = localStorage.getItem('adm_siswa_data');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPesertaList(generatePesertaFromSiswa(parsed, currentRuang));
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

  const handleSelectKelas = (val: string) => {
    setSelectedKelas(val);
    setCurrentBatch(0);
    if (val !== 'all') {
      setSelectedRuang('all');
    }
  };

  const handleSelectRuang = (val: string) => {
    setSelectedRuang(val);
    setCurrentBatch(0);
    if (val !== 'all') {
      setSelectedKelas('all');
    }
  };

  const handleResetFilter = () => {
    setSelectedKelas('all');
    setSelectedRuang('all');
    setCurrentBatch(0);
  };

  const filteredPeserta = pesertaList
    .filter((p) => {
      let matchKelas = selectedKelas === 'all';
      if (!matchKelas) {
        const targetK = DEMO_KELAS.find(k => k.id.toString() === selectedKelas);
        matchKelas = p.siswa?.kelas_id?.toString() === selectedKelas ||
          (targetK ? p.siswa?.kelas?.nama_kelas?.toLowerCase() === targetK.nama_kelas.toLowerCase() : false) ||
          (targetK ? (p.siswa as any)?.nama_kelas?.toLowerCase() === targetK.nama_kelas.toLowerCase() : false);
      }

      let matchRuang = selectedRuang === 'all';
      if (!matchRuang) {
        const targetR = ruangList.find(r => r.id.toString() === selectedRuang || r.kode_ruang === selectedRuang);
        const selNum = Number(selectedRuang.replace(/\D/g, ''));
        const pNum = Number(p.ruang?.kode_ruang?.replace(/\D/g, ''));
        const rNum = targetR ? Number(targetR.kode_ruang?.replace(/\D/g, '')) : 0;

        matchRuang = p.ruang_id?.toString() === selectedRuang ||
          (targetR ? p.ruang?.id === targetR.id : false) ||
          (targetR && p.ruang?.kode_ruang && targetR.kode_ruang ? p.ruang.kode_ruang.trim().toLowerCase() === targetR.kode_ruang.trim().toLowerCase() : false) ||
          (selNum > 0 && pNum > 0 && selNum === pNum) ||
          (rNum > 0 && pNum > 0 && rNum === pNum);
      }
      return matchKelas && matchRuang;
    })
    .sort((a, b) => {
      // Urutkan Nama Siswa A-Z
      const namaA = a.siswa?.nama_lengkap || '';
      const namaB = b.siswa?.nama_lengkap || '';
      return namaA.localeCompare(namaB, 'id', { sensitivity: 'base' });
    });

  // Kelompokkan kartu per lembar F4 (8 kartu, 6 kartu, 4 kartu, atau 2 kartu per halaman)
  const pageSize = layoutMode === '8' ? 8 : layoutMode === '6' ? 6 : layoutMode === '4' ? 4 : 2;
  const allPages: PesertaUjian[][] = [];
  for (let i = 0; i < filteredPeserta.length; i += pageSize) {
    allPages.push(filteredPeserta.slice(i, i + pageSize));
  }

  // Terapkan pembagian batch jika jumlah lembar > BATCH_SIZE_PAGES agar browser tidak Out of Memory (Error 39)
  const totalBatches = Math.max(1, Math.ceil(allPages.length / BATCH_SIZE_PAGES));
  const safeBatchIdx = Math.min(currentBatch, totalBatches - 1);
  const displayedPages = allPages.length > BATCH_SIZE_PAGES
    ? allPages.slice(safeBatchIdx * BATCH_SIZE_PAGES, (safeBatchIdx + 1) * BATCH_SIZE_PAGES)
    : allPages;
  const startPageNum = safeBatchIdx * BATCH_SIZE_PAGES + 1;
  const endPageNum = Math.min((safeBatchIdx + 1) * BATCH_SIZE_PAGES, allPages.length);

  const handlePrint = () => {
    window.print();
  };

  const isMode8 = layoutMode === '8';
  const isMode6 = layoutMode === '6';

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Cetak Kartu Peserta Ujian (Kertas F4 / Folio)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Format Standar F4 / Folio (215 x 330 mm) &bull; Menampilkan {filteredPeserta.length} kartu ({allPages.length} lembar F4 &bull; {layoutMode} kartu per lembar).
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedKelas}
                onChange={(e) => handleSelectKelas(e.target.value)}
                className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kelas ({pesertaList.length} Siswa)</option>
                {DEMO_KELAS.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                ))}
              </select>

              <select
                value={selectedRuang}
                onChange={(e) => handleSelectRuang(e.target.value)}
                className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Ruang</option>
                {ruangList.map((r) => (
                  <option key={r.id} value={r.id}>{r.kode_ruang} - {r.nama_ruang}</option>
                ))}
              </select>

              {(selectedKelas !== 'all' || selectedRuang !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition"
                >
                  Semua Kelas
                </button>
              )}

              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as '8' | '6' | '4' | '2')}
                className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="8">8 Kartu / Lembar F4 (Grid 2x4 - Hemat & Pas)</option>
                <option value="6">6 Kartu / Lembar F4 (Grid 2x3 - Standar)</option>
                <option value="4">4 Kartu / Lembar F4 (Grid 2x2)</option>
                <option value="2">2 Kartu / Lembar F4 (Besar)</option>
              </select>

              <button
                type="button"
                onClick={() => setShowNoPeserta(!showNoPeserta)}
                title={showNoPeserta ? "Nomor Peserta Ditampilkan (Klik untuk hilangkan)" : "Nomor Peserta Dihilangkan (Klik untuk tampilkan)"}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
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
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Cetak Kartu Sekarang
            </button>
          </div>
        </div>

        {/* Navigator Batch jika lembar cetak sangat banyak (Mencegah browser tab crash / error 39) */}
        {totalBatches > 1 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-extrabold bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[11px]">
                Bagian {safeBatchIdx + 1} dari {totalBatches}
              </span>
              <span className="text-slate-600">
                Menampilkan <b>Lembar {startPageNum} - {endPageNum}</b> ({displayedPages.reduce((acc, p) => acc + p.length, 0)} kartu siap cetak).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeBatchIdx === 0}
                onClick={() => setCurrentBatch(b => Math.max(0, b - 1))}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-bold rounded-lg border border-slate-200 shadow-xs transition"
              >
                &laquo; Lembar Sebelumnya
              </button>
              <select
                value={safeBatchIdx}
                onChange={(e) => setCurrentBatch(Number(e.target.value))}
                className="font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 outline-none"
              >
                {Array.from({ length: totalBatches }).map((_, idx) => {
                  const sP = idx * BATCH_SIZE_PAGES + 1;
                  const eP = Math.min((idx + 1) * BATCH_SIZE_PAGES, allPages.length);
                  return (
                    <option key={idx} value={idx}>
                      Bagian {idx + 1}: Lembar {sP} - {eP}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                disabled={safeBatchIdx >= totalBatches - 1}
                onClick={() => setCurrentBatch(b => Math.min(totalBatches - 1, b + 1))}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-bold rounded-lg border border-slate-200 shadow-xs transition"
              >
                Lembar Selanjutnya &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid Kartu Peserta - Siap Cetak Kertas F4 */}
      {filteredPeserta.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
          <p className="font-bold text-slate-800 text-base">Belum Ada Data Kartu Peserta</p>
          <p className="text-xs text-slate-400 mt-1.5">
            Silakan masukkan atau impor data siswa pada menu <b>Data Siswa</b> untuk mencetak kartu peserta ujian.
          </p>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {displayedPages.map((pagePeserta, pageIdx) => (
            <div
              key={pageIdx}
              className={`print-page ${isMode8 ? 'grid-8' : isMode6 ? 'grid-6' : ''} grid gap-3 print:gap-2 ${
                layoutMode === '2'
                  ? 'grid-cols-1 print:grid-cols-1'
                  : 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
              }`}
            >
              {pagePeserta.map((peserta) => {
                const siswa = peserta.siswa;
                const kelas = DEMO_KELAS.find(k => k.id === siswa?.kelas_id) || siswa?.kelas;
                const kelasNama = kelas?.nama_kelas || (siswa as any)?.nama_kelas || (siswa?.kelas_id ? `Kelas ${siswa.kelas_id}` : '-');
                const ruang = peserta.ruang;

                return (
                  <div
                    key={peserta.id}
                    className={`card-item bg-white border-2 border-slate-800 rounded-lg ${
                      isMode8 ? 'p-2' : isMode6 ? 'p-2.5' : 'p-3'
                    } shadow-sm flex flex-col justify-between`}
                    style={{
                      height: isMode8 ? '74mm' : isMode6 ? '100mm' : layoutMode === '4' ? '150mm' : '150mm',
                      maxHeight: isMode8 ? '74.5mm' : isMode6 ? '101mm' : layoutMode === '4' ? '152mm' : '152mm',
                    }}
                  >
                    {/* Kop Kartu Peserta Resmi */}
                    <div className={`border-b-2 sm:border-b-4 border-double border-slate-900 ${
                      isMode8 ? 'pb-0.5 mb-1' : isMode6 ? 'pb-1 mb-1.5' : 'pb-1.5 mb-2'
                    }`}>
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1">
                        {/* Logo Kiri: Pemda Kab. Tasikmalaya */}
                        <div className={`${
                          isMode8 ? 'w-[36px] h-[44px]' : isMode6 ? 'w-[48px] h-[58px]' : 'w-[64px] h-[74px]'
                        } flex-shrink-0 flex items-center justify-center`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={schoolSettings.logoPemdaUrl || schoolSettings.logoTasikmalayaUrl || '/images/logo-tasikmalaya.png'}
                            alt="Logo Pemda"
                            className="w-full h-full object-contain filter drop-shadow-sm select-none"
                          />
                        </div>

                        {/* Teks Kop Tengah */}
                        <div className="flex-1 text-center leading-tight px-1">
                          <h3 className={`${
                            isMode8 ? 'text-[10.5px]' : isMode6 ? 'text-[12.5px]' : 'text-[13px] sm:text-[14px]'
                          } font-black tracking-wide text-slate-950 uppercase`}>
                            KARTU PESERTA
                          </h3>
                          <h4 className={`${
                            isMode8 ? 'text-[9.5px]' : isMode6 ? 'text-[11.5px]' : 'text-[12px] sm:text-[13px]'
                          } font-black text-slate-900 uppercase`}>
                            {schoolSettings.namaUjian}
                          </h4>
                          <p className={`${
                            isMode8 ? 'text-[9px]' : isMode6 ? 'text-[11px]' : 'text-[11px] sm:text-[12px]'
                          } font-black text-slate-900 uppercase`}>
                            {schoolSettings.namaSekolah}
                          </p>
                          <p className={`${
                            isMode8 ? 'text-[8px]' : isMode6 ? 'text-[9.5px]' : 'text-[10px] sm:text-[11px]'
                          } font-extrabold text-slate-800 uppercase tracking-wide`}>
                            TAHUN PELAJARAN {schoolSettings.tahunAjaran}
                          </p>
                        </div>

                        {/* Logo Kanan: SMPN 1 Rajapolah */}
                        <div className={`${
                          isMode8 ? 'w-[36px] h-[44px]' : isMode6 ? 'w-[48px] h-[58px]' : 'w-[64px] h-[74px]'
                        } flex-shrink-0 flex items-center justify-center`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'}
                            alt="Logo Sekolah"
                            className="w-full h-full object-contain filter drop-shadow-sm select-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Konten Utama: Foto & Biodata */}
                    <div className="flex gap-2 sm:gap-3 items-center my-auto flex-1">
                      {/* Pas Foto Siswa 3x4 */}
                      <div className={`${
                        isMode8 ? 'w-[23mm] h-[30mm]' : isMode6 ? 'w-[30mm] h-[40mm]' : 'w-[34mm] h-[45mm]'
                      } border-2 border-slate-400 rounded bg-slate-50 flex-shrink-0 overflow-hidden flex flex-col items-center justify-center relative shadow-inner`}>
                        {siswa?.foto_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={siswa.foto_url}
                            alt={siswa.nama_lengkap}
                            className="w-full h-full object-cover block"
                          />
                        ) : (
                          <div className="fallback-foto text-center p-0.5 text-slate-400 flex flex-col items-center justify-center">
                            <ImageIcon className={`${isMode8 ? 'w-5 h-5' : isMode6 ? 'w-7 h-7' : 'w-9 h-9'} mx-auto stroke-1 text-slate-400`} />
                            <span className={`${isMode8 ? 'text-[8px]' : isMode6 ? 'text-[9.5px]' : 'text-[10px]'} font-medium block mt-0.5 text-slate-500`}>Foto 3x4</span>
                          </div>
                        )}
                        <span className={`absolute bottom-0.5 ${
                          isMode8 ? 'text-[7.5px] px-1 py-0' : isMode6 ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-0.5'
                        } bg-black/75 text-white rounded font-bold z-10`}>
                          {peserta.no_meja ? `Meja ${peserta.no_meja}` : 'Meja -'}
                        </span>
                      </div>

                      {/* Data Peserta */}
                      <div className={`flex-1 ${
                        isMode8 ? 'space-y-0.5 py-0' : isMode6 ? 'space-y-2 py-0.5' : 'space-y-3 py-1'
                      } leading-tight`}>
                        {showNoPeserta && (
                          <div className={`${isMode8 ? 'grid grid-cols-[70px_10px_1fr]' : 'grid grid-cols-[90px_14px_1fr]'} items-baseline pb-0.5 border-b border-dashed border-slate-300`}>
                            <span className={`text-slate-700 font-bold ${isMode8 ? 'text-[10px]' : isMode6 ? 'text-[12.5px]' : 'text-[14px]'}`}>No. Peserta</span>
                            <span className="text-center font-bold text-slate-700">:</span>
                            <span className={`font-black text-slate-950 font-mono tracking-wider ${isMode8 ? 'text-[11px]' : isMode6 ? 'text-[14px]' : 'text-[16px]'}`}>
                              {peserta.no_peserta}
                            </span>
                          </div>
                        )}

                        <div className={`${isMode8 ? 'grid grid-cols-[70px_10px_1fr]' : 'grid grid-cols-[90px_14px_1fr]'} items-baseline ${!showNoPeserta ? (isMode8 ? 'pb-0.5 border-b border-dashed border-slate-300' : 'pb-1.5 border-b border-dashed border-slate-300') : ''}`}>
                          <span className={`text-slate-700 font-bold ${isMode8 ? 'text-[10.5px]' : isMode6 ? 'text-[13px]' : 'text-[14px]'}`}>Nama Siswa</span>
                          <span className="text-center font-bold text-slate-700">:</span>
                          <span className={`font-black text-slate-950 uppercase tracking-wide truncate ${isMode8 ? 'text-[11px] sm:text-[11.5px]' : isMode6 ? 'text-[14.5px] sm:text-[15px]' : 'text-[16px] sm:text-[17px]'}`}>
                            {siswa?.nama_lengkap}
                          </span>
                        </div>

                        <div className={`${isMode8 ? 'grid grid-cols-[70px_10px_1fr]' : 'grid grid-cols-[90px_14px_1fr]'} items-baseline`}>
                          <span className={`text-slate-700 font-bold ${isMode8 ? 'text-[10.5px]' : isMode6 ? 'text-[13px]' : 'text-[14px]'}`}>NIS</span>
                          <span className="text-center font-bold text-slate-700">:</span>
                          <span className={`font-mono font-bold text-slate-950 tracking-wider ${isMode8 ? 'text-[10.5px]' : isMode6 ? 'text-[14px]' : 'text-[15.5px]'}`}>
                            {siswa?.nis || siswa?.nisn || '-'}
                          </span>
                        </div>

                        <div className={`${isMode8 ? 'grid grid-cols-[70px_10px_1fr]' : 'grid grid-cols-[90px_14px_1fr]'} items-baseline`}>
                          <span className={`text-slate-700 font-bold ${isMode8 ? 'text-[10.5px]' : isMode6 ? 'text-[13px]' : 'text-[14px]'}`}>Kelas</span>
                          <span className="text-center font-bold text-slate-700">:</span>
                          <span className={`font-black text-slate-950 ${isMode8 ? 'text-[10.5px]' : isMode6 ? 'text-[14px]' : 'text-[15.5px]'}`}>
                            {kelasNama}
                          </span>
                        </div>

                        <div className={`${isMode8 ? 'grid grid-cols-[70px_10px_1fr]' : 'grid grid-cols-[90px_14px_1fr]'} items-baseline`}>
                          <span className={`text-slate-700 font-bold ${isMode8 ? 'text-[10px]' : isMode6 ? 'text-[13px]' : 'text-[14px]'}`}>Ruang Ujian</span>
                          <span className="text-center font-bold text-slate-700">:</span>
                          <span className={`font-bold text-slate-900 ${isMode8 ? 'text-[10px]' : isMode6 ? 'text-[13px]' : 'text-[14.5px]'}`}>
                            {ruang?.kode_ruang} ({ruang?.nama_ruang})
                          </span>
                        </div>

                        <div className={`${isMode8 ? 'grid grid-cols-[70px_10px_1fr]' : 'grid grid-cols-[90px_14px_1fr]'} items-baseline`}>
                          <span className={`text-slate-700 font-bold ${isMode8 ? 'text-[10px]' : isMode6 ? 'text-[13px]' : 'text-[14px]'}`}>Sesi</span>
                          <span className="text-center font-bold text-slate-700">:</span>
                          <span className={`font-bold text-slate-900 ${isMode8 ? 'text-[10px]' : isMode6 ? 'text-[13px]' : 'text-[14.5px]'}`}>
                            Sesi {peserta.sesi}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu & Tanda Tangan */}
                    <div className={`border-t-2 border-slate-800 ${
                      isMode8 ? 'pt-1 mt-0.5 text-[8px]' : isMode6 ? 'pt-1.5 mt-1 text-[9px]' : 'pt-2 mt-1.5 text-[9.5px]'
                    } flex items-end justify-between`}>
                      <div className="text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <QrCode className={`${isMode8 ? 'w-5 h-5' : isMode6 ? 'w-7 h-7' : 'w-8 h-8'} text-slate-800`} />
                          <div>
                            <p className={`font-bold text-slate-800 ${isMode8 ? 'text-[7.5px]' : 'text-[9.5px]'}`}>VERIFIKASI PANITIA</p>
                            <p className={`italic ${isMode8 ? 'text-[6.5px]' : 'text-[8px]'} text-slate-500`}>Wajib dibawa saat ujian</p>
                          </div>
                        </div>
                      </div>

                      <div className={`text-center ${isMode8 ? 'min-w-[130px]' : isMode6 ? 'min-w-[155px]' : 'min-w-[170px]'}`}>
                        <p className={`${isMode8 ? 'text-[8px]' : isMode6 ? 'text-[9px]' : 'text-[9.5px]'} text-slate-700 leading-tight`}>
                          {schoolSettings.kotaTtd}, {schoolSettings.tanggalTtd}
                        </p>
                        <p className={`${isMode8 ? 'text-[8px]' : isMode6 ? 'text-[9px]' : 'text-[9.5px]'} font-semibold text-slate-800 leading-tight`}>
                          {schoolSettings.jabatanKepsek}
                        </p>
                        
                        {/* Tanda Tangan Asli */}
                        <div className={`relative ${isMode8 ? 'h-6 my-0' : isMode6 ? 'h-8 my-0.5' : 'h-10 my-0.5'} flex items-center justify-center`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={schoolSettings.ttdKepsekUrl || '/images/ttd-kepsek.png'}
                            alt="Tanda Tangan Kepala Sekolah"
                            className={`${isMode8 ? 'max-h-6' : isMode6 ? 'max-h-8' : 'max-h-11'} w-auto object-contain select-none`}
                          />
                        </div>

                        <p className={`font-black text-slate-950 ${isMode8 ? 'text-[8.5px]' : isMode6 ? 'text-[10px]' : 'text-[10.5px]'} leading-tight underline decoration-slate-900 underline-offset-2`}>
                          {schoolSettings.namaKepsek}
                        </p>
                        <p className={`${isMode8 ? 'text-[7.5px]' : isMode6 ? 'text-[8.5px]' : 'text-[9px]'} font-bold text-slate-800 leading-tight mt-0.5`}>
                          NIP. {schoolSettings.nipKepsek}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
