'use client';

import { useState, useEffect } from 'react';
import { DEMO_SISWA, DEMO_KELAS } from '@/lib/demo-data';
import { Siswa } from '@/types/database';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Search, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  Link2,
  CheckSquare,
  Square,
  RotateCcw,
  AlertTriangle,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  FileJson
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  fetchSiswaFromCloud, 
  pushSiswaToCloud, 
  deleteSiswaFromCloud, 
  exportBackupJSON, 
  restoreBackupJSON 
} from '@/lib/data-service';
import { isSupabaseConfigured, supabaseUrl } from '@/lib/supabase';

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
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
  }

  return url;
}

/**
 * Kompresi foto upload lokal (JPEG max 300x400) agar muat di localStorage dan cepat ditampilkan
 */
async function compressImage(file: File, maxWidth = 300, maxHeight = 400, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>(DEMO_SISWA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Load data tersimpan di browser (jika ada) dan sinkronkan dengan Supabase Cloud
  useEffect(() => {
    let hasLocal = false;
    try {
      const saved = localStorage.getItem('adm_siswa_data');
      if (saved) {
        const parsed: Siswa[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Bersihkan data dummy bawaan lama jika masih tersimpan di cache
          if (parsed.some(s => s.nama_lengkap === 'ADELFIO PRADITYA PUTRA' && s.id === 1)) {
            localStorage.removeItem('adm_siswa_data');
            setSiswaList([]);
          } else {
            setSiswaList(parsed);
            hasLocal = true;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load siswa from localStorage', e);
    }

    // Tarik data otomatis dari Supabase Cloud (sangat penting agar langsung muncul di PC lain!)
    if (isSupabaseConfigured) {
      setIsCloudSyncing(true);
      fetchSiswaFromCloud()
        .then((cloudData) => {
          setIsCloudSyncing(false);
          if (cloudData && cloudData.length > 0) {
            // Jika lokal kosong atau cloud memiliki data
            if (!hasLocal) {
              setSiswaList(cloudData);
            }
          }
        })
        .catch(() => setIsCloudSyncing(false));
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

  // State Ceklis / Pilihan Multi-Siswa untuk Hapus Sekaligus
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isAllSelected = filteredList.length > 0 && filteredList.every(s => selectedIds.includes(s.id));
  const isSomeSelected = filteredList.some(s => selectedIds.includes(s.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Hilangkan ceklis semua siswa yang tampil saat ini
      const currentFilteredIds = new Set(filteredList.map(s => s.id));
      setSelectedIds(prev => prev.filter(id => !currentFilteredIds.has(id)));
    } else {
      // Ceklis semua siswa yang tampil saat ini
      const currentFilteredIds = filteredList.map(s => s.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const handleToggleRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Hapus Data Siswa Terpilih Sekaligus
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Yakin ingin menghapus ${selectedIds.length} data siswa yang dipilih secara sekaligus?`)) {
      const toDelete = siswaList.filter(s => selectedIds.includes(s.id));
      const nisnList = toDelete.map(s => s.nisn).filter(Boolean);
      const remaining = siswaList.filter(s => !selectedIds.includes(s.id));
      saveAndSetSiswaList(remaining);
      setSelectedIds([]);
      if (isSupabaseConfigured && nisnList.length > 0) {
        deleteSiswaFromCloud(nisnList);
      }
      showToast(`Berhasil menghapus ${selectedIds.length} data siswa.`);
    }
  };

  // Kosongkan Seluruh Data Siswa
  const handleClearAll = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN SELURUH data siswa? Seluruh data dan pas foto akan terhapus.')) {
      const allNisns = siswaList.map(s => s.nisn).filter(Boolean);
      saveAndSetSiswaList([]);
      setSelectedIds([]);
      if (isSupabaseConfigured && allNisns.length > 0) {
        deleteSiswaFromCloud(allNisns);
      }
      showToast('Seluruh data siswa berhasil dikosongkan.');
    }
  };

  // Reset / Bersihkan Seluruh Data Siswa
  const handleResetDefault = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh data siswa?')) {
      const allNisns = siswaList.map(s => s.nisn).filter(Boolean);
      saveAndSetSiswaList([]);
      localStorage.removeItem('adm_siswa_data');
      setSelectedIds([]);
      if (isSupabaseConfigured && allNisns.length > 0) {
        deleteSiswaFromCloud(allNisns);
      }
      showToast('Data siswa berhasil dikosongkan.');
    }
  };

  const handlePushToCloud = async () => {
    if (siswaList.length === 0) {
      alert('Tidak ada data siswa untuk dikirim ke cloud.');
      return;
    }
    setIsCloudSyncing(true);
    const result = await pushSiswaToCloud(siswaList);
    setIsCloudSyncing(false);
    if (result.success) {
      showToast(`Sukses! ${result.count} data siswa tersimpan di Cloud Supabase.`);
    } else {
      alert('Gagal mengirim ke cloud: ' + result.error);
    }
  };

  const handlePullFromCloud = async () => {
    setIsCloudSyncing(true);
    const cloudData = await fetchSiswaFromCloud();
    setIsCloudSyncing(false);
    if (cloudData) {
      setSiswaList(cloudData);
      showToast(`Sukses! ${cloudData.length} data siswa ditarik dari Cloud Supabase.`);
    } else {
      alert('Gagal mengambil data dari cloud atau koneksi terputus.');
    }
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCloudSyncing(true);
    const res = await restoreBackupJSON(file);
    setIsCloudSyncing(false);
    if (res.success) {
      showToast(res.message);
      const saved = localStorage.getItem('adm_siswa_data');
      if (saved) setSiswaList(JSON.parse(saved));
    } else {
      alert(res.message);
    }
    e.target.value = '';
  };

  // Handle Upload Foto Lokal / Base64 Preview (dengan auto kompresi agar ringan)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, targetSiswaId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImage(file);
      if (!compressedDataUrl) return;

      if (targetSiswaId) {
        // Ganti foto siswa yang sudah ada
        saveAndSetSiswaList(prev => prev.map(s => s.id === targetSiswaId ? { ...s, foto_url: compressedDataUrl } : s));
        showToast('Foto siswa berhasil diperbarui!');
      } else {
        // Preview untuk siswa baru
        setPreviewFoto(compressedDataUrl);
        setLinkFotoInput('');
      }
    } catch (err) {
      console.error('Gagal memproses upload foto:', err);
      alert('Gagal memproses file foto. Pastikan format file gambar valid.');
    }
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
    if (isSupabaseConfigured) {
      pushSiswaToCloud([newSiswa]);
    }
    setNamaLengkap('');
    setNisn('');
    setNis('');
    setLinkFotoInput('');
    setPreviewFoto(null);
    showToast('Siswa baru berhasil ditambahkan!');
  };

  const handleDelete = (id: number) => {
    if (confirm('Yakin ingin menghapus data siswa ini?')) {
      const target = siswaList.find(s => s.id === id);
      saveAndSetSiswaList(prev => prev.filter(s => s.id !== id));
      if (isSupabaseConfigured && target?.nisn) {
        deleteSiswaFromCloud([target.nisn]);
      }
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
        'LINK': 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing',
      },
      {
        'KLS': 'VII-A',
        'NIS': '242570002',
        'NISN': '0081234562',
        'NAMA': 'Gita Permata',
        'L/P': 'P',
        'LINK': '',
      },
      {
        'KLS': 'VIII-A',
        'NIS': '242570003',
        'NISN': '0081234563',
        'NAMA': 'Hendra Setiawan',
        'L/P': 'L',
        'LINK': '',
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

          // Cek apakah siswa dengan NISN, NIS, atau Nama ini sudah ada di database
          const existingIdx = updatedList.findIndex(s => 
            (rawNisn && String(s.nisn).trim() === rawNisn) || 
            (rawNis && String(s.nis || '').trim() === rawNis) ||
            (rawNama && s.nama_lengkap.trim().toLowerCase() === rawNama.toLowerCase())
          );

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
        if (isSupabaseConfigured) {
          setIsCloudSyncing(true);
          pushSiswaToCloud(updatedList).then((res) => {
            setIsCloudSyncing(false);
            if (res.success) {
              showToast(`Data berhasil disimpan dan disinkronkan ke Cloud Supabase (${res.count} siswa)!`);
            }
          });
        }
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

          {/* Tombol Hapus Ceklis Sekaligus (Selalu Tampil) */}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition ${
              selectedIds.length > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title={selectedIds.length > 0 ? `Hapus ${selectedIds.length} data siswa yang diceklis` : 'Ceklis kotak siswa di tabel terlebih dahulu untuk menghapus sekaligus'}
          >
            <Trash2 className="w-4 h-4" />
            Hapus Ceklis ({selectedIds.length})
          </button>

          {/* Tombol Kosongkan Data Siswa */}
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold shadow-sm transition"
            title="Kosongkan seluruh data siswa untuk diganti baru"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Kosongkan Data
          </button>

          {/* Tombol Reset Data Awal */}
          <button
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition"
            title="Kembalikan ke data 1.094 siswa bawaan sekolah"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Data
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

      {/* Cloud Sync & Backup Bar */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0 text-blue-300">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Database Cloud</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Terhubung (Supabase)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Data tersinkron otomatis antar-PC & laptop. Klik tombol untuk kirim atau tarik data manual.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kirim ke Cloud */}
          <button
            onClick={handlePushToCloud}
            disabled={isCloudSyncing || siswaList.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Unggah data siswa lokal ke database cloud Supabase"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isCloudSyncing ? 'Menyinkron...' : 'Kirim ke Cloud'}</span>
          </button>

          {/* Tarik dari Cloud */}
          <button
            onClick={handlePullFromCloud}
            disabled={isCloudSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Tarik data terbaru dari database cloud Supabase"
          >
            <CloudDownload className="w-4 h-4" />
            <span>Tarik dari Cloud</span>
          </button>

          {/* Cadangkan JSON */}
          <button
            onClick={exportBackupJSON}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/20 transition"
            title="Unduh 1 berkas cadangan JSON lengkap (Siswa + Foto + Pengaturan)"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-300" />
            <span>Backup JSON</span>
          </button>

          {/* Pulihkan JSON */}
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/20 transition">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
            <span>Restore JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackupFile}
              className="hidden"
            />
          </label>
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

          <div className="flex flex-wrap items-center gap-2">
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

            {/* Tombol Cepat Ceklis Semua */}
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                isAllSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'
              }`}
              title="Ceklis semua siswa yang tampil saat ini"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {isAllSelected ? 'Batalkan Ceklis' : `Ceklis Semua (${filteredList.length})`}
            </button>
          </div>
        </div>

        {/* Banner Pilihan Aksi Massal */}
        {selectedIds.length > 0 && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-pulse">
            <div className="flex items-center gap-2.5 text-xs font-bold text-rose-900">
              <CheckSquare className="w-5 h-5 text-rose-600" />
              <span>{selectedIds.length} data siswa ter-ceklis (siap dihapus sekaligus)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-sm transition"
              >
                Batal Ceklis
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md transition transform hover:scale-105"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Sekaligus ({selectedIds.length} Siswa)
              </button>
            </div>
          </div>
        )}

        {/* Tabel Data Siswa */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-16 text-center bg-slate-100/80">
                  <label className="flex items-center justify-center gap-1 cursor-pointer select-none" title="Ceklis / Batalkan Semua">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <span className="text-[10px] font-extrabold text-blue-800">Ceklis</span>
                  </label>
                </th>
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
                const isSelected = selectedIds.includes(siswa.id);

                return (
                  <tr key={siswa.id} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-rose-50/60 font-medium' : ''}`}>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(siswa.id)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                      />
                    </td>
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
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-700 text-sm">Belum ada data siswa</p>
                    <p className="text-xs text-slate-400 mt-1">Silakan klik tombol <b>Impor dari Excel</b> atau <b>+ Tambah Siswa Baru</b> di atas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
