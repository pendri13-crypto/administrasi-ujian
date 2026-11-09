'use client';

import { useState, useEffect } from 'react';
import { DEMO_PESERTA, DEMO_SISWA, DEMO_KELAS, DEMO_RUANG, generatePesertaFromSiswa } from '@/lib/demo-data';
import { PesertaUjian, Siswa } from '@/types/database';
import { Printer, Filter, Image as ImageIcon, QrCode } from 'lucide-react';

export default function KartuPesertaPage() {
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedRuang, setSelectedRuang] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'4' | '2'>('4'); // 4 per halaman atau 2 per halaman
  const [pesertaList, setPesertaList] = useState<PesertaUjian[]>(DEMO_PESERTA);

  // Sinkronisasi data dan foto siswa dari localStorage (yang diinput via Excel / web)
  useEffect(() => {
    const syncData = () => {
      try {
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
            setPesertaList(generatePesertaFromSiswa(parsedSiswa));
            return;
          }
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Cetak Kartu Peserta Ujian</h2>
          <p className="text-xs text-slate-500 mt-1">
            Menampilkan {filteredPeserta.length} kartu peserta siap dicetak ke kertas A4.
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
              {DEMO_RUANG.map((r) => (
                <option key={r.id} value={r.id}>{r.kode_ruang} - {r.nama_ruang}</option>
              ))}
            </select>

            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as '4' | '2')}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
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

      {/* Grid Kartu Peserta - Siap Cetak */}
      {filteredPeserta.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
          <p className="font-bold text-slate-800 text-base">Belum Ada Data Kartu Peserta</p>
          <p className="text-xs text-slate-400 mt-1.5">
            Silakan masukkan atau impor data siswa pada menu <b>Data Siswa</b> untuk mencetak kartu peserta ujian.
          </p>
        </div>
      ) : (
        <div 
          className={`grid gap-6 ${
            layoutMode === '4' 
              ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2' 
              : 'grid-cols-1 print:grid-cols-1'
          }`}
        >
          {filteredPeserta.map((peserta) => {
          const siswa = peserta.siswa;
          const kelas = DEMO_KELAS.find(k => k.id === siswa?.kelas_id);
          const ruang = peserta.ruang;
          const ujian = peserta.ujian;

          return (
            <div
              key={peserta.id}
              className="card-item bg-white border-2 border-slate-800 rounded-lg p-4 shadow-sm flex flex-col justify-between"
              style={{ minHeight: layoutMode === '4' ? '125mm' : '135mm' }}
            >
              {/* Kop Kartu Peserta Resmi */}
              <div className="border-b-4 border-double border-slate-900 pb-2 mb-3">
                <div className="flex items-center justify-between gap-2 sm:gap-4 px-1">
                  {/* Logo Kiri: Pemda Kab. Tasikmalaya */}
                  <div className="w-[72px] h-[82px] flex-shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/logo-tasikmalaya.png"
                      alt="Logo Pemda Kab. Tasikmalaya"
                      className="w-full h-full object-contain filter drop-shadow-sm select-none"
                    />
                  </div>

                  {/* Teks Kop Tengah */}
                  <div className="flex-1 text-center leading-snug px-1">
                    <h3 className="text-[14px] sm:text-[15px] font-black tracking-tight text-slate-950 uppercase">
                      KARTU PESERTA
                    </h3>
                    <h4 className="text-[13px] sm:text-[14px] font-black text-slate-900 uppercase">
                      SUMATIF AKHIR SEMESTER (SAS)
                    </h4>
                    <p className="text-[12px] sm:text-[13px] font-black text-slate-900 uppercase">
                      SMP NEGERI 1 RAJAPOLAH
                    </p>
                    <p className="text-[11px] sm:text-[12px] font-extrabold text-slate-800 uppercase tracking-wide">
                      TAHUN PELAJARAN 2025/2026
                    </p>
                  </div>

                  {/* Logo Kanan: SMPN 1 Rajapolah */}
                  <div className="w-[72px] h-[82px] flex-shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/logo-smpn1-rajapolah.png"
                      alt="Logo SMPN 1 Rajapolah"
                      className="w-full h-full object-contain filter drop-shadow-sm select-none"
                    />
                  </div>
                </div>
              </div>

              {/* Konten Utama: Foto & Biodata */}
              <div className="flex gap-4 items-start flex-1 my-1">
                {/* Pas Foto Siswa 3x4 */}
                <div className="w-[30mm] h-[40mm] border-2 border-slate-400 rounded bg-slate-50 flex-shrink-0 overflow-hidden flex flex-col items-center justify-center relative shadow-inner">
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
                  <div className={`fallback-foto text-center p-2 text-slate-400 flex flex-col items-center justify-center ${siswa?.foto_url ? 'hidden' : 'flex'}`}>
                    <ImageIcon className="w-8 h-8 mx-auto stroke-1 text-slate-400" />
                    <span className="text-[9px] font-medium block mt-1 text-slate-500">Foto 3x4</span>
                  </div>
                  <span className="absolute bottom-1 text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
                    {peserta.no_meja ? `Meja ${peserta.no_meja}` : 'Meja -'}
                  </span>
                </div>

                {/* Data Peserta */}
                <div className="flex-1 text-[11px] space-y-1.5 leading-tight">
                  <div className="grid grid-cols-12 gap-1 pb-1 border-b border-dashed border-slate-300">
                    <span className="col-span-4 text-slate-600 font-medium">No. Peserta</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7 font-black text-slate-950 font-mono tracking-wider text-xs">
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
                      {kelas?.nama_kelas || '-'}
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
              <div className="border-t-2 border-slate-800 pt-2 mt-2 flex items-end justify-between text-[9px]">
                <div className="text-slate-600 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-8 h-8 text-slate-800" />
                    <div>
                      <p className="font-semibold text-slate-800">VERIFIKASI PANITIA</p>
                      <p className="italic text-[8px] text-slate-500">Wajib dibawa saat ujian</p>
                    </div>
                  </div>
                </div>

                <div className="text-center min-w-[170px]">
                  <p className="text-[9px] text-slate-700 leading-tight">Rajapolah, 30 November 2026</p>
                  <p className="text-[9px] font-medium text-slate-800 leading-tight">Kepala SMPN 1 Rajapolah,</p>
                  
                  {/* Tanda Tangan Asli */}
                  <div className="relative h-10 my-0.5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/ttd-kepsek.png"
                      alt="Tanda Tangan Kepala Sekolah"
                      className="max-h-11 w-auto object-contain select-none"
                    />
                  </div>

                  <p className="font-bold text-slate-950 text-[10px] leading-tight underline decoration-slate-900 underline-offset-2">
                    H. UCU KARNI, M.Pd.
                  </p>
                  <p className="text-[8.5px] font-bold text-slate-800 leading-tight mt-0.5">
                    NIP. 19671116 199203 1 005
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

