'use client';

import { useState, useEffect } from 'react';
import { DEMO_PESERTA, DEMO_SISWA, DEMO_KELAS, DEMO_RUANG, generatePesertaFromSiswa } from '@/lib/demo-data';
import { PesertaUjian, Siswa } from '@/types/database';
import { Printer, Filter, Image as ImageIcon, QrCode } from 'lucide-react';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { fetchSiswaFromCloud, fetchRuangFromCloud, getStoredRuang, fetchSplitRulesFromCloud } from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function KartuPesertaPage() {
  const [selectedKelas, setSelectedKelas] = useState<string>('1'); // Default ke Kelas VII-A agar browser langsung enteng & tidak crash
  const [selectedRuang, setSelectedRuang] = useState<string>('all');
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const BATCH_SIZE_PAGES = 10; // Maksimal 10 lembar F4 (60 kartu) per tampilan batch agar memori browser sangat aman
  const [layoutMode, setLayoutMode] = useState<'6' | '4' | '2'>('6'); // 6 per halaman (F4 penuh), 4 per halaman, atau 2 per halaman
  const [ruangList, setRuangList] = useState(getStoredRuang());
  const [pesertaList, setPesertaList] = useState<PesertaUjian[]>(DEMO_PESERTA);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);

  // Sinkronisasi data sekolah dan foto siswa dari localStorage
  useEffect(() => {
    const updateSettings = () => {
      setSchoolSettings(getStoredSchoolSettings());
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

  // Kelompokkan kartu per lembar F4 (6 kartu, 4 kartu, atau 2 kartu per halaman)
  const pageSize = layoutMode === '6' ? 6 : layoutMode === '4' ? 4 : 2;
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
                onChange={(e) => setLayoutMode(e.target.value as '6' | '4' | '2')}
                className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="6">6 Kartu / Lembar F4 (Grid 2x3 - Pas & Rapi)</option>
                <option value="4">4 Kartu / Lembar F4 (Grid 2x2)</option>
                <option value="2">2 Kartu / Lembar F4 (Besar)</option>
              </select>
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
              className={`print-page ${isMode6 ? 'grid-6' : ''} grid gap-3 print:gap-2.5 ${
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
                    className={`card-item bg-white border-2 border-slate-800 rounded-lg ${isMode6 ? 'p-2.5' : 'p-3'} shadow-sm flex flex-col justify-between`}
                    style={{
                      height: isMode6 ? '100mm' : layoutMode === '4' ? '150mm' : '150mm',
                      maxHeight: isMode6 ? '101mm' : layoutMode === '4' ? '152mm' : '152mm',
                    }}
                  >
                    {/* Kop Kartu Peserta Resmi */}
                    <div className={`border-b-2 sm:border-b-4 border-double border-slate-900 ${isMode6 ? 'pb-1 mb-1.5' : 'pb-1.5 mb-2'}`}>
                      <div className="flex items-center justify-between gap-2 sm:gap-3 px-1">
                        {/* Logo Kiri: Pemda Kab. Tasikmalaya */}
                        <div className={`${isMode6 ? 'w-[48px] h-[58px]' : 'w-[64px] h-[74px]'} flex-shrink-0 flex items-center justify-center`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={schoolSettings.logoPemdaUrl || schoolSettings.logoTasikmalayaUrl || '/images/logo-tasikmalaya.png'}
                            alt="Logo Pemda"
                            className="w-full h-full object-contain filter drop-shadow-sm select-none"
                          />
                        </div>

                        {/* Teks Kop Tengah */}
                        <div className="flex-1 text-center leading-snug px-1">
                          <h3 className={`${isMode6 ? 'text-[12.5px]' : 'text-[13px] sm:text-[14px]'} font-black tracking-wide text-slate-950 uppercase`}>
                            KARTU PESERTA
                          </h3>
                          <h4 className={`${isMode6 ? 'text-[11.5px]' : 'text-[12px] sm:text-[13px]'} font-black text-slate-900 uppercase`}>
                            {schoolSettings.namaUjian}
                          </h4>
                          <p className={`${isMode6 ? 'text-[11px]' : 'text-[11px] sm:text-[12px]'} font-black text-slate-900 uppercase`}>
                            {schoolSettings.namaSekolah}
                          </p>
                          <p className={`${isMode6 ? 'text-[9.5px]' : 'text-[10px] sm:text-[11px]'} font-extrabold text-slate-800 uppercase tracking-wide`}>
                            TAHUN PELAJARAN {schoolSettings.tahunAjaran}
                          </p>
                        </div>

                        {/* Logo Kanan: SMPN 1 Rajapolah */}
                        <div className={`${isMode6 ? 'w-[48px] h-[58px]' : 'w-[64px] h-[74px]'} flex-shrink-0 flex items-center justify-center`}>
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
                    <div className="flex gap-3 items-start my-auto">
                      {/* Pas Foto Siswa 3x4 */}
                      <div className={`${isMode6 ? 'w-[28mm] h-[37mm]' : 'w-[32mm] h-[43mm]'} border-2 border-slate-400 rounded bg-slate-50 flex-shrink-0 overflow-hidden flex flex-col items-center justify-center relative shadow-inner`}>
                        {siswa?.foto_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={siswa.foto_url}
                            alt={siswa.nama_lengkap}
                            className="w-full h-full object-cover block"
                          />
                        ) : (
                          <div className="fallback-foto text-center p-1 text-slate-400 flex flex-col items-center justify-center">
                            <ImageIcon className={`${isMode6 ? 'w-6 h-6' : 'w-8 h-8'} mx-auto stroke-1 text-slate-400`} />
                            <span className={`${isMode6 ? 'text-[9px]' : 'text-[9.5px]'} font-medium block mt-0.5 text-slate-500`}>Foto 3x4</span>
                          </div>
                        )}
                        <span className={`absolute bottom-0.5 ${isMode6 ? 'text-[8.5px] px-2 py-0.5' : 'text-[9px] px-2.5 py-0.5'} bg-black/75 text-white rounded font-bold z-10`}>
                          {peserta.no_meja ? `Meja ${peserta.no_meja}` : 'Meja -'}
                        </span>
                      </div>

                      {/* Data Peserta */}
                      <div className={`flex-1 ${isMode6 ? 'text-[11.5px] space-y-1' : 'text-xs space-y-1.5'} leading-snug`}>
                        <div className="grid grid-cols-12 gap-1 pb-1 border-b border-dashed border-slate-300 items-baseline">
                          <span className="col-span-4 text-slate-700 font-bold">No. Peserta</span>
                          <span className="col-span-1 text-center font-bold text-slate-700">:</span>
                          <span className={`col-span-7 font-black text-slate-950 font-mono tracking-wider ${isMode6 ? 'text-[13px]' : 'text-sm'}`}>
                            {peserta.no_peserta}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1 items-baseline">
                          <span className="col-span-4 text-slate-700 font-bold">Nama Siswa</span>
                          <span className="col-span-1 text-center font-bold text-slate-700">:</span>
                          <span className={`col-span-7 font-black text-slate-950 uppercase ${isMode6 ? 'text-[12px]' : 'text-[13px]'}`}>
                            {siswa?.nama_lengkap}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1 items-baseline">
                          <span className="col-span-4 text-slate-700 font-bold">NISN / NIS</span>
                          <span className="col-span-1 text-center font-bold text-slate-700">:</span>
                          <span className={`col-span-7 font-bold text-slate-900 ${isMode6 ? 'text-[11.5px]' : 'text-xs'}`}>
                            {siswa?.nisn} / {siswa?.nis || '-'}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1 items-baseline">
                          <span className="col-span-4 text-slate-700 font-bold">Kelas</span>
                          <span className="col-span-1 text-center font-bold text-slate-700">:</span>
                          <span className={`col-span-7 font-black text-slate-950 ${isMode6 ? 'text-[12px]' : 'text-[13px]'}`}>
                            {kelasNama}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1 items-baseline">
                          <span className="col-span-4 text-slate-700 font-bold">Ruang Ujian</span>
                          <span className="col-span-1 text-center font-bold text-slate-700">:</span>
                          <span className={`col-span-7 font-bold text-slate-900 ${isMode6 ? 'text-[11.5px]' : 'text-xs'}`}>
                            {ruang?.kode_ruang} ({ruang?.nama_ruang})
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1 items-baseline">
                          <span className="col-span-4 text-slate-700 font-bold">Sesi</span>
                          <span className="col-span-1 text-center font-bold text-slate-700">:</span>
                          <span className={`col-span-7 font-bold text-slate-900 ${isMode6 ? 'text-[11.5px]' : 'text-xs'}`}>
                            Sesi {peserta.sesi}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu & Tanda Tangan */}
                    <div className={`border-t-2 border-slate-800 ${isMode6 ? 'pt-1.5 mt-1 text-[9px]' : 'pt-2 mt-1.5 text-[9.5px]'} flex items-end justify-between`}>
                      <div className="text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <QrCode className={`${isMode6 ? 'w-7 h-7' : 'w-8 h-8'} text-slate-800`} />
                          <div>
                            <p className="font-bold text-slate-800 text-[9.5px]">VERIFIKASI PANITIA</p>
                            <p className="italic text-[8px] text-slate-500">Wajib dibawa saat ujian</p>
                          </div>
                        </div>
                      </div>

                      <div className={`text-center ${isMode6 ? 'min-w-[155px]' : 'min-w-[170px]'}`}>
                        <p className={`${isMode6 ? 'text-[9px]' : 'text-[9.5px]'} text-slate-700 leading-tight`}>
                          {schoolSettings.kotaTtd}, {schoolSettings.tanggalTtd}
                        </p>
                        <p className={`${isMode6 ? 'text-[9px]' : 'text-[9.5px]'} font-semibold text-slate-800 leading-tight`}>
                          {schoolSettings.jabatanKepsek}
                        </p>
                        
                        {/* Tanda Tangan Asli */}
                        <div className={`relative ${isMode6 ? 'h-8 my-0.5' : 'h-10 my-0.5'} flex items-center justify-center`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={schoolSettings.ttdKepsekUrl || '/images/ttd-kepsek.png'}
                            alt="Tanda Tangan Kepala Sekolah"
                            className={`${isMode6 ? 'max-h-8' : 'max-h-11'} w-auto object-contain select-none`}
                          />
                        </div>

                        <p className={`font-black text-slate-950 ${isMode6 ? 'text-[10px]' : 'text-[10.5px]'} leading-tight underline decoration-slate-900 underline-offset-2`}>
                          {schoolSettings.namaKepsek}
                        </p>
                        <p className={`${isMode6 ? 'text-[8.5px]' : 'text-[9px]'} font-bold text-slate-800 leading-tight mt-0.5`}>
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
