'use client';

import { useState, useEffect } from 'react';
import { DEMO_SISWA, DEMO_KELAS } from '@/lib/demo-data';
import { Siswa } from '@/types/database';
import { Upload, Plus, Trash2, Image as ImageIcon, Search, CheckCircle2, Download, FileSpreadsheet, Link2 } from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * Normalisasi URL foto siswa.
 * Mendukung link Google Drive, web URL direct, dan data base64.
 */
function normalizePhotoUrl(rawUrl?: unknown): string | null {
  if (!rawUrl) return null;
  const url = String(rawUrl).trim();
  if (!url || url === '-' || url.toLowerCase() === 'null') return null;

  // Deteksi dan konversi Google Drive link ke embeddable thumbnail
  // Format: drive.google.com/file/d/<id>/view ATAU drive.google.com/open?id=<id>
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                     url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
  }

  return url;
}

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>(DEMO_SISWA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Load data tersimpan di browser (jika ada) saat pertama kali buka
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adm_siswa_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSiswaList(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load siswa from localStorage', e);
    }
  }, []);

  // Simpan data siswa ke localStorage agar selalu sinkron dengan Kartu Peserta
  const saveAndSetSiswaList = (newList: Siswa[] | ((prev: Siswa[]) => Siswa[])) => {
    setSiswaList(prev => {
      const next = typeof newList === 'function' ? newList(prev) : newList;
      try {
        localStorage.setItem('adm_siswa_data', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist siswa to localStorage', e);
      }
      return next;
    });
  };

  // Form State Tambah Siswa
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nisn, setNisn] = useState('');
  const [nis, setNis] = useState('');
  const [jk, setJk] = useState<'L' | 'P'>('L');
  const [kelasId, setKelasId] = useState<number>(1);
  const [linkFotoInput, setLinkFotoInput] = useState<string>('');
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  // Filter Siswa
  const filteredList = siswaList.filter((s) => {
    const matchSearch = s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.nisn.includes(searchTerm) ||
                        (s.nis && s.nis.includes(searchTerm));
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
        saveAndSetSiswaList(prev => prev.map(s => s.id === targetSiswaId ? { ...s, foto_url: result } : s));
        showToast('Foto siswa berhasil diperbarui!');
      } else {
        // Preview untuk siswa baru
        setPreviewFoto(result);
        setLinkFotoInput('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Input Link Foto Manual (Google Drive / Web)
  const handleLinkFotoInputChange = (val: string) => {
    setLinkFotoInput(val);
    const normalized = normalizePhotoUrl(val);
    if (normalized) {
      setPreviewFoto(normalized);
    } else if (!val) {
      setPreviewFoto(null);
    }
  };

  const handleEditPhotoUrl = (targetSiswa: Siswa) => {
    const current = targetSiswa.foto_url && !targetSiswa.foto_url.startsWith('data:') ? targetSiswa.foto_url : '';
    const input = prompt(
      `Masukkan Link Foto untuk ${targetSiswa.nama_lengkap} (bisa link Google Drive atau URL Web):`,
      current
    );

    if (input === null) return; // cancel

    const normalized = normalizePhotoUrl(input);
    saveAndSetSiswaList(prev => prev.map(s => s.id === targetSiswa.id ? { ...s, foto_url: normalized } : s));
    showToast(normalized ? 'Link foto berhasil disimpan!' : 'Foto siswa berhasil dihapus.');
  };

  const handleTambahSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap || !nisn) {
      alert('Nama Lengkap dan NISN wajib diisi');
      return;
    }

    const photoUrl = previewFoto || normalizePhotoUrl(linkFotoInput);

    const newSiswa: Siswa = {
      id: Date.now(),
      nisn,
      nis,
      nama_lengkap: namaLengkap,
      jenis_kelamin: jk,
      kelas_id: Number(kelasId),
      foto_url: photoUrl,
    };

    saveAndSetSiswaList([newSiswa, ...siswaList]);
    setNamaLengkap('');
    setNisn('');
    setNis('');
    setLinkFotoInput('');
    setPreviewFoto(null);
    showToast('Siswa baru berhasil ditambahkan!');
  };

  const handleDelete = (id: number) => {
    if (confirm('Yakin ingin menghapus data siswa ini?')) {
      saveAndSetSiswaList(prev => prev.filter(s => s.id !== id));
      showToast('Data siswa berhasil dihapus');
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Download Template sesuai kolom: KLS, NIS, NISN, NAMA, L/P, LINK
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'KLS': 'VII-A',
        'NIS': '242570001',
        'NISN': '0081234561',
        'NAMA': 'Fajar Nugraha',
        'L/P': 'L',
        'LINK': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop',
      },
      {
        'KLS': 'VII-A',
        'NIS': '242570002',
        'NISN': '0081234562',
        'NAMA': 'Gita Permata',
        'L/P': 'P',
        'LINK': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop',
      },
      {
        'KLS': 'VIII-A',
        'NIS': '242570003',
        'NISN': '0081234563',
        'NAMA': 'Hendra Setiawan',
        'L/P': 'L',
        'LINK': 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 12 }, // KLS
      { wch: 14 }, // NIS
      { wch: 16 }, // NISN
      { wch: 32 }, // NAMA
      { wch: 8 },  // L/P
      { wch: 55 }, // LINK (URL foto / Google Drive)
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
    XLSX.writeFile(workbook, 'Template_Import_Siswa.xlsx');
  };

  // Ekspor Excel dengan format KLS, NIS, NISN, NAMA, L/P, LINK
  const handleExportExcel = () => {
    const data = filteredList.map((s) => {
      const kelas = DEMO_KELAS.find(k => k.id === s.kelas_id);
      return {
        'KLS': kelas?.nama_kelas || '',
        'NIS': s.nis || '',
        'NISN': s.nisn,
        'NAMA': s.nama_lengkap,
        'L/P': s.jenis_kelamin === 'L' ? 'L' : 'P',
        'LINK': s.foto_url && !s.foto_url.startsWith('data:') ? s.foto_url : (s.foto_url ? '[File Base64]' : ''),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 32 },
      { wch: 8 },
      { wch: 45 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
    XLSX.writeFile(workbook, `Data_Siswa_${selectedKelas !== 'all' ? DEMO_KELAS.find(k => k.id.toString() === selectedKelas)?.nama_kelas.replace(/\s+/g, '_') || 'Kelas' : 'Semua'}.xlsx`);
  };

  // Import dari Excel: memproses KLS, NIS, NISN, NAMA, L/P, LINK
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

        let photoCount = 0;
        let updateCount = 0;
        let newCount = 0;

        const updatedList = [...siswaList];

        importedData.forEach((row, idx) => {
          // Dukungan berbagai alias kolom Excel
          const rawKelas = String(row['KLS'] || row['kls'] || row['Kelas'] || row['KELAS'] || '').trim();
          const rawNis = row['NIS'] || row['nis'] ? String(row['NIS'] || row['nis']).trim() : '';
          const rawNisn = row['NISN'] || row['nisn'] ? String(row['NISN'] || row['nisn']).trim() : '';
          const rawNama = String(row['NAMA'] || row['Nama'] || row['Nama Lengkap'] || row['nama_lengkap'] || `Siswa Baru ${idx + 1}`).trim();
          const rawJk = String(row['L/P'] || row['Jenis Kelamin'] || row['JK'] || row['jk'] || 'L').toUpperCase();
          const jkVal: 'L' | 'P' = rawJk.startsWith('P') ? 'P' : 'L';

          // Ambil Link Foto dari kolom LINK / Link / Foto
          const rawLink = row['LINK'] || row['Link'] || row['link'] || row['Foto'] || row['FOTO'] || row['Link Foto'] || row['foto_url'] || row['Foto URL'];
          const photoUrl = normalizePhotoUrl(rawLink);
          if (photoUrl) photoCount++;

          const matchedKelas = DEMO_KELAS.find(k => k.nama_kelas.toLowerCase() === rawKelas.toLowerCase());
          const kelasIdVal = matchedKelas ? matchedKelas.id : 1;

          // Cek apakah siswa dengan NISN atau NIS ini sudah ada di database
          const existingIdx = updatedList.findIndex(s => (rawNisn && s.nisn === rawNisn) || (rawNis && s.nis === rawNis));

          if (existingIdx !== -1) {
            // Update data dan foto siswa yang sudah ada
            updatedList[existingIdx] = {
              ...updatedList[existingIdx],
              nama_lengkap: rawNama || updatedList[existingIdx].nama_lengkap,
              nis: rawNis || updatedList[existingIdx].nis,
              jenis_kelamin: jkVal,
              kelas_id: matchedKelas ? kelasIdVal : updatedList[existingIdx].kelas_id,
              foto_url: photoUrl !== null ? photoUrl : updatedList[existingIdx].foto_url,
            };
            updateCount++;
          } else {
            // Tambah sebagai siswa baru
            updatedList.unshift({
              id: Date.now() + idx,
              nisn: rawNisn || String(Math.floor(1000000000 + Math.random() * 9000000000)),
              nis: rawNis,
              nama_lengkap: rawNama,
              jenis_kelamin: jkVal,
              kelas_id: kelasIdVal,
              foto_url: photoUrl,
            });
            newCount++;
          }
        });

        saveAndSetSiswaList(updatedList);
        showToast(
          `Sukses! ${importedData.length} baris diproses (${updateCount} diperbarui, ${newCount} baru, ${photoCount} foto terisi via link).`
        );
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
            Data siswa dan pas foto 3x4 (via file atau link Google Drive/URL) otomatis terintegrasi ke Kartu Peserta Ujian dan Lembar Presensi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Unduh Template Excel */}
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold shadow-sm transition"
            title="Unduh template Excel dengan kolom KLS, NIS, NISN, NAMA, L/P, LINK"
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

      {/* Info Box Format Import */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
        <span className="font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">Format Kolom Excel:</span>
        <div>
          Gunakan header: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-amber-950 border border-amber-300">KLS | NIS | NISN | NAMA | L/P | LINK</code>.
          Kolom <span className="font-semibold text-blue-700">LINK</span> dapat diisi tautan foto dari Google Drive, foto hosting, maupun link URL web langsung.
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

          {/* Upload Pas Foto & Input Link Foto */}
          <div className="md:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <div className="w-12 h-16 border border-dashed border-slate-400 rounded bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {previewFoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewFoto} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="space-y-2 flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  Pilih File Foto 3x4
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e)}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400">atau</span>
              </div>
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Tempel link foto (Google Drive atau URL web)..."
                  value={linkFotoInput}
                  onChange={(e) => handleLinkFotoInputChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">Dukungan format: JPG, PNG, atau link sharing Google Drive publik.</p>
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
              <option value="all">Semua Kelas ({filteredList.length} Siswa)</option>
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
                <th className="py-3 px-3 w-24">NIS</th>
                <th className="py-3 px-3">Nama Lengkap</th>
                <th className="py-3 px-3 w-12 text-center">L/P</th>
                <th className="py-3 px-3 w-24">Kelas</th>
                <th className="py-3 px-3 w-56 text-center">Atur Foto Siswa</th>
                <th className="py-3 px-3 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((siswa) => {
                const kelas = DEMO_KELAS.find(k => k.id === siswa.kelas_id);

                return (
                  <tr key={siswa.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-9 h-12 border border-slate-300 rounded bg-slate-100 overflow-hidden mx-auto flex items-center justify-center relative group">
                        {siswa.foto_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={siswa.foto_url} alt={siswa.nama_lengkap} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{siswa.nisn}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{siswa.nis || '-'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{siswa.nama_lengkap}</td>
                    <td className="py-2.5 px-3 text-center font-medium">{siswa.jenis_kelamin}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{kelas?.nama_kelas || '-'}</td>
                    
                    {/* Opsi Upload File ATAU Input Link Foto */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 rounded text-[11px] font-semibold transition" title="Upload file foto dari komputer">
                          <Upload className="w-3 h-3 text-blue-600" />
                          File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, siswa.id)}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => handleEditPhotoUrl(siswa)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300 rounded text-[11px] font-semibold transition"
                          title="Masukkan / ubah link foto (Google Drive / Web)"
                        >
                          <Link2 className="w-3 h-3 text-emerald-600" />
                          Link
                        </button>
                      </div>
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
