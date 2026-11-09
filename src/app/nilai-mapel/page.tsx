'use client';

import { useState, useEffect } from 'react';
import { 
  DEMO_MAPEL, 
  DEMO_SISWA, 
  DEMO_KELAS, 
  DEMO_PESERTA, 
  DEMO_NILAI, 
  DEMO_JADWAL,
  DEMO_UJIAN 
} from '@/lib/demo-data';
import { NilaiUjian, Siswa } from '@/types/database';
import { Printer, Download, Award, TrendingUp, CheckCircle, AlertCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function NilaiMapelPage() {
  const [selectedMapelId, setSelectedMapelId] = useState<number>(2); // Default Matematika
  const [nilaiList, setNilaiList] = useState<NilaiUjian[]>(DEMO_NILAI);
  const [allSiswa, setAllSiswa] = useState<Siswa[]>(DEMO_SISWA);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('adm_siswa_data');
      if (saved) {
        const parsed: Siswa[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllSiswa(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const currentMapel = DEMO_MAPEL.find(m => m.id === selectedMapelId) || DEMO_MAPEL[0];
  const jadwal = DEMO_JADWAL.find(j => j.mapel_id === currentMapel.id);
  const ujian = DEMO_UJIAN[0];

  // Kumpulkan semua siswa yang mengambil mapel ini
  const rawList = DEMO_PESERTA.map((peserta) => {
    const siswa = allSiswa.find(s => s.id === peserta.siswa_id || (peserta.siswa?.nisn && s.nisn === peserta.siswa.nisn));
    const kelas = DEMO_KELAS.find(k => k.id === siswa?.kelas_id);
    const nilaiRecord = nilaiList.find(
      n => n.peserta_ujian_id === peserta.id && n.jadwal_ujian_id === jadwal?.id
    );

    const nilaiPG = nilaiRecord ? nilaiRecord.nilai_pg : 0;
    const nilaiEsai = nilaiRecord ? nilaiRecord.nilai_esai : 0;
    const nilaiAkhir = nilaiRecord ? nilaiRecord.nilai_akhir : 0;
    const tuntas = nilaiAkhir >= currentMapel.kkm;

    return {
      noPeserta: peserta.no_peserta,
      siswa,
      kelas,
      nilaiPG,
      nilaiEsai,
      nilaiAkhir,
      tuntas,
      keterangan: nilaiRecord ? nilaiRecord.keterangan : 'Belum Ada Nilai',
    };
  });

  // Urutkan berdasarkan nilai akhir tertinggi untuk ranking
  const sortedList = [...rawList].sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);

  // Statistik
  const nilaiValues = sortedList.map(item => item.nilaiAkhir).filter(v => v > 0);
  const maxNilai = nilaiValues.length > 0 ? Math.max(...nilaiValues) : 0;
  const minNilai = nilaiValues.length > 0 ? Math.min(...nilaiValues) : 0;
  const avgNilai = nilaiValues.length > 0 ? (nilaiValues.reduce((a, b) => a + b, 0) / nilaiValues.length).toFixed(1) : '0';
  const tuntasCount = sortedList.filter(item => item.tuntas).length;
  const persentaseTuntas = sortedList.length > 0 ? Math.round((tuntasCount / sortedList.length) * 100) : 0;

  const handleDownloadTemplate = () => {
    const templateData = DEMO_PESERTA.map((peserta) => {
      const siswa = allSiswa.find(s => s.id === peserta.siswa_id || (peserta.siswa?.nisn && s.nisn === peserta.siswa.nisn));
      const kelas = DEMO_KELAS.find(k => k.id === siswa?.kelas_id);
      return {
        'No. Peserta': peserta.no_peserta,
        'NISN': siswa?.nisn || '',
        'Nama Siswa': siswa?.nama_lengkap || '',
        'Kelas': kelas?.nama_kelas || '',
        'Nilai PG': '',
        'Nilai Esai': '',
        'Keterangan': 'Hadir',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 15 },
      { wch: 28 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Input Nilai');
    XLSX.writeFile(workbook, `Template_Nilai_${currentMapel.kode_mapel}_${currentMapel.nama_mapel.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleImportNilai = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const importedData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (!importedData.length) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        let updatedCount = 0;
        setNilaiList((prevList) => {
          const newList = [...prevList];
          importedData.forEach((row) => {
            const noPeserta = String(row['No. Peserta'] || row['no_peserta'] || row['Nomor Peserta'] || '').trim();
            const nisn = String(row['NISN'] || row['nisn'] || '').trim();
            const peserta = DEMO_PESERTA.find(p => {
              if (noPeserta && p.no_peserta === noPeserta) return true;
              const s = DEMO_SISWA.find(sw => sw.id === p.siswa_id);
              return Boolean(nisn && s?.nisn === nisn);
            });

            if (peserta && jadwal) {
              const pg = Number(row['Nilai PG'] || row['nilai_pg'] || 0) || 0;
              const esai = Number(row['Nilai Esai'] || row['nilai_esai'] || 0) || 0;
              const total = pg + esai;
              const ket = (row['Keterangan'] || 'Hadir') as 'Hadir' | 'Susulan' | 'Tidak Hadir';

              const existingIdx = newList.findIndex(
                n => n.peserta_ujian_id === peserta.id && n.jadwal_ujian_id === jadwal.id
              );

              if (existingIdx >= 0) {
                newList[existingIdx] = {
                  ...newList[existingIdx],
                  nilai_pg: pg,
                  nilai_esai: esai,
                  nilai_akhir: total,
                  keterangan: ket,
                };
              } else {
                newList.push({
                  id: Date.now() + Math.random(),
                  peserta_ujian_id: peserta.id,
                  jadwal_ujian_id: jadwal.id,
                  nilai_pg: pg,
                  nilai_esai: esai,
                  nilai_akhir: total,
                  keterangan: ket,
                });
              }
              updatedCount++;
            }
          });
          return newList;
        });

        showToast(`Berhasil mengimpor nilai untuk ${updatedCount} siswa!`);
        e.target.value = '';
      } catch {
        alert('Gagal membaca file Excel. Pastikan format file adalah .xlsx atau .xls.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    const data = sortedList.map((item, idx) => ({
      'Peringkat': idx + 1,
      'No. Peserta': item.noPeserta,
      'NISN': item.siswa?.nisn || '',
      'Nama Siswa': item.siswa?.nama_lengkap || '',
      'Kelas': item.kelas?.nama_kelas || '',
      'Nilai PG': item.nilaiPG,
      'Nilai Esai': item.nilaiEsai,
      'Nilai Akhir': item.nilaiAkhir,
      'Status KKM': item.tuntas ? 'TUNTAS' : 'REMEDIAL',
      'Keterangan': item.keterangan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nilai Mapel');
    XLSX.writeFile(workbook, `Nilai_${currentMapel.kode_mapel}_${currentMapel.nama_mapel.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Daftar Nilai Per Mata Pelajaran</h2>
          <p className="text-xs text-slate-500 mt-1">
            Laporan hasil capaian asesmen mata pelajaran lengkap dengan perankingan & KKM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <label className="text-xs font-semibold text-slate-700">Pilih Mapel:</label>
            <select
              value={selectedMapelId}
              onChange={(e) => setSelectedMapelId(Number(e.target.value))}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {DEMO_MAPEL.map((m) => (
                <option key={m.id} value={m.id}>{m.kode_mapel} - {m.nama_mapel} (KKM: {m.kkm})</option>
              ))}
            </select>
          </div>

          {/* Tombol Unduh Template Nilai Excel */}
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 text-xs font-bold rounded-lg shadow-sm transition"
            title="Unduh format template Excel untuk input nilai mapel ini"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Unduh Template (.xlsx)
          </button>

          {/* Tombol Impor Nilai dari Excel */}
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold shadow-sm transition">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Impor Nilai Excel
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportNilai}
              className="hidden"
            />
          </label>

          {/* Tombol Unduh Rekap Hasil Nilai */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 text-xs font-bold rounded-lg shadow-sm transition"
            title="Unduh rekapitulasi nilai dan ranking siswa mapel ini"
          >
            <Download className="w-4 h-4" />
            Unduh Rekap (.xlsx)
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Cetak Nilai Mapel
          </button>
        </div>
      </div>

      {/* Statistik Ringkas (No Print) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Rata-Rata Nilai
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{avgNilai}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" /> Nilai Tertinggi
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{maxNilai}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Nilai Terendah
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">{minNilai}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Ketuntasan KKM
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{persentaseTuntas}%</p>
        </div>
      </div>

      {/* Lembar Hasil Cetak Nilai Mapel */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        {/* Kop Surat / Header Laporan */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            DAFTAR NILAI CAPAIAN MATA PELAJARAN
          </h2>
          <h3 className="text-sm font-bold text-slate-700 uppercase mt-0.5">
            {ujian.nama_ujian} • TAHUN AJARAN 2026/2027
          </h3>
          <div className="mt-3 flex justify-center items-center gap-6 text-xs text-slate-800 font-medium">
            <span>Mata Pelajaran: <strong className="text-slate-900 font-bold">{currentMapel.nama_mapel} ({currentMapel.kode_mapel})</strong></span>
            <span>Standar KKM: <strong className="text-blue-700 font-bold">{currentMapel.kkm}</strong></span>
            <span>Waktu: <strong>{jadwal?.tanggal} ({jadwal?.jam_mulai} - {jadwal?.jam_selesai})</strong></span>
          </div>
        </div>

        {/* Tabel Nilai & Ranking */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider text-center">
                <th className="border border-slate-400 px-2 py-2.5 w-12">Rank</th>
                <th className="border border-slate-400 px-3 py-2.5 w-28">No. Peserta</th>
                <th className="border border-slate-400 px-3 py-2.5 w-24">NISN</th>
                <th className="border border-slate-400 px-3 py-2.5 text-left">Nama Lengkap Siswa</th>
                <th className="border border-slate-400 px-3 py-2.5 w-20">Kelas</th>
                <th className="border border-slate-400 px-2 py-2.5 w-16">Nilai PG</th>
                <th className="border border-slate-400 px-2 py-2.5 w-16">Nilai Esai</th>
                <th className="border border-slate-400 px-2 py-2.5 w-20">Nilai Akhir</th>
                <th className="border border-slate-400 px-2 py-2.5 w-24">Status KKM</th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center font-mono text-slate-700">{row.noPeserta}</td>
                  <td className="border border-slate-300 px-3 py-2 text-center font-mono text-slate-700">{row.siswa?.nisn}</td>
                  <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">{row.siswa?.nama_lengkap}</td>
                  <td className="border border-slate-300 px-3 py-2 text-center font-medium">{row.kelas?.nama_kelas}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-mono">{row.nilaiPG}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-mono">{row.nilaiEsai}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-bold font-mono text-sm bg-slate-50">
                    {row.nilaiAkhir}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-bold text-[10px]">
                    {row.tuntas ? (
                      <span className="text-emerald-700">TUNTAS</span>
                    ) : (
                      <span className="text-rose-600">REMEDIAL</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kolom Tanda Tangan */}
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
            <p>Guru Pengampu Mata Pelajaran</p>
            <div className="h-14"></div>
            <p className="font-bold border-b border-slate-900 inline-block">Budi Santoso, M.Pd.</p>
            <p className="text-[10px] text-slate-500">NIP. 19820719 200801 1 015</p>
          </div>
        </div>

      </div>
    </div>
  );
}

