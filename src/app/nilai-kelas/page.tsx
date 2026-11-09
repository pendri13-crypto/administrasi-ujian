'use client';

import { useState } from 'react';
import { 
  DEMO_KELAS, 
  DEMO_SISWA, 
  DEMO_MAPEL, 
  DEMO_PESERTA, 
  DEMO_NILAI, 
  DEMO_JADWAL,
  DEMO_UJIAN 
} from '@/lib/demo-data';
import { Printer, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function NilaiKelasPage() {
  const [selectedKelasId, setSelectedKelasId] = useState<number>(1);
  const currentKelas = DEMO_KELAS.find(k => k.id === selectedKelasId);
  const ujian = DEMO_UJIAN[0];

  // Siswa di kelas yang dipilih
  const siswaList = DEMO_SISWA.filter(s => s.kelas_id === selectedKelasId);

  // Ambil nilai per siswa per mapel
  const rows = siswaList.map((siswa, idx) => {
    const peserta = DEMO_PESERTA.find(p => p.siswa_id === siswa.id);
    
    // Nilai untuk setiap mapel
    let totalNilai = 0;
    let countMapel = 0;
    let remedialCount = 0;

    const nilaiPerMapel = DEMO_MAPEL.map((mapel) => {
      const jadwal = DEMO_JADWAL.find(j => j.mapel_id === mapel.id);
      if (!peserta || !jadwal) return { mapelId: mapel.id, nilai: null, kkm: mapel.kkm, tuntas: false };

      const record = DEMO_NILAI.find(
        n => n.peserta_ujian_id === peserta.id && n.jadwal_ujian_id === jadwal.id
      );

      const nilai = record ? record.nilai_akhir : null;
      if (nilai !== null) {
        totalNilai += nilai;
        countMapel++;
        if (nilai < mapel.kkm) {
          remedialCount++;
        }
      }

      return {
        mapelId: mapel.id,
        nilai,
        kkm: mapel.kkm,
        tuntas: nilai !== null && nilai >= mapel.kkm,
      };
    });

    const rataRata = countMapel > 0 ? (totalNilai / countMapel).toFixed(1) : '0.0';

    return {
      no: idx + 1,
      siswa,
      peserta,
      nilaiPerMapel,
      totalNilai,
      rataRata,
      remedialCount,
      status: remedialCount === 0 ? 'Tuntas' : `Remedial (${remedialCount})`,
    };
  });

  const handleExportExcel = () => {
    const data = rows.map((row) => {
      const item: Record<string, string | number> = {
        'No': row.no,
        'NISN': row.siswa.nisn,
        'Nama Siswa': row.siswa.nama_lengkap,
        'L/P': row.siswa.jenis_kelamin,
      };
      row.nilaiPerMapel.forEach((m) => {
        const mapel = DEMO_MAPEL.find(map => map.id === m.mapelId);
        item[mapel ? `${mapel.kode_mapel} (${mapel.nama_mapel})` : `Mapel ${m.mapelId}`] = m.nilai !== null ? m.nilai : '-';
      });
      item['Total Nilai'] = row.totalNilai;
      item['Rata-Rata'] = Number(row.rataRata);
      item['Status'] = row.status;
      return item;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leger Nilai');
    XLSX.writeFile(workbook, `Leger_Nilai_${currentKelas?.nama_kelas?.replace(/\s+/g, '_') || 'Kelas'}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Daftar Nilai Per Kelas (Leger)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi matriks nilai siswa seluruh mata pelajaran per rombel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-slate-700">Pilih Kelas:</label>
          <select
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(Number(e.target.value))}
            className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {DEMO_KELAS.map((k) => (
              <option key={k.id} value={k.id}>{k.nama_kelas}</option>
            ))}
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Unduh Excel (.xlsx)
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Cetak Leger Kelas
          </button>
        </div>
      </div>

      {/* Dokumen Laporan Siap Cetak */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        {/* Kop Surat / Header Laporan */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            DAFTAR NILAI DAN LEGER UJIAN PER KELAS
          </h2>
          <h3 className="text-sm font-bold text-slate-700 uppercase mt-0.5">
            {ujian.nama_ujian} • TAHUN AJARAN 2026/2027
          </h3>
          <div className="mt-3 flex justify-center items-center gap-6 text-xs text-slate-800 font-medium">
            <span>Kelas: <strong className="text-slate-900 font-bold">{currentKelas?.nama_kelas}</strong></span>
            <span>Tingkat: <strong className="text-slate-900 font-bold">{currentKelas?.tingkat}</strong></span>
            <span>Wali Kelas: <strong className="text-slate-900 font-bold">Siti Rahmawati, S.Pd.</strong></span>
          </div>
        </div>

        {/* Tabel Matriks Nilai */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider text-center">
                <th className="border border-slate-400 px-2 py-2.5 w-10" rowSpan={2}>No</th>
                <th className="border border-slate-400 px-3 py-2.5 w-28" rowSpan={2}>NISN</th>
                <th className="border border-slate-400 px-3 py-2.5 text-left" rowSpan={2}>Nama Lengkap Siswa</th>
                <th className="border border-slate-400 px-2 py-2.5 w-10" rowSpan={2}>L/P</th>
                <th className="border border-slate-400 py-1" colSpan={DEMO_MAPEL.length}>Mata Pelajaran (Nilai Akhir)</th>
                <th className="border border-slate-400 px-2 py-2.5 w-16" rowSpan={2}>Total</th>
                <th className="border border-slate-400 px-2 py-2.5 w-16" rowSpan={2}>Rata-Rata</th>
                <th className="border border-slate-400 px-2 py-2.5 w-24" rowSpan={2}>Keterangan</th>
              </tr>
              <tr className="bg-slate-50 text-slate-700 text-[9px] text-center font-bold">
                {DEMO_MAPEL.map((mapel) => (
                  <th key={mapel.id} className="border border-slate-400 px-2 py-1">
                    <div>{mapel.kode_mapel}</div>
                    <div className="text-[8px] font-normal text-slate-500">(KKM {mapel.kkm})</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.siswa.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-2 py-2 text-center font-medium">{row.no}</td>
                  <td className="border border-slate-300 px-3 py-2 text-center font-mono text-slate-700">{row.siswa.nisn}</td>
                  <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">{row.siswa.nama_lengkap}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{row.siswa.jenis_kelamin}</td>
                  
                  {row.nilaiPerMapel.map((m) => (
                    <td 
                      key={m.mapelId} 
                      className={`border border-slate-300 px-2 py-2 text-center font-bold font-mono ${
                        m.nilai !== null && m.nilai < m.kkm 
                          ? 'text-rose-600 bg-rose-50/50' 
                          : 'text-slate-800'
                      }`}
                    >
                      {m.nilai !== null ? m.nilai : '-'}
                    </td>
                  ))}

                  <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-900 bg-slate-50">
                    {row.totalNilai}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-bold text-blue-700 bg-blue-50/40">
                    {row.rataRata}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center">
                    {row.remedialCount === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle className="w-3 h-3" /> Tuntas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                        <AlertTriangle className="w-3 h-3" /> Rem ({row.remedialCount})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kolom Tanda Tangan Laporan */}
        <div className="mt-8 pt-4 flex justify-between items-start text-xs text-slate-800">
          <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <div className="h-14"></div>
            <p className="font-bold border-b border-slate-900 inline-block">Drs. H. Mulyadi, M.Pd.</p>
            <p className="text-[10px] text-slate-500">NIP. 19780512 200501 1 002</p>
          </div>

          <div className="text-right">
            <p>Kota Pendidikan, 25 November 2026</p>
            <p>Wali Kelas {currentKelas?.nama_kelas}</p>
            <div className="h-14"></div>
            <p className="font-bold border-b border-slate-900 inline-block">Siti Rahmawati, S.Pd.</p>
            <p className="text-[10px] text-slate-500">NIP. 19850315 201001 2 018</p>
          </div>
        </div>

      </div>
    </div>
  );
}

