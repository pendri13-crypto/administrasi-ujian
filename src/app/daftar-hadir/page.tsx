'use client';

import { useState, useEffect } from 'react';
import { 
  DEMO_RUANG, 
  DEMO_PESERTA, 
  DEMO_SISWA,
  DEMO_KELAS, 
  DEMO_MAPEL, 
  DEMO_JADWAL, 
  DEMO_UJIAN,
  generatePesertaFromSiswa
} from '@/lib/demo-data';
import { PesertaUjian, Siswa } from '@/types/database';
import { Printer, DoorOpen } from 'lucide-react';

export default function DaftarHadirPage() {
  const [selectedRuangId, setSelectedRuangId] = useState<number>(1);
  const [selectedMapelId, setSelectedMapelId] = useState<number>(1);
  const [pesertaList, setPesertaList] = useState<PesertaUjian[]>(DEMO_PESERTA);

  useEffect(() => {
    const syncData = () => {
      try {
        const saved = localStorage.getItem('adm_siswa_data');
        if (saved) {
          const parsedSiswa: Siswa[] = JSON.parse(saved);
          if (Array.isArray(parsedSiswa) && parsedSiswa.length > 0) {
            setPesertaList(generatePesertaFromSiswa(parsedSiswa));
            return;
          }
        }
        setPesertaList(generatePesertaFromSiswa(DEMO_SISWA));
      } catch (e) {
        console.error(e);
      }
    };

    syncData();
    window.addEventListener('storage', syncData);
    return () => window.removeEventListener('storage', syncData);
  }, []);

  const currentRuang = DEMO_RUANG.find(r => r.id === selectedRuangId) || DEMO_RUANG[0];
  const currentMapel = DEMO_MAPEL.find(m => m.id === selectedMapelId) || DEMO_MAPEL[0];
  const jadwal = DEMO_JADWAL.find(j => j.mapel_id === currentMapel.id);
  const ujian = DEMO_UJIAN[0];

  // Peserta yang ditempatkan di ruang ini
  const pesertaRuang = pesertaList.filter(p => p.ruang_id === selectedRuangId)
    .sort((a, b) => (a.no_meja || 0) - (b.no_meja || 0));

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Daftar Hadir Per Ruang Ujian</h2>
          <p className="text-xs text-slate-500 mt-1">
            Format lembar presensi resmi per ruangan ujian lengkap dengan kolom tanda tangan silang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRuangId}
              onChange={(e) => setSelectedRuangId(Number(e.target.value))}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEMO_RUANG.map((r) => (
                <option key={r.id} value={r.id}>{r.kode_ruang} - {r.nama_ruang}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMapelId}
              onChange={(e) => setSelectedMapelId(Number(e.target.value))}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEMO_MAPEL.map((m) => (
                <option key={m.id} value={m.id}>{m.kode_mapel} - {m.nama_mapel}</option>
              ))}
            </select>
          </div>

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
            PANITIA PELAKSANA ASESMEN DAN UJIAN SEKOLAH
          </p>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
            DAFTAR HADIR PESERTA UJIAN
          </h2>
          <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">
            {ujian.nama_ujian} • TAHUN PELAJARAN 2026/2027
          </p>
        </div>

        {/* Informasi Detail Ruang & Jadwal */}
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
              <span className="col-span-7 font-bold">{currentMapel.nama_mapel} ({currentMapel.kode_mapel})</span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4 font-semibold text-slate-600">Sesi</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-medium">Sesi 1</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-12">
              <span className="col-span-4 font-semibold text-slate-600">Hari / Tanggal</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-medium">{jadwal?.tanggal || '2026-11-20'}</span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4 font-semibold text-slate-600">Pukul / Waktu</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-medium">{jadwal?.jam_mulai || '07:30'} - {jadwal?.jam_selesai || '09:30'} WIB</span>
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
              {pesertaRuang.map((peserta, idx) => {
                const siswa = peserta.siswa;
                const kelas = DEMO_KELAS.find(k => k.id === siswa?.kelas_id);
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
                      {kelas?.nama_kelas}
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

