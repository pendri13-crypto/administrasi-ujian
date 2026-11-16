'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Printer, 
  FileSpreadsheet, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  RefreshCw, 
  Save, 
  X, 
  Filter,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { JadwalUjian, Mapel } from '@/types/database';
import { DEMO_MAPEL, DEMO_JADWAL } from '@/lib/demo-data';
import { 
  getStoredJadwal, 
  saveStoredJadwal, 
  getStoredMapel, 
  saveStoredMapel,
  fetchJadwalFromCloud, 
  pushJadwalToCloud, 
  deleteJadwalFromCloud 
} from '@/lib/data-service';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { getStoredUser, isAdmin } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function KelolaJadwalPage() {
  const router = useRouter();

  // Autentikasi Role Admin
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Data States
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTanggal, setFilterTanggal] = useState<string>('all');

  // Cloud & UI States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Form State (Tambah / Edit Jadwal)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalUjian | null>(null);
  const [formMapelId, setFormMapelId] = useState<number>(1);
  const [formTanggal, setFormTanggal] = useState<string>('');
  const [formJamMulai, setFormJamMulai] = useState<string>('07:30');
  const [formJamSelesai, setFormJamSelesai] = useState<string>('09:30');
  const [formSesi, setFormSesi] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Tambah Mapel Kustom Baru (opsional)
  const [isAddMapelMode, setIsAddMapelMode] = useState<boolean>(false);
  const [customNamaMapel, setCustomNamaMapel] = useState<string>('');
  const [customKodeMapel, setCustomKodeMapel] = useState<string>('');
  const [customKkm, setCustomKkm] = useState<number>(75);

  // Delete Confirmation State
  const [deleteConfirmJadwal, setDeleteConfirmJadwal] = useState<JadwalUjian | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Verifikasi Hak Akses Role Admin
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin(user)) {
      setIsAuthorized(false);
      setIsLoadingAuth(false);
      return;
    }
    setIsAuthorized(true);
    setIsLoadingAuth(false);
  }, [router]);

  // Load School Settings
  useEffect(() => {
    setSchoolSettings(getStoredSchoolSettings());
    const handleSettingsUpdate = () => setSchoolSettings(getStoredSchoolSettings());
    window.addEventListener('school-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('school-settings-updated', handleSettingsUpdate);
  }, []);

  // Load Data Jadwal & Mapel
  useEffect(() => {
    const loadedJadwal = getStoredJadwal();
    setJadwalList(loadedJadwal);

    const loadedMapel = getStoredMapel();
    setMapelList(loadedMapel);

    if (loadedJadwal.length > 0 && !formTanggal) {
      setFormTanggal(loadedJadwal[0].tanggal || new Date().toISOString().slice(0, 10));
    } else if (!formTanggal) {
      setFormTanggal(new Date().toISOString().slice(0, 10));
    }

    // Jika Supabase aktif, coba tarik data dari cloud
    if (isSupabaseConfigured) {
      fetchJadwalFromCloud().then(cloudJadwal => {
        if (cloudJadwal && cloudJadwal.length > 0) {
          setJadwalList(cloudJadwal);
        }
      });
    }

    const handleJadwalUpdate = () => {
      setJadwalList(getStoredJadwal());
    };
    window.addEventListener('jadwal-data-updated', handleJadwalUpdate);
    return () => window.removeEventListener('jadwal-data-updated', handleJadwalUpdate);
  }, []);

  // Format Tanggal Indonesia (contoh: Senin, 30 November 2026)
  const formatTanggalIndo = (tglStr: string) => {
    if (!tglStr) return '-';
    try {
      const date = new Date(tglStr + 'T00:00:00');
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return tglStr;
    }
  };

  // Format Hari Saja (contoh: Senin)
  const formatHariIndo = (tglStr: string) => {
    if (!tglStr) return '-';
    try {
      const date = new Date(tglStr + 'T00:00:00');
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
    } catch {
      return '-';
    }
  };

  // Hitung Durasi Ujian dalam Menit
  const getDurasiMenit = (mulai: string, selesai: string) => {
    try {
      const [mH, mM] = mulai.split(':').map(Number);
      const [sH, sM] = selesai.split(':').map(Number);
      const durasi = (sH * 60 + sM) - (mH * 60 + mM);
      return durasi > 0 ? `${durasi} Menit` : '-';
    } catch {
      return '-';
    }
  };

  // Daftar Tanggal Unik untuk Filter
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(jadwalList.map(j => j.tanggal).filter(Boolean)));
    return dates.sort();
  }, [jadwalList]);

  // Filter & Urutkan Jadwal
  const filteredJadwal = useMemo(() => {
    return jadwalList
      .filter(j => {
        const matchTanggal = filterTanggal === 'all' || j.tanggal === filterTanggal;
        if (!matchTanggal) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const mapelObj = mapelList.find(m => m.id === j.mapel_id) || j.mapel;
          const matchNama = mapelObj?.nama_mapel.toLowerCase().includes(q);
          const matchKode = mapelObj?.kode_mapel.toLowerCase().includes(q);
          const matchTgl = j.tanggal.includes(q) || formatTanggalIndo(j.tanggal).toLowerCase().includes(q);
          return matchNama || matchKode || matchTgl;
        }
        return true;
      })
      .sort((a, b) => {
        // Urutkan Tanggal Ascending, lalu Jam Mulai Ascending
        if (a.tanggal !== b.tanggal) {
          return a.tanggal.localeCompare(b.tanggal);
        }
        return a.jam_mulai.localeCompare(b.jam_mulai);
      });
  }, [jadwalList, filterTanggal, searchQuery, mapelList]);

  // Buka Modal Tambah Jadwal
  const handleOpenAddModal = () => {
    setEditingJadwal(null);
    const lastJadwal = jadwalList[jadwalList.length - 1];
    setFormMapelId(mapelList[0]?.id || 1);
    setFormTanggal(lastJadwal?.tanggal || new Date().toISOString().slice(0, 10));
    setFormJamMulai('07:30');
    setFormJamSelesai('09:30');
    setFormSesi(1);
    setIsAddMapelMode(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Buka Modal Edit Jadwal
  const handleOpenEditModal = (j: JadwalUjian) => {
    setEditingJadwal(j);
    setFormMapelId(j.mapel_id);
    setFormTanggal(j.tanggal);
    setFormJamMulai(j.jam_mulai.slice(0, 5));
    setFormJamSelesai(j.jam_selesai.slice(0, 5));
    setFormSesi(j.sesi || 1);
    setIsAddMapelMode(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Simpan Jadwal (Tambah / Update)
  const handleSaveJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTanggal) {
      setFormError('Tanggal ujian wajib dipilih.');
      return;
    }
    if (!formJamMulai || !formJamSelesai) {
      setFormError('Jam mulai dan jam selesai ujian wajib diisi.');
      return;
    }
    if (formJamSelesai <= formJamMulai) {
      setFormError('Jam selesai harus lebih akhir daripada jam mulai ujian.');
      return;
    }

    let targetMapelId = formMapelId;

    // Jika membuat Mapel Baru secara langsung
    if (isAddMapelMode) {
      if (!customNamaMapel.trim()) {
        setFormError('Nama mata pelajaran baru wajib diisi.');
        return;
      }
      const newMapelId = mapelList.length > 0 ? Math.max(...mapelList.map(m => m.id)) + 1 : 1;
      const newMapel: Mapel = {
        id: newMapelId,
        kode_mapel: customKodeMapel.trim() || customNamaMapel.trim().slice(0, 4).toUpperCase(),
        nama_mapel: customNamaMapel.trim(),
        kkm: Number(customKkm) || 75
      };
      const updatedMapel = [...mapelList, newMapel];
      setMapelList(updatedMapel);
      saveStoredMapel(updatedMapel);
      targetMapelId = newMapelId;
    }

    const selectedMapelObj = mapelList.find(m => m.id === targetMapelId) || DEMO_MAPEL.find(m => m.id === targetMapelId);

    let updated: JadwalUjian[];
    if (editingJadwal) {
      updated = jadwalList.map(j => 
        j.id === editingJadwal.id
          ? {
              ...j,
              mapel_id: targetMapelId,
              tanggal: formTanggal,
              jam_mulai: formJamMulai,
              jam_selesai: formJamSelesai,
              sesi: formSesi,
              mapel: selectedMapelObj
            }
          : j
      );
      showToast(`Jadwal ujian ${selectedMapelObj?.nama_mapel || 'mapel'} berhasil diperbarui.`);
    } else {
      const newId = jadwalList.length > 0 ? Math.max(...jadwalList.map(j => j.id)) + 1 : 1;
      const newJadwal: JadwalUjian = {
        id: newId,
        ujian_id: 1,
        mapel_id: targetMapelId,
        tanggal: formTanggal,
        jam_mulai: formJamMulai,
        jam_selesai: formJamSelesai,
        sesi: formSesi,
        mapel: selectedMapelObj
      };
      updated = [...jadwalList, newJadwal];
      showToast(`Jadwal ujian ${selectedMapelObj?.nama_mapel || 'mapel'} berhasil ditambahkan.`);
    }

    setJadwalList(updated);
    saveStoredJadwal(updated);
    setIsModalOpen(false);

    if (isSupabaseConfigured) {
      try {
        await pushJadwalToCloud(updated);
      } catch (err) {
        console.error('Auto sync to Supabase error:', err);
      }
    }
  };

  // Hapus Jadwal
  const handleDeleteJadwal = async (j: JadwalUjian) => {
    const updated = jadwalList.filter(item => item.id !== j.id);
    setJadwalList(updated);
    saveStoredJadwal(updated);
    setDeleteConfirmJadwal(null);
    showToast(`Jadwal ujian telah dihapus.`);

    if (isSupabaseConfigured) {
      try {
        await deleteJadwalFromCloud(j.id);
      } catch (err) {
        console.error('Delete from cloud error:', err);
      }
    }
  };

  // Reset ke Jadwal Standar Bawaan
  const handleResetToStandard = () => {
    if (!confirm('Apakah Anda yakin ingin mereset jadwal ujian ke jadwal standar bawaan sekolah?')) return;
    setJadwalList(DEMO_JADWAL);
    saveStoredJadwal(DEMO_JADWAL);
    showToast('Jadwal ujian berhasil direset ke standar.');
  };

  // Sinkronisasi Manual ke Supabase Cloud
  const handleSyncCloud = async () => {
    if (!isSupabaseConfigured) {
      alert('Koneksi Supabase Cloud belum aktif atau belum dikonfigurasi.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await pushJadwalToCloud(jadwalList);
      if (res.success) {
        showToast(`Berhasil menyinkronkan ${res.count} jadwal ujian ke Supabase Cloud!`);
      } else {
        alert(`Gagal sinkron cloud: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Unduh Berkas Excel Jadwal Ujian
  const handleExportExcel = () => {
    if (jadwalList.length === 0) {
      alert('Belum ada jadwal ujian untuk diekspor ke Excel.');
      return;
    }

    const cleanNamaSekolah = (schoolSettings.namaSekolah || 'SMP NEGERI 1 RAJAPOLAH').toUpperCase();
    const cleanUjian = (schoolSettings.namaUjian || 'SUMATIF AKHIR SEMESTER (SAS)').toUpperCase();
    const cleanTahun = schoolSettings.tahunAjaran || '2025/2026';
    const cleanSemester = (schoolSettings.semester || 'GANJIL').toUpperCase();

    const sortedAll = [...jadwalList].sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
      return a.jam_mulai.localeCompare(b.jam_mulai);
    });

    const aoa: any[][] = [
      ['JADWAL PELAKSANAAN UJIAN RESMI'],
      [`${cleanNamaSekolah} • ${cleanUjian}`],
      [`TAHUN PELAJARAN ${cleanTahun} • SEMESTER ${cleanSemester}`],
      [],
      ['No', 'Hari', 'Tanggal', 'Waktu Ujian (WIB)', 'Durasi', 'Kode Mapel', 'Mata Pelajaran', 'KKM', 'Sesi']
    ];

    sortedAll.forEach((j, idx) => {
      const mapelObj = mapelList.find(m => m.id === j.mapel_id) || j.mapel;
      aoa.push([
        idx + 1,
        formatHariIndo(j.tanggal),
        j.tanggal,
        `${j.jam_mulai.slice(0, 5)} - ${j.jam_selesai.slice(0, 5)}`,
        getDurasiMenit(j.jam_mulai, j.jam_selesai),
        mapelObj?.kode_mapel || '-',
        mapelObj?.nama_mapel || '-',
        mapelObj?.kkm || 75,
        `Sesi ${j.sesi || 1}`
      ]);
    });

    aoa.push([]);
    const ttdKota = schoolSettings.kotaTtd || 'Rajapolah';
    const ttdTgl = schoolSettings.tanggalTtd || '30 November 2026';
    const ttdJabatan = schoolSettings.jabatanKepsek || 'Kepala SMPN 1 Rajapolah,';
    const ttdNama = schoolSettings.namaKepsek || 'H. UCU KARNI, M.Pd.';
    const ttdNip = schoolSettings.nipKepsek || '19671116 199203 1 005';

    aoa.push(['', '', '', '', '', ttdKota + ', ' + ttdTgl]);
    aoa.push(['', '', '', '', '', ttdJabatan]);
    aoa.push([]);
    aoa.push([]);
    aoa.push(['', '', '', '', '', ttdNama]);
    aoa.push(['', '', '', '', '', 'NIP. ' + ttdNip]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
      { s: { r: aoa.length - 6, c: 5 }, e: { r: aoa.length - 6, c: 8 } },
      { s: { r: aoa.length - 5, c: 5 }, e: { r: aoa.length - 5, c: 8 } },
      { s: { r: aoa.length - 2, c: 5 }, e: { r: aoa.length - 2, c: 8 } },
      { s: { r: aoa.length - 1, c: 5 }, e: { r: aoa.length - 1, c: 8 } }
    ];

    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 32 },
      { wch: 10 },
      { wch: 12 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal_Ujian');

    const cleanSekolah = schoolSettings.namaSekolah ? schoolSettings.namaSekolah.replace(/[^a-zA-Z0-9]/g, '_') : 'SMPN1_Rajapolah';
    const filename = `Jadwal_Ujian_${cleanSekolah}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast('Sukses! Berkas Excel Jadwal Ujian berhasil diunduh.');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Tampilan jika bukan Role Admin
  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Akses Ditolak (Khusus Role Admin)</h2>
        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
          Halaman <b>Kelola Jadwal Ujian</b> hanya dapat diakses oleh pengguna dengan kewenangan <b>Administrator</b>.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Utama (Hidden saat print) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20 flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">Manajemen Jadwal Ujian</h1>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Role Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur mata pelajaran, tanggal pelaksanaan, dan alokasi waktu ujian resmi sekolah.
            </p>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2">
          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
              title="Sinkronkan jadwal ke Supabase Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'Sinkron...' : 'Sinkron Cloud'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            title="Unduh Berkas Excel Jadwal Ujian"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Cetak Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            title="Cetak Jadwal Ujian Resmi (Kertas A4)"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Dokumen Kop Cetak Resmi (Hanya Muncul Saat Print) */}
      <div className="hidden print:block mb-6 border-b-4 border-double border-slate-900 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="w-[68px] h-[78px] flex-shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={schoolSettings.logoPemdaUrl || schoolSettings.logoTasikmalayaUrl || '/images/logo-tasikmalaya.png'}
              alt="Logo Pemda"
              className="w-full h-full object-contain select-none"
            />
          </div>

          <div className="flex-1 text-center leading-tight">
            <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
              {schoolSettings.namaInstansi || 'PEMERINTAH KABUPATEN TASIKMALAYA'}
            </h3>
            <h2 className="text-[15px] font-black text-slate-950 uppercase tracking-wide mt-0.5">
              {schoolSettings.namaSekolah || 'SMP NEGERI 1 RAJAPOLAH'}
            </h2>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {schoolSettings.alamatSekolah || 'Jl. Raya Rajapolah No. 1 • Kab. Tasikmalaya'}
            </p>
            <div className="mt-2 pt-1 border-t border-slate-400">
              <h4 className="text-[13px] font-black text-slate-900 uppercase">
                JADWAL PELAKSANAAN {schoolSettings.namaUjian || 'SUMATIF AKHIR SEMESTER (SAS)'}
              </h4>
              <p className="text-[11px] font-extrabold text-slate-800 uppercase">
                TAHUN PELAJARAN {schoolSettings.tahunAjaran} &bull; SEMESTER {(schoolSettings.semester || 'GANJIL').toUpperCase()}
              </p>
            </div>
          </div>

          <div className="w-[68px] h-[78px] flex-shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'}
              alt="Logo Sekolah"
              className="w-full h-full object-contain select-none"
            />
          </div>
        </div>
      </div>

      {/* Tabel & Konten Jadwal Ujian */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Toolbar (Hidden saat print) */}
        <div className="no-print p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mata pelajaran atau tanggal..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>

            {/* Filter Tanggal */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                className="text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Semua Tanggal ({uniqueDates.length} Hari Ujian)</option>
                {uniqueDates.map(dateStr => (
                  <option key={dateStr} value={dateStr}>
                    {formatTanggalIndo(dateStr)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-semibold text-slate-500">
              Total: <b>{filteredJadwal.length} Jadwal</b>
            </span>
            <button
              type="button"
              onClick={handleResetToStandard}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition"
              title="Reset ke jadwal bawaan sekolah"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset Standar</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Jadwal Ujian */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-44">Hari & Tanggal</th>
                <th className="py-3.5 px-4 w-44">Waktu Ujian (WIB)</th>
                <th className="py-3.5 px-4 w-28 text-center">Durasi</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-4 w-24 text-center">Sesi</th>
                <th className="py-3.5 px-4 w-20 text-center">KKM</th>
                <th className="no-print py-3.5 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
              {filteredJadwal.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-semibold text-slate-600">Tidak ada jadwal ujian yang sesuai.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol <b>Tambah Jadwal</b> untuk menambahkan agenda mata pelajaran baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredJadwal.map((jadwal, index) => {
                  const mapelObj = mapelList.find(m => m.id === jadwal.mapel_id) || jadwal.mapel;
                  const durasi = getDurasiMenit(jadwal.jam_mulai, jadwal.jam_selesai);

                  return (
                    <tr 
                      key={jadwal.id} 
                      className="hover:bg-amber-50/40 transition duration-150"
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center font-bold text-slate-500">
                        {index + 1}
                      </td>

                      {/* Hari & Tanggal */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                            {formatHariIndo(jadwal.tanggal).slice(0, 3)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight">
                              {formatHariIndo(jadwal.tanggal)}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {jadwal.tanggal}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Waktu Pelaksanaan */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="font-mono text-xs">
                            {jadwal.jam_mulai.slice(0, 5)} - {jadwal.jam_selesai.slice(0, 5)} WIB
                          </span>
                        </div>
                      </td>

                      {/* Durasi */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10.5px]">
                          {durasi}
                        </span>
                      </td>

                      {/* Mata Pelajaran */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">
                              {mapelObj?.nama_mapel || `Mapel ID ${jadwal.mapel_id}`}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Kode: <span className="font-bold text-slate-700">{mapelObj?.kode_mapel || '-'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Sesi */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                          Sesi {jadwal.sesi || 1}
                        </span>
                      </td>

                      {/* KKM */}
                      <td className="py-3 px-4 text-center font-bold font-mono text-slate-700">
                        {mapelObj?.kkm ? mapelObj.kkm.toFixed(0) : '75'}
                      </td>

                      {/* Tombol Aksi (Hidden saat print) */}
                      <td className="no-print py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(jadwal)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Jadwal Ini"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmJadwal(jadwal)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Jadwal Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Cetak Resmi (Hanya Tampil Saat Print) */}
        <div className="hidden print:block p-6 mt-8">
          <div className="flex justify-between items-start text-xs">
            <div className="max-w-xs space-y-1 text-slate-700">
              <p className="font-bold underline uppercase">Catatan Penting Peserta:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-slate-600">
                <li>Peserta wajib hadir 15 menit sebelum waktu ujian dimulai.</li>
                <li>Membawa Kartu Peserta Ujian resmi yang telah diverifikasi.</li>
                <li>Membawa perlengkapan alat tulis pensil/pulpen sendiri.</li>
              </ol>
            </div>

            <div className="text-center min-w-[200px]">
              <p className="text-slate-800">
                {schoolSettings.kotaTtd || 'Rajapolah'}, {schoolSettings.tanggalTtd || '30 November 2026'}
              </p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {schoolSettings.jabatanKepsek || 'Kepala SMPN 1 Rajapolah,'}
              </p>

              {/* Tanda Tangan */}
              <div className="relative h-14 my-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={schoolSettings.ttdKepsekUrl || '/images/ttd-kepsek.png'}
                  alt="Tanda Tangan Kepala Sekolah"
                  className="max-h-14 w-auto object-contain select-none"
                />
              </div>

              <p className="font-bold text-slate-950 text-xs underline underline-offset-2">
                {schoolSettings.namaKepsek || 'H. UCU KARNI, M.Pd.'}
              </p>
              <p className="text-[10px] text-slate-700 font-mono mt-0.5">
                NIP. {schoolSettings.nipKepsek || '19671116 199203 1 005'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL FORM TAMBAH / EDIT JADWAL                              */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingJadwal ? 'Edit Jadwal Ujian' : 'Tambah Jadwal Ujian Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. MATA PELAJARAN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddMapelMode(!isAddMapelMode)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-800"
                  >
                    {isAddMapelMode ? 'Pilih dari Daftar Mapel' : '+ Tambah Mapel Kustom'}
                  </button>
                </div>

                {!isAddMapelMode ? (
                  <select
                    value={formMapelId}
                    onChange={(e) => setFormMapelId(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama_mapel} ({m.kode_mapel}) - KKM: {m.kkm}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-slate-600">Nama Mapel Baru</span>
                      <input
                        type="text"
                        value={customNamaMapel}
                        onChange={(e) => setCustomNamaMapel(e.target.value)}
                        placeholder="Contoh: Bahasa Jepang / Mulok"
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-600">Kode Mapel</span>
                        <input
                          type="text"
                          value={customKodeMapel}
                          onChange={(e) => setCustomKodeMapel(e.target.value.toUpperCase())}
                          placeholder="Contoh: BJEP"
                          className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-600">Nilai KKM</span>
                        <input
                          type="number"
                          value={customKkm}
                          onChange={(e) => setCustomKkm(Number(e.target.value))}
                          min={0}
                          max={100}
                          className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. TANGGAL UJIAN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  required
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                {formTanggal && (
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">
                    &bull; Hari: <b>{formatTanggalIndo(formTanggal)}</b>
                  </p>
                )}
              </div>

              {/* 3. WAKTU PELAKSANAAN (JAM MULAI & SELESAI) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value)}
                    required
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value)}
                    required
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Durasi Terhitung & Sesi */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Estimasi Durasi:</span>{' '}
                  <b className="text-slate-900">{getDurasiMenit(formJamMulai, formJamSelesai)}</b>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-bold">Sesi:</span>
                  <select
                    value={formSesi}
                    onChange={(e) => setFormSesi(Number(e.target.value))}
                    className="text-xs font-bold border border-slate-300 rounded-lg px-2 py-1 bg-white"
                  >
                    <option value={1}>Sesi 1 (Pagi)</option>
                    <option value={2}>Sesi 2 (Siang)</option>
                  </select>
                </div>
              </div>

              {/* Tombol Simpan Modal */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL KONFIRMASI HAPUS JADWAL                                */}
      {/* ============================================================ */}
      {deleteConfirmJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Hapus Jadwal</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus jadwal ujian untuk mata pelajaran{' '}
              <b>
                {mapelList.find(m => m.id === deleteConfirmJadwal.mapel_id)?.nama_mapel || 'Mapel ini'}
              </b>{' '}
              pada tanggal <b>{deleteConfirmJadwal.tanggal}</b>?
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmJadwal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteJadwal(deleteConfirmJadwal)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition"
              >
                Ya, Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
