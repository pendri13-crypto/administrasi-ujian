'use client';

import { useState } from 'react';
import { DEMO_SISWA, DEMO_KELAS } from '@/lib/demo-data';
import { Siswa } from '@/types/database';
import { Upload, Plus, Trash2, Image as ImageIcon, Search, CheckCircle2, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>(DEMO_SISWA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Form State Tambah Siswa
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nisn, setNisn] = useState('');
  const [nis, setNis] = useState('');
  const [jk, setJk] = useState<'L' | 'P'>('L');
  const [kelasId, setKelasId] = useState<number>(1);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  // Filter Siswa
  const filteredList = siswaList.filter((s) => {
    const matchSearch = s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.nisn.includes(searchTerm);
    const matchKelas = selectedKelas === 'all' || s.kelas_id.toString() === selectedKelas;
    return matchSearch && matchKelas;
  });

  // Handle Upload Foto Lokal / Base64 Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, targetSiswaId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;

      if (targetSiswaId) {
        // Ganti foto siswa yang sudah ada
        setSiswaList(prev => prev.map(s => s.id === targetSiswaId ? { ...s, foto_url: result } : s));
        showToast('Foto siswa berhasil diperbarui!');
      } else {
        // Preview untuk siswa baru
        setPreviewFoto(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTambahSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap || !nisn) {
      alert('Nama Lengkap dan NISN wajib diisi');
      return;
    }

    const newSiswa: Siswa = {
      id: Date.now(),
      nisn,
      nis,
      nama_lengkap: namaLengkap,
      jenis_kelamin: jk,
      kelas_id: Number(kelasId),
      foto_url: previewFoto,
    };

    setSiswaList([newSiswa, ...siswaList]);
    setNamaLengkap('');
    setNisn('');
    setNis('');
    setPreviewFoto(null);
    showToast('Siswa baru berhasil ditambahkan!');
  };

  const handleDelete = (id: number) => {
    if (confirm('Yakin ingin menghapus data siswa ini?')) {
      setSiswaList(prev => prev.filter(s => s.id !== id));
      showToast('Data siswa berhasil dihapus');
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NISN': '0081234561',
        'NIS': '26011',
        'Nama Lengkap': 'Fajar Nugraha',
        'Jenis Kelamin': 'L',
        'Kelas': 'X MIPA 1',
      },
      {
        'NISN': '0081234562',
        'NIS': '26012',
        'Nama Lengkap': 'Gita Permata',
        'Jenis Kelamin': 'P',
        'Kelas': 'X MIPA 1',
      },
      {
        'NISN': '0081234563',
        'NIS': '26013',
        'Nama Lengkap': 'Hendra Setiawan',
        'Jenis Kelamin': 'L',
        'Kelas': 'X IPS 1',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 16 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 16 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
    XLSX.writeFile(workbook, 'Template_Import_Siswa.xlsx');
  };

  const handleExportExcel = () => {
    const data = filteredList.map((s, idx) => {
      const kelas = DEMO_KELAS.find(k => k.id === s.kelas_id);
      return {
        'No': idx + 1,
        'NISN': s.nisn,
        'NIS': s.nis || '',
        'Nama Lengkap': s.nama_lengkap,
        'Jenis Kelamin': s.jenis_kelamin === 'L' ? 'L' : 'P',
        'Kelas': kelas?.nama_kelas || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
    XLSX.writeFile(workbook, `Data_Siswa_${selectedKelas !== 'all' ? DEMO_KELAS.find(k => k.id.toString() === selectedKelas)?.nama_kelas.replace(/\s+/g, '_') || 'Kelas' : 'Semua'}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const newStudents: Siswa[] = importedData.map((row, idx) => {
          const nama = String(row['Nama Lengkap'] || row['Nama'] || row['nama_lengkap'] || row['NAMA'] || `Siswa Baru ${idx + 1}`);
          const nisnVal = String(row['NISN'] || row['nisn'] || Math.floor(1000000000 + Math.random() * 9000000000));
          const nisVal = row['NIS'] || row['nis'] ? String(row['NIS'] || row['nis']) : '';
          const rawJk = String(row['Jenis Kelamin'] || row['L/P'] || row['jk'] || 'L').toUpperCase();
          const jkVal: 'L' | 'P' = rawJk.startsWith('P') ? 'P' : 'L';
          
          const rawKelas = String(row['Kelas'] || row['kelas'] || '').trim().toLowerCase();
          const matchedKelas = DEMO_KELAS.find(k => k.nama_kelas.toLowerCase() === rawKelas);
          const kelasIdVal = matchedKelas ? matchedKelas.id : 1;

          return {
            id: Date.now() + idx,
            nisn: nisnVal,
            nis: nisVal,
            nama_lengkap: nama,
            jenis_kelamin: jkVal,
            kelas_id: kelasIdVal,
            foto_url: null,
          };
        });

        setSiswaList(prev => [...newStudents, ...prev]);
        showToast(`Berhasil mengimpor ${newStudents.length} siswa dari Excel!`);
        e.target.value = '';
      } catch {
        alert('Gagal membaca file Excel. Pastikan format file adalah .xlsx atau .xls.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Kelola Siswa & Upload Foto</h2>
          <p className="text-xs text-slate-500 mt-1">
            Data siswa dan pas foto 3x4 akan langsung terintegrasi ke Kartu Peserta Ujian dan Lembar Presensi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Unduh Template Excel */}
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold shadow-sm transition"
            title="Unduh format file Excel kosong untuk pengisian data siswa"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Unduh Template (.xlsx)
          </button>

          {/* Tombol Impor Excel */}
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold shadow-sm transition">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Impor dari Excel
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>

          {/* Tombol Ekspor Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Ekspor Data (.xlsx)
          </button>
        </div>
      </div>

      {/* Form Tambah Siswa */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Tambah Siswa Baru
        </h3>

        <form onSubmit={handleTambahSiswa} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Muhammad Ilham Pratama"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700">NISN *</label>
            <input
              type="text"
              required
              placeholder="0081234567"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700">NIS (Opsional)</label>
            <input
              type="text"
              placeholder="26010"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Kelas</label>
            <select
              value={kelasId}
              onChange={(e) => setKelasId(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {DEMO_KELAS.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700">L/P</label>
            <select
              value={jk}
              onChange={(e) => setJk(e.target.value as 'L' | 'P')}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          {/* Upload Pas Foto */}
          <div className="md:col-span-8 flex items-center gap-4 pt-2">
            <div className="w-12 h-16 border border-dashed border-slate-400 rounded bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {previewFoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewFoto} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Pilih Foto 3x4 Siswa
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e)}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">Format JPG/PNG, ukuran ideal 3x4 rasio.</p>
            </div>
          </div>

          <div className="md:col-span-4 flex items-end justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              Simpan Siswa
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Daftar Tabel Siswa */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter Kelas:</span>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kelas</option>
              {DEMO_KELAS.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel Data Siswa */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-12 text-center">Foto</th>
                <th className="py-3 px-3 w-28">NISN</th>
                <th className="py-3 px-3">Nama Lengkap</th>
                <th className="py-3 px-3 w-12 text-center">L/P</th>
                <th className="py-3 px-3 w-24">Kelas</th>
                <th className="py-3 px-3 w-36 text-center">Upload Foto</th>
                <th className="py-3 px-3 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((siswa) => {
                const kelas = DEMO_KELAS.find(k => k.id === siswa.kelas_id);

                return (
                  <tr key={siswa.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-9 h-12 border border-slate-300 rounded bg-slate-100 overflow-hidden mx-auto flex items-center justify-center">
                        {siswa.foto_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={siswa.foto_url} alt={siswa.nama_lengkap} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{siswa.nisn}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{siswa.nama_lengkap}</td>
                    <td className="py-2.5 px-3 text-center font-medium">{siswa.jenis_kelamin}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{kelas?.nama_kelas || '-'}</td>
                    
                    {/* Tombol Upload / Ganti Foto Siswa */}
                    <td className="py-2.5 px-3 text-center">
                      <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 rounded text-[11px] font-semibold transition">
                        <Upload className="w-3 h-3" />
                        {siswa.foto_url ? 'Ganti Foto' : 'Upload Foto'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, siswa.id)}
                          className="hidden"
                        />
                      </label>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDelete(siswa.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

