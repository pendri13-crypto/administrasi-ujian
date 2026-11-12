'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DoorOpen, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Printer, 
  ShieldAlert, 
  Sparkles, 
  Building2, 
  Eye, 
  X, 
  Save, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { Ruang, Siswa } from '@/types/database';
import { DEMO_KELAS, DEMO_RUANG } from '@/lib/demo-data';
import { 
  getStoredRuang, 
  saveStoredRuang, 
  fetchRuangFromCloud, 
  pushRuangToCloud, 
  deleteRuangFromCloud,
  fetchSiswaFromCloud 
} from '@/lib/data-service';
import { getStoredUser, isAdmin } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';

export default function KelolaRuangPage() {
  const router = useRouter();

  // Authentication & Security
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Data States
  const [ruangList, setRuangList] = useState<Ruang[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);

  // Cloud & Sync States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Form State (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRuang, setEditingRuang] = useState<Ruang | null>(null);
  const [formKode, setFormKode] = useState<string>('');
  const [formNama, setFormNama] = useState<string>('');
  const [formKapasitas, setFormKapasitas] = useState<number>(36);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmRuang, setDeleteConfirmRuang] = useState<Ruang | null>(null);

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

  // Load Data Ruang & Siswa (Lokal & Supabase Cloud)
  useEffect(() => {
    const initialRuang = getStoredRuang();
    setRuangList(initialRuang);

    // Ambil data siswa untuk menghitung jumlah peserta per ruang
    try {
      const savedSiswa = localStorage.getItem('adm_siswa_data');
      if (savedSiswa) {
        const parsed: Siswa[] = JSON.parse(savedSiswa);
        if (Array.isArray(parsed)) setSiswaList(parsed);
      } else if (isSupabaseConfigured) {
        fetchSiswaFromCloud().then(data => {
          if (data) setSiswaList(data);
        });
      }
    } catch (e) {
      console.error(e);
    }

    // Jika Supabase aktif, coba sinkron data ruang dari Supabase
    if (isSupabaseConfigured) {
      fetchRuangFromCloud().then(cloudRuang => {
        if (cloudRuang && cloudRuang.length > 0) {
          setRuangList(cloudRuang);
        }
      });
    }

    const handleRuangUpdate = () => {
      setRuangList(getStoredRuang());
    };
    window.addEventListener('ruang-data-updated', handleRuangUpdate);
    return () => window.removeEventListener('ruang-data-updated', handleRuangUpdate);
  }, []);

  // Hitung jumlah siswa per ruang (berdasarkan kelas atau alokasi ruang)
  const siswaCountPerRuang = useMemo(() => {
    const map: Record<number, number> = {};
    siswaList.forEach(s => {
      const kId = s.kelas_id || 1;
      map[kId] = (map[kId] || 0) + 1;
    });
    return map;
  }, [siswaList]);

  // Filter Ruang berdasarkan pencarian
  const filteredRuang = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ruangList;
    return ruangList.filter(
      r => r.kode_ruang.toLowerCase().includes(q) || r.nama_ruang.toLowerCase().includes(q)
    );
  }, [ruangList, searchQuery]);

  // Statistik Ringkas
  const totalKapasitas = useMemo(() => {
    return ruangList.reduce((acc, r) => acc + (Number(r.kapasitas) || 0), 0);
  }, [ruangList]);

  const totalSiswaTerisi = useMemo(() => {
    return siswaList.length;
  }, [siswaList]);

  // Handler Buka Modal Tambah
  const handleOpenAddModal = () => {
    setEditingRuang(null);
    const nextNum = ruangList.length + 1;
    setFormKode(`R-${nextNum.toString().padStart(2, '0')}`);
    setFormNama(`Ruang ${nextNum.toString().padStart(2, '0')}`);
    setFormKapasitas(36);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handler Buka Modal Edit
  const handleOpenEditModal = (ruang: Ruang) => {
    setEditingRuang(ruang);
    setFormKode(ruang.kode_ruang);
    setFormNama(ruang.nama_ruang);
    setFormKapasitas(ruang.kapasitas || 36);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Simpan Data Ruang (Tambah / Update)
  const handleSaveRuang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKode.trim()) {
      setFormError('Kode ruang wajib diisi (contoh: R-01)');
      return;
    }
    if (!formNama.trim()) {
      setFormError('Nama ruang wajib diisi (contoh: Ruang 01)');
      return;
    }
    if (formKapasitas < 1) {
      setFormError('Kapasitas minimal 1 peserta');
      return;
    }

    let updated: Ruang[];
    if (editingRuang) {
      // Update data
      updated = ruangList.map(r => 
        r.id === editingRuang.id 
          ? { ...r, kode_ruang: formKode.trim(), nama_ruang: formNama.trim(), kapasitas: Number(formKapasitas) }
          : r
      );
      showToast(`Ruang "${formNama}" berhasil diperbarui.`);
    } else {
      // Cek duplikasi kode ruang
      if (ruangList.some(r => r.kode_ruang.toLowerCase() === formKode.trim().toLowerCase())) {
        setFormError(`Kode ruang "${formKode.trim()}" sudah digunakan. Gunakan kode lain.`);
        return;
      }
      const newId = ruangList.length > 0 ? Math.max(...ruangList.map(r => r.id)) + 1 : 1;
      const newRuang: Ruang = {
        id: newId,
        kode_ruang: formKode.trim(),
        nama_ruang: formNama.trim(),
        kapasitas: Number(formKapasitas),
      };
      updated = [...ruangList, newRuang];
      showToast(`Ruang baru "${formNama}" berhasil ditambahkan.`);
    }

    setRuangList(updated);
    saveStoredRuang(updated);
    setIsModalOpen(false);

    // Otomatis push ke Supabase jika aktif
    if (isSupabaseConfigured) {
      try {
        await pushRuangToCloud(updated);
      } catch (err) {
        console.error('Auto sync to Supabase error:', err);
      }
    }
  };

  // Hapus Ruang
  const handleDeleteRuang = async (ruang: Ruang) => {
    const updated = ruangList.filter(r => r.id !== ruang.id);
    setRuangList(updated);
    saveStoredRuang(updated);
    setDeleteConfirmRuang(null);
    showToast(`Ruang "${ruang.nama_ruang}" telah dihapus.`);

    if (isSupabaseConfigured) {
      try {
        await deleteRuangFromCloud(ruang.id);
      } catch (err) {
        console.error('Delete from cloud error:', err);
      }
    }
  };

  // Generate Otomatis 33 Ruang sesuai Kelas VII-A s.d IX-K
  const handleGenerateStandardRuang = async () => {
    if (!confirm('Apakah Anda ingin membuat ulang 33 Ruang Ujian standar berdasarkan rombel kelas (VII-A s.d IX-K)?')) {
      return;
    }

    const standardRuang: Ruang[] = DEMO_KELAS.map((k, idx) => ({
      id: k.id,
      kode_ruang: 'R-' + (idx + 1).toString().padStart(2, '0'),
      nama_ruang: `Ruang ${(idx + 1).toString().padStart(2, '0')} (${k.nama_kelas})`,
      kapasitas: 36,
    }));

    setRuangList(standardRuang);
    saveStoredRuang(standardRuang);
    showToast(`Berhasil men-generate ${standardRuang.length} ruang ujian standar.`);

    if (isSupabaseConfigured) {
      setIsSyncing(true);
      await pushRuangToCloud(standardRuang);
      setIsSyncing(false);
      showToast(`33 Ruang tersimpan ke database cloud Supabase!`);
    }
  };

  // Sinkronisasi Manual ke Supabase Cloud
  const handleSyncCloud = async () => {
    if (!isSupabaseConfigured) {
      alert('Koneksi Supabase belum terkonfigurasi di sistem.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await pushRuangToCloud(ruangList);
      if (res.success) {
        showToast(`Berhasil mensinkronkan ${res.count} ruang ke cloud Supabase!`);
      } else {
        alert('Gagal sinkron: ' + res.error);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat sinkronisasi: ' + err?.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Ambil Ulang Data dari Supabase Cloud
  const handlePullCloud = async () => {
    if (!isSupabaseConfigured) {
      alert('Koneksi Supabase belum terkonfigurasi.');
      return;
    }

    setIsSyncing(true);
    try {
      const cloudData = await fetchRuangFromCloud();
      if (cloudData && cloudData.length > 0) {
        setRuangList(cloudData);
        showToast(`Berhasil mengambil ${cloudData.length} data ruang dari Supabase!`);
      } else {
        showToast('Tidak ada data ruang baru di cloud Supabase.');
      }
    } catch (err: any) {
      alert('Gagal mengambil data dari cloud: ' + err?.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
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
          Halaman <b>Kelola Ruang Ujian</b> hanya dapat diakses oleh pengguna dengan kewenangan <b>Administrator</b>.
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

      {/* Header & Action Bar */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">Kelola Ruang Ujian</h1>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                  Role Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur daftar ruang ujian, kapasitas tempat duduk siswa, alokasi per rombel, dan sinkronisasi database cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Ruang</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateStandardRuang}
            title="Generate 33 Ruang otomatis sesuai Kelas VII-A s.d IX-K"
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Set Standar 33 Ruang</span>
          </button>

          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={handleSyncCloud}
              disabled={isSyncing}
              title="Simpan seluruh ruang ke Supabase Cloud"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition disabled:opacity-60"
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Cloud'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Ruang Ujian</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{ruangList.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Kapasitas Kursi</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalKapasitas} <span className="text-xs font-normal text-slate-500">Meja</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Siswa Terdaftar</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalSiswaTerisi} <span className="text-xs font-normal text-slate-500">Siswa</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Database Cloud</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Terhubung
            </span>
          </div>
        </div>
      </div>

      {/* Main Table & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="no-print p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode atau nama ruang..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Menampilkan <b>{filteredRuang.length}</b> dari {ruangList.length} ruang
          </div>
        </div>

        {/* Header untuk Print Rekap */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <div className="text-center">
            <h2 className="text-lg font-black uppercase text-slate-900">{schoolSettings.namaSekolah}</h2>
            <h3 className="text-sm font-bold text-slate-800">DAFTAR REKAPITULASI RUANG UJIAN & KAPASITAS</h3>
            <p className="text-xs text-slate-600 mt-1">
              Agenda: {schoolSettings.namaUjian} &bull; Tahun Ajaran: {schoolSettings.tahunAjaran} ({schoolSettings.semester})
            </p>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-32">Kode Ruang</th>
                <th className="py-3 px-4">Nama Ruang Ujian</th>
                <th className="py-3 px-4 w-36 text-center">Kapasitas Kursi</th>
                <th className="py-3 px-4 w-40 text-center">Peserta Terisi</th>
                <th className="py-3 px-4 w-32 text-center">Status</th>
                <th className="no-print py-3 px-4 w-48 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
              {filteredRuang.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    Tidak ada ruang ujian yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredRuang.map((ruang, index) => {
                  const siswaCount = siswaCountPerRuang[ruang.id] || 0;
                  const isFull = siswaCount >= (ruang.kapasitas || 36);

                  return (
                    <tr key={ruang.id} className="hover:bg-teal-50/40 transition">
                      <td className="py-3 px-4 text-center text-slate-500 font-bold">{index + 1}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold font-mono text-[11px]">
                          {ruang.kode_ruang}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {ruang.nama_ruang}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {ruang.kapasitas || 36} Meja
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-slate-900">
                            {siswaCount} / {ruang.kapasitas || 36}
                          </span>
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                isFull ? 'bg-amber-500' : 'bg-teal-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, Math.round((siswaCount / (ruang.kapasitas || 36)) * 100))}%` 
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isFull 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {isFull ? 'Penuh' : 'Tersedia'}
                        </span>
                      </td>
                      <td className="no-print py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ruang)}
                            title="Edit Ruang"
                            className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <Link
                            href={`/daftar-hadir`}
                            title="Lihat Daftar Hadir Ruang Ini"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmRuang(ruang)}
                            title="Hapus Ruang"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Modal Tambah / Edit Ruang */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingRuang ? 'Edit Ruang Ujian' : 'Tambah Ruang Ujian Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRuang} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kode Ruang
                </label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value.toUpperCase())}
                  placeholder="Contoh: R-01 atau LAB-KOMP"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
                <p className="text-[10px] text-slate-500">Kode unik ruang ujian yang tertera pada kartu & label meja.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Ruang
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Ruang 01 (Kelas VII-A)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kapasitas Tempat Duduk (Meja)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formKapasitas}
                  onChange={(e) => setFormKapasitas(Number(e.target.value))}
                  placeholder="36"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
                <p className="text-[10px] text-slate-500">Maksimum jumlah kursi peserta ujian di ruang ini.</p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingRuang ? 'Simpan Perubahan' : 'Tambahkan Ruang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirmRuang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Hapus Ruang Ujian?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus <b>{deleteConfirmRuang.nama_ruang}</b> ({deleteConfirmRuang.kode_ruang})?
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRuang(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRuang(deleteConfirmRuang)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition"
              >
                Ya, Hapus Ruang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
