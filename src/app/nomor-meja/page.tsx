'use client';

import { useState } from 'react';
import { DEMO_PESERTA, DEMO_RUANG, DEMO_KELAS } from '@/lib/demo-data';
import { Printer, Filter } from 'lucide-react';

export default function NomorMejaPage() {
  const [selectedRuangId, setSelectedRuangId] = useState<string>('all');

  const filteredPeserta = DEMO_PESERTA.filter((p) => {
    return selectedRuangId === 'all' || p.ruang_id?.toString() === selectedRuangId;
  }).sort((a, b) => (a.no_meja || 0) - (b.no_meja || 0));

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Cetak Nomor Meja / Label Bangku</h2>
          <p className="text-xs text-slate-500 mt-1">
            Label meja peserta ujian siap tempel (layout 8 label per lembar A4).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRuangId}
              onChange={(e) => setSelectedRuangId(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Ruang Ujian</option>
              {DEMO_RUANG.map((r) => (
                <option key={r.id} value={r.id}>{r.kode_ruang} - {r.nama_ruang}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Cetak Label Meja
          </button>
        </div>
      </div>

      {/* Grid Label Meja - 2 Kolom x 4 Baris = 8 label per halaman A4 */}
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
                <span className="font-bold text-slate-700 uppercase">PENILAIAN AKHIR SEMESTER (PAS)</span>
                <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-bold text-[9px]">
                  {ruang?.kode_ruang}
                </span>
              </div>

              {/* Badan Label */}
              <div className="flex items-center justify-between py-2 gap-4">
                <div className="space-y-1 text-xs">
                  <p className="text-[10px] text-slate-500 font-medium">Nomor Peserta:</p>
                  <p className="text-base font-black font-mono tracking-wider text-slate-950">
                    {peserta.no_peserta}
                  </p>
                  <p className="font-bold text-slate-900 uppercase text-xs pt-1">
                    {siswa?.nama_lengkap}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    NISN: {siswa?.nisn} • Kelas: {kelas?.nama_kelas}
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
    </div>
  );
}

