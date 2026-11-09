'use client';

import { useState } from 'react';
import { DEMO_PESERTA, DEMO_KELAS, DEMO_RUANG } from '@/lib/demo-data';
import { Printer, Filter, Image as ImageIcon, QrCode } from 'lucide-react';

export default function KartuPesertaPage() {
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedRuang, setSelectedRuang] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'4' | '2'>('4'); // 4 per halaman atau 2 per halaman

  const filteredPeserta = DEMO_PESERTA.filter((p) => {
    const matchKelas = selectedKelas === 'all' || p.siswa?.kelas_id.toString() === selectedKelas;
    const matchRuang = selectedRuang === 'all' || p.ruang_id?.toString() === selectedRuang;
    return matchKelas && matchRuang;
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
              {/* Kop Kartu */}
              <div className="border-b-2 border-slate-800 pb-2 mb-3 text-center">
                <p className="text-[10px] tracking-wider font-semibold text-slate-700 uppercase">
                  PEMERINTAH PROVINSI / KEMENTERIAN AGAMA
                </p>
                <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  KARTU PESERTA UJIAN RESMI
                </h3>
                <p className="text-[11px] font-bold text-blue-700 mt-0.5">
                  {ujian?.nama_ujian || 'PENILAIAN AKHIR SEMESTER'}
                </p>
                <p className="text-[9px] text-slate-500">Tahun Ajaran 2026/2027 • Semester Ganjil</p>
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
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                      <span className="text-[9px] font-medium block mt-1">Foto 3x4</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 text-[8px] bg-black/60 text-white px-1 rounded">
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
                  <div className="flex items-center gap-1">
                    <QrCode className="w-8 h-8 text-slate-800" />
                    <div>
                      <p className="font-semibold text-slate-800">VERIFIKASI PANITIA</p>
                      <p className="italic text-[8px] text-slate-500">Wajib dibawa saat ujian</p>
                    </div>
                  </div>
                </div>

                <div className="text-center w-36">
                  <p>Kepala Sekolah,</p>
                  <div className="h-9"></div>
                  <p className="font-bold border-b border-slate-900 inline-block px-2">
                    Drs. H. Mulyadi, M.Pd.
                  </p>
                  <p className="text-[8px] text-slate-600">NIP. 19780512 200501 1 002</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

