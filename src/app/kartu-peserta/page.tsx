'use client';

import { useState, useEffect } from 'react';
import { DEMO_PESERTA, DEMO_SISWA, DEMO_KELAS, DEMO_RUANG, generatePesertaFromSiswa } from '@/lib/demo-data';
import { PesertaUjian, Siswa } from '@/types/database';
import { Printer, Filter, Image as ImageIcon, QrCode } from 'lucide-react';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { fetchSiswaFromCloud, getStoredRuang, fetchSplitRulesFromCloud } from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function KartuPesertaPage() {
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedRuang, setSelectedRuang] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'6' | '4' | '2'>('6'); // 6 per halaman (A4 penuh), 4 per halaman, atau 2 per halaman
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
    return () => window.removeEventListener('ruang-data-updated', updateRuang);
  }, []);

  useEffect(() => {
    const syncData = () => {
      try {
        const storedRuang = getStoredRuang();
        const saved = localStorage.getItem('adm_siswa_data');
        if (saved) {
          const parsedSiswa: Siswa[] = JSON.parse(saved);
          if (Array.isArray(parsedSiswa) && parsedSiswa.length > 0) {
            // Bersihkan data dummy bawaan lama jika masih tersimpan di cache
            if (parsedSiswa.some(s => s.nama_lengkap === 'ADELFIO PRADITYA PUTRA' && s.id === 1)) {
              localStorage.removeItem('adm_siswa_data');
              setPesertaList([]);
              return;
            }
            setPesertaList(generatePesertaFromSiswa(parsedSiswa, storedRuang));
          }
        }
        
        // Tarik otomatis data mapping split rules & data siswa lengkap dari Supabase Cloud
        if (isSupabaseConfigured) {
          fetchSplitRulesFromCloud().then(rules => {
            fetchSiswaFromCloud().then(cloudSiswa => {
              if (cloudSiswa && cloudSiswa.length > 0) {
                setPesertaList(generatePesertaFromSiswa(cloudSiswa, storedRuang, rules || undefined));
              }
            });
          });
        }
        setPesertaList([]);
      } catch (e) {
        console.error('Gagal memuat foto & data siswa tersimpan:', e);
      }
    };

    syncData();
    window.addEventListener('storage', syncData);
    return () => window.removeEventListener('storage', syncData);
  }, []);

  const filteredPeserta = pesertaList
    .filter((p) => {
      const matchKelas = selectedKelas === 'all' || p.siswa?.kelas_id.toString() === selectedKelas;
      const matchRuang = selectedRuang === 'all' || p.ruang_id?.toString() === selectedRuang;
      return matchKelas && matchRuang;
    })
    .sort((a, b) => {
      // Urutkan Nama Siswa A-Z
      const namaA = a.siswa?.nama_lengkap || '';
      const namaB = b.siswa?.nama_lengkap || '';
      return namaA.localeCompare(namaB, 'id', { sensitivity: 'base' });
    });

  // Kelompokkan kartu per lembar A4 (6 kartu, 4 kartu, atau 2 kartu per halaman)
  const pageSize = layoutMode === '6' ? 6 : layoutMode === '4' ? 4 : 2;
  const pages: PesertaUjian[][] = [];
  for (let i = 0; i < filteredPeserta.length; i += pageSize) {
    pages.push(filteredPeserta.slice(i, i + pageSize));
  }

  const handlePrint = () => {
    window.print();
  };

  const isMode6 = layoutMode === '6';

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Cetak Kartu Peserta Ujian (Kertas A4)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Format Standar A4 &bull; Menampilkan {filteredPeserta.length} kartu ({pages.length} lembar A4 siap cetak &bull; {layoutMode} kartu per lembar).
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kelas</option>
              {DEMO_KELAS.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>

            <select
              value={selectedRuang}
              onChange={(e) => setSelectedRuang(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Ruang</option>
              {ruangList.map((r) => (
                <option key={r.id} value={r.id}>{r.kode_ruang} - {r.nama_ruang}</option>
              ))}
            </select>

            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as '6' | '4' | '2')}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="6">6 Kartu / Lembar A4 (Grid 2x3 - Penuh & Pas)</option>
              <option value="4">4 Kartu / Lembar A4 (Grid 2x2)</option>
              <option value="2">2 Kartu / Lembar A4 (Besar)</option>
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

      {/* Grid Kartu Peserta - Siap Cetak Kertas A4 */}
      {filteredPeserta.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
          <p className="font-bold text-slate-800 text-base">Belum Ada Data Kartu Peserta</p>
          <p className="text-xs text-slate-400 mt-1.5">
            Silakan masukkan atau impor data siswa pada menu <b>Data Siswa</b> untuk mencetak kartu peserta ujian.
          </p>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {pages.map((pagePeserta, pageIdx) => (
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
                    className={`card-item bg-white border-2 border-slate-800 rounded-lg ${isMode6 ? 'p-2' : 'p-3'} shadow-sm flex flex-col justify-between`}
                    style={{
                      height: isMode6 ? '88mm' : layoutMode === '4' ? '112mm' : '118mm',
                      maxHeight: isMode6 ? '89mm' : layoutMode === '4' ? '114mm' : '120mm',
                    }}
                  >
                    {/* Kop Kartu Peserta Resmi */}
                    <div className={`border-b-2 sm:border-b-4 border-double border-slate-900 ${isMode6 ? 'pb-1 mb-1' : 'pb-1.5 mb-2'}`}>
                      <div className="flex items-center justify-between gap-2 sm:gap-3 px-1">
                        {/* Logo Kiri: Pemda Kab. Tasikmalaya */}
                        <div className={`${isMode6 ? 'w-[44px] h-[52px]' : 'w-[64px] h-[74px]'} flex-shrink-0 flex items-center justify-center`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={schoolSettings.logoPemdaUrl || schoolSettings.logoTasikmalayaUrl || '/images/logo-tasikmalaya.png'}
                            alt="Logo Pemda"
                            className="w-full h-full object-contain filter drop-shadow-sm select-none"
                          />
                        </div>

                        {/* Teks Kop Tengah */}
                        <div className="flex-1 text-center leading-snug px-1">
                          <h3 className={`${isMode6 ? 'text-[11px]' : 'text-[13px] sm:text-[14px]'} font-black tracking-tight text-slate-950 uppercase`}>
                            KARTU PESERTA
                          </h3>
                          <h4 className={`${isMode6 ? 'text-[10px]' : 'text-[12px] sm:text-[13px]'} font-black text-slate-900 uppercase`}>
                            {schoolSettings.namaUjian}
                          </h4>
                          <p className={`${isMode6 ? 'text-[9.5px]' : 'text-[11px] sm:text-[12px]'} font-black text-slate-900 uppercase`}>
                            {schoolSettings.namaSekolah}
                          </p>
                          <p className={`${isMode6 ? 'text-[8.5px]' : 'text-[10px] sm:text-[11px]'} font-extrabold text-slate-800 uppercase tracking-wide`}>
                            TAHUN PELAJARAN {schoolSettings.tahunAjaran}
                          </p>
                        </div>

                        {/* Logo Kanan: SMPN 1 Rajapolah */}
                        <div className={`${isMode6 ? 'w-[44px] h-[52px]' : 'w-[64px] h-[74px]'} flex-shrink-0 flex items-center justify-center`}>
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
                    <div className="flex gap-3 items-start my-0.5">
                      {/* Pas Foto Siswa 3x4 */}
                      <div className={`${isMode6 ? 'w-[25mm] h-[33mm]' : 'w-[30mm] h-[40mm]'} border-2 border-slate-400 rounded bg-slate-50 flex-shrink-0 overflow-hidden flex flex-col items-center justify-center relative shadow-inner`}>
                        {siswa?.foto_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={siswa.foto_url}
                            alt={siswa.nama_lengkap}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              const fb = parent?.querySelector('.fallback-foto');
                              if (fb) (fb as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`fallback-foto text-center p-1 text-slate-400 flex flex-col items-center justify-center ${siswa?.foto_url ? 'hidden' : 'flex'}`}>
                          <ImageIcon className={`${isMode6 ? 'w-6 h-6' : 'w-8 h-8'} mx-auto stroke-1 text-slate-400`} />
                          <span className={`${isMode6 ? 'text-[8px]' : 'text-[9px]'} font-medium block mt-0.5 text-slate-500`}>Foto 3x4</span>
                        </div>
                        <span className={`absolute bottom-0.5 ${isMode6 ? 'text-[7.5px] px-1 py-0.2' : 'text-[8px] px-1.5 py-0.5'} bg-black/70 text-white rounded font-medium`}>
                          {peserta.no_meja ? `Meja ${peserta.no_meja}` : 'Meja -'}
                        </span>
                      </div>

                      {/* Data Peserta */}
                      <div className={`flex-1 ${isMode6 ? 'text-[9.5px] space-y-0.5' : 'text-[11px] space-y-1.5'} leading-tight`}>
                        <div className="grid grid-cols-12 gap-1 pb-0.5 border-b border-dashed border-slate-300">
                          <span className="col-span-4 text-slate-600 font-medium">No. Peserta</span>
                          <span className="col-span-1">:</span>
                          <span className={`col-span-7 font-black text-slate-950 font-mono tracking-wider ${isMode6 ? 'text-[11px]' : 'text-xs'}`}>
                            {peserta.no_peserta}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-4 text-slate-600 font-medium">Nama Siswa</span>
                          <span className="col-span-1">:</span>
                          <span className="col-span-7 font-bold text-slate-900 uppercase">
                            {siswa?.nama_lengkap}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-4 text-slate-600 font-medium">NISN / NIS</span>
                          <span className="col-span-1">:</span>
                          <span className="col-span-7 font-medium text-slate-800">
                            {siswa?.nisn} / {siswa?.nis || '-'}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-4 text-slate-600 font-medium">Kelas</span>
                          <span className="col-span-1">:</span>
                          <span className="col-span-7 font-semibold text-slate-800">
                            {kelasNama}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-4 text-slate-600 font-medium">Ruang Ujian</span>
                          <span className="col-span-1">:</span>
                          <span className="col-span-7 font-semibold text-slate-800">
                            {ruang?.kode_ruang} ({ruang?.nama_ruang})
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-4 text-slate-600 font-medium">Sesi</span>
                          <span className="col-span-1">:</span>
                          <span className="col-span-7 font-semibold text-slate-800">
                            Sesi {peserta.sesi}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu & Tanda Tangan */}
                    <div className={`border-t-2 border-slate-800 ${isMode6 ? 'pt-1 mt-1 text-[8px]' : 'pt-1.5 mt-1.5 text-[9px]'} flex items-end justify-between`}>
                      <div className="text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <QrCode className={`${isMode6 ? 'w-6 h-6' : 'w-8 h-8'} text-slate-800`} />
                          <div>
                            <p className="font-semibold text-slate-800">VERIFIKASI PANITIA</p>
                            <p className="italic text-[7.5px] text-slate-500">Wajib dibawa saat ujian</p>
                          </div>
                        </div>
                      </div>

                      <div className={`text-center ${isMode6 ? 'min-w-[150px]' : 'min-w-[170px]'}`}>
                        <p className={`${isMode6 ? 'text-[8px]' : 'text-[9px]'} text-slate-700 leading-tight`}>
                          {schoolSettings.kotaTtd}, {schoolSettings.tanggalTtd}
                        </p>
                        <p className={`${isMode6 ? 'text-[8px]' : 'text-[9px]'} font-medium text-slate-800 leading-tight`}>
                          {schoolSettings.jabatanKepsek}
                        </p>
                        
                        {/* Tanda Tangan Asli */}
                        <div className={`relative ${isMode6 ? 'h-7 my-0.5' : 'h-10 my-0.5'} flex items-center justify-center`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={schoolSettings.ttdKepsekUrl || '/images/ttd-kepsek.png'}
                            alt="Tanda Tangan Kepala Sekolah"
                            className={`${isMode6 ? 'max-h-7' : 'max-h-11'} w-auto object-contain select-none`}
                          />
                        </div>

                        <p className={`font-bold text-slate-950 ${isMode6 ? 'text-[8.5px]' : 'text-[10px]'} leading-tight underline decoration-slate-900 underline-offset-2`}>
                          {schoolSettings.namaKepsek}
                        </p>
                        <p className={`${isMode6 ? 'text-[7.5px]' : 'text-[8.5px]'} font-bold text-slate-800 leading-tight mt-0.5`}>
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
