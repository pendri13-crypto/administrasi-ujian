'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Calendar, 
  UserCheck, 
  FileSignature, 
  MapPin, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Upload, 
  Eye, 
  ShieldAlert,
  Sparkles,
  Info,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { 
  SchoolSettings, 
  DEFAULT_SCHOOL_SETTINGS, 
  getStoredSchoolSettings, 
  saveStoredSchoolSettings, 
  resetStoredSchoolSettings 
} from '@/lib/school-settings';
import { getStoredUser, isAdmin } from '@/lib/auth';
import { exportBackupJSON, restoreBackupJSON } from '@/lib/data-service';

export default function PengaturanAdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoPemdaInputRef = useRef<HTMLInputElement>(null);
  const logoSekolahInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [notification, setNotification] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);

  useEffect(() => {
    // Verifikasi role admin
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    if (!isAdmin(currentUser)) {
      setIsAuthorized(false);
      return;
    }

    setSettings(getStoredSchoolSettings());
  }, [router]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleJenisAsesmenChange = (jenis: 'SAS' | 'SAT') => {
    if (jenis === 'SAS') {
      setSettings(prev => ({
        ...prev,
        jenisAsesmen: 'SAS',
        namaUjian: 'SUMATIF AKHIR SEMESTER (SAS)',
        semester: prev.semester === 'Genap' ? 'Ganjil' : prev.semester,
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        jenisAsesmen: 'SAT',
        namaUjian: 'SUMATIF AKHIR TAHUN (SAT)',
        semester: 'Genap',
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, atau WebP).');
      return;
    }

    // Maksimal 2MB untuk base64 di localStorage
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setSettings(prev => ({
          ...prev,
          ttdKepsekUrl: base64,
        }));
        showToast('Gambar tanda tangan kepala sekolah berhasil dimuat!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetTtd = () => {
    setSettings(prev => ({
      ...prev,
      ttdKepsekUrl: DEFAULT_SCHOOL_SETTINGS.ttdKepsekUrl,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Tanda tangan dikembalikan ke file bawaan.');
  };

  const handleLogoPemdaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, atau WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setSettings(prev => ({
          ...prev,
          logoPemdaUrl: base64,
          logoTasikmalayaUrl: base64,
        }));
        showToast('Logo PEMDA berhasil dimuat!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogoPemda = () => {
    setSettings(prev => ({
      ...prev,
      logoPemdaUrl: DEFAULT_SCHOOL_SETTINGS.logoPemdaUrl,
      logoTasikmalayaUrl: DEFAULT_SCHOOL_SETTINGS.logoPemdaUrl,
    }));
    if (logoPemdaInputRef.current) logoPemdaInputRef.current.value = '';
    showToast('Logo PEMDA dikembalikan ke file bawaan.');
  };

  const handleLogoSekolahUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, atau WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setSettings(prev => ({
          ...prev,
          logoSekolahUrl: base64,
        }));
        showToast('Logo Sekolah berhasil dimuat dan disinkronkan ke Login & Dokumen!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogoSekolah = () => {
    setSettings(prev => ({
      ...prev,
      logoSekolahUrl: DEFAULT_SCHOOL_SETTINGS.logoSekolahUrl,
    }));
    if (logoSekolahInputRef.current) logoSekolahInputRef.current.value = '';
    showToast('Logo Sekolah dikembalikan ke file bawaan.');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSchoolSettings(settings);
    showToast('Pengaturan ujian dan sekolah berhasil disimpan! Seluruh dokumen cetak dan halaman login telah disinkronkan.');
  };

  const handleResetAll = () => {
    if (confirm('Kembalikan semua pengaturan ujian dan identitas ke data awal bawaan?')) {
      resetStoredSchoolSettings();
      setSettings(DEFAULT_SCHOOL_SETTINGS);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (logoPemdaInputRef.current) logoPemdaInputRef.current.value = '';
      if (logoSekolahInputRef.current) logoSekolahInputRef.current.value = '';
      showToast('Semua pengaturan dikembalikan ke data awal.');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-200 text-center shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 mt-2">
          Halaman pengaturan ini hanya dapat diakses oleh pengguna dengan kewenangan <strong>Administrator / Panitia Ujian</strong>.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/30 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/20 mb-2">
              <Settings className="w-3.5 h-3.5" /> Panel Hak Akses Administrator
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Pengaturan Ujian & Identitas Sekolah
            </h1>
            <p className="mt-1 text-slate-300 text-xs sm:text-sm">
              Kelola Tahun Ajaran, status asesmen SAS/SAT, data Kepala Sekolah, upload tanda tangan, dan titimangsa cetak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
              title="Reset ke pengaturan default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/30 transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Konfigurasi 5 Poin Utama */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Form Pengaturan (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Pengaturan Tahun Ajaran & Status Asesmen (SAS / SAT) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">1 & 2. Tahun Ajaran & Jenis Asesmen</h2>
                <p className="text-[11px] text-slate-500">Atur periode tahun pelajaran dan ganti status antara SAS atau SAT</p>
              </div>
            </div>

            {/* Status Asesmen: SAS vs SAT (Poin 2) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Jenis / Status Asesmen (Poin 2)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleJenisAsesmenChange('SAS')}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    settings.jenisAsesmen === 'SAS'
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900">SAS</span>
                    {settings.jenisAsesmen === 'SAS' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 mt-1">
                    Sumatif Akhir Semester
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5">Penilaian Semester Ganjil / Gasal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleJenisAsesmenChange('SAT')}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    settings.jenisAsesmen === 'SAT'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-900">SAT</span>
                    {settings.jenisAsesmen === 'SAT' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 mt-1">
                    Sumatif Akhir Tahun
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5">Penilaian Kenaikan Kelas (Genap)</span>
                </button>
              </div>
            </div>

            {/* Nama Teks Ujian di Kop */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">
                Teks Judul Ujian di Kop Dokumen
              </label>
              <input
                type="text"
                value={settings.namaUjian}
                onChange={(e) => setSettings({ ...settings, namaUjian: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                placeholder="Contoh: SUMATIF AKHIR SEMESTER (SAS)"
              />
            </div>

            {/* Tahun Ajaran (Poin 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Tahun Pelajaran (Poin 1)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.tahunAjaran}
                    onChange={(e) => setSettings({ ...settings, tahunAjaran: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    placeholder="Contoh: 2025/2026"
                  />
                </div>
                <div className="flex gap-1.5 pt-1">
                  {['2024/2025', '2025/2026', '2026/2027'].map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setSettings({ ...settings, tahunAjaran: th })}
                      className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-200 transition"
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Semester
                </label>
                <select
                  value={settings.semester}
                  onChange={(e) => setSettings({ ...settings, semester: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Pengaturan Kepala Sekolah & NIP (Poin 3) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">3. Identitas Kepala Sekolah & NIP</h2>
                <p className="text-[11px] text-slate-500">Ganti nama resmi Kepala Sekolah, NIP, dan teks jabatan</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Nama Kepala Sekolah & Gelar
                </label>
                <input
                  type="text"
                  value={settings.namaKepsek}
                  onChange={(e) => setSettings({ ...settings, namaKepsek: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                  placeholder="Contoh: H. UCU KARNI, M.Pd."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Nomor Induk Pegawai (NIP)
                  </label>
                  <input
                    type="text"
                    value={settings.nipKepsek}
                    onChange={(e) => setSettings({ ...settings, nipKepsek: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                    placeholder="Contoh: 19671116 199203 1 005"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Teks Jabatan
                  </label>
                  <input
                    type="text"
                    value={settings.jabatanKepsek}
                    onChange={(e) => setSettings({ ...settings, jabatanKepsek: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                    placeholder="Contoh: Kepala SMPN 1 Rajapolah,"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Upload Logo Sekolah & Logo PEMDA */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">4. Upload Logo Sekolah & Logo PEMDA</h2>
                <p className="text-[11px] text-slate-500">
                  Logo sekolah otomatis tersinkronisasi ke Halaman Login, Navbar, dan Kop Kartu Peserta
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card A: Logo PEMDA (Kop Kiri) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Logo PEMDA</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">Kop Kiri</span>
                  </div>
                  <div className="h-24 bg-white rounded-lg border border-slate-300 p-2 flex items-center justify-center relative shadow-inner overflow-hidden mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.logoPemdaUrl || '/images/logo-tasikmalaya.png'}
                      alt="Logo PEMDA"
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Tampil pada sudut kiri Kop resmi Kartu Peserta dan dokumen ujian.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    ref={logoPemdaInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoPemdaUpload}
                    className="hidden"
                    id="logo-pemda-file-upload"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="logo-pemda-file-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo PEMDA</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleResetLogoPemda}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Bawaan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card B: Logo Sekolah (Login, Navbar & Kanan Kop) */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Logo Sekolah</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      Sinkron ke Login
                    </span>
                  </div>
                  <div className="h-24 bg-white rounded-lg border border-blue-200 p-2 flex items-center justify-center relative shadow-inner overflow-hidden mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.logoSekolahUrl || '/images/logo-sekolah-3d.png'}
                      alt="Logo Sekolah"
                      className="max-h-full max-w-full object-contain filter drop-shadow-md"
                    />
                  </div>
                  <p className="text-[10px] text-blue-900 font-medium mb-2">
                    Otomatis sinkron ke <strong>Halaman Login</strong>, <strong>Navbar</strong>, <strong>Beranda</strong>, dan <strong>Kop Kanan Kartu Peserta</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    ref={logoSekolahInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoSekolahUpload}
                    className="hidden"
                    id="logo-sekolah-file-upload"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="logo-sekolah-file-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo Sekolah</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleResetLogoSekolah}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Bawaan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Upload Gambar TTD Kepala Sekolah */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileSignature className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">5. Tanda Tangan Kepala Sekolah</h2>
                <p className="text-[11px] text-slate-500">Upload scan / gambar tanda tangan asli dengan format transparan (PNG/WebP)</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {/* Preview Gambar TTD Saat Ini */}
              <div className="w-36 h-20 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-2 relative shadow-inner overflow-hidden flex-shrink-0">
                {settings.ttdKepsekUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.ttdKepsekUrl}
                    alt="Preview TTD"
                    className="max-h-full max-w-full object-contain filter contrast-125"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Belum ada TTD</span>
                )}
              </div>

              {/* Tombol Aksi Upload & Reset */}
              <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="ttd-file-upload"
                />
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <label
                    htmlFor="ttd-file-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Gambar TTD Baru</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetTtd}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kembalikan Bawaan</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Rekomendasi: PNG transparan agar menyatu dengan latar kartu dan dokumen cetak.
                </p>
              </div>
            </div>
          </div>

          {/* 6. Titimangsa Pelaksanaan */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-amber-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">6. Titimangsa Pelaksanaan / Cetak</h2>
                <p className="text-[11px] text-slate-500">Atur tempat dan tanggal penandatanganan dokumen ujian</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Kota / Tempat
                </label>
                <input
                  type="text"
                  value={settings.kotaTtd}
                  onChange={(e) => setSettings({ ...settings, kotaTtd: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                  placeholder="Contoh: Rajapolah"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Tanggal Pelaksanaan / Cetak
                </label>
                <input
                  type="text"
                  value={settings.tanggalTtd}
                  onChange={(e) => setSettings({ ...settings, tanggalTtd: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                  placeholder="Contoh: 30 November 2026"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Format titimangsa yang akan dicetak:{' '}
                <strong>{settings.kotaTtd}, {settings.tanggalTtd}</strong>
              </span>
            </div>
          </div>

          {/* Tombol Simpan Bawah */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Seluruh Pengaturan Ujian</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Live Preview Dokumen (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Preview Dokumen</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                Real-Time
              </span>
            </div>

            {/* Kotak Miniatur Kartu Peserta Sesuai Perubahan */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 text-slate-900 shadow-inner space-y-4">
              
              {/* Mini Kop */}
              <div className="border-b-2 border-slate-800 pb-2 flex items-center justify-between gap-2">
                <div className="w-10 h-12 flex-shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.logoPemdaUrl || '/images/logo-tasikmalaya.png'} alt="Logo Pemda" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="text-center flex-1 leading-tight">
                  <p className="text-[11px] font-black uppercase text-slate-950">KARTU PESERTA</p>
                  <p className="text-[10px] font-black uppercase text-blue-900">{settings.namaUjian}</p>
                  <p className="text-[9px] font-black uppercase text-slate-900">{settings.namaSekolah}</p>
                  <p className="text-[8.5px] font-extrabold uppercase text-slate-800 tracking-wider">
                    TAHUN PELAJARAN {settings.tahunAjaran}
                  </p>
                </div>
                <div className="w-10 h-12 flex-shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.logoSekolahUrl || '/images/logo-sekolah-3d.png'} alt="Logo Sekolah" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              {/* Dummy Info Peserta */}
              <div className="text-[10px] space-y-1 text-slate-600 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Nama Peserta:</span>
                  <span className="font-bold text-slate-900">ADELIA PUTRI</span>
                </div>
                <div className="flex justify-between">
                  <span>No. Peserta:</span>
                  <span className="font-mono font-bold text-slate-900">01-07-001</span>
                </div>
                <div className="flex justify-between">
                  <span>Kelas / Ruang:</span>
                  <span className="font-semibold text-slate-800">VII-A / Ruang 01</span>
                </div>
              </div>

              {/* Mini Tanda Tangan */}
              <div className="flex justify-end pt-1">
                <div className="text-center min-w-[150px]">
                  <p className="text-[9px] text-slate-700 leading-tight">
                    {settings.kotaTtd}, {settings.tanggalTtd}
                  </p>
                  <p className="text-[9px] font-medium text-slate-800 leading-tight">
                    {settings.jabatanKepsek}
                  </p>

                  <div className="h-9 my-1 flex items-center justify-center">
                    {settings.ttdKepsekUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.ttdKepsekUrl}
                        alt="TTD"
                        className="max-h-9 w-auto object-contain select-none"
                      />
                    ) : (
                      <div className="h-6 border-b border-slate-400 w-24 mx-auto" />
                    )}
                  </div>

                  <p className="font-bold text-slate-950 text-[9.5px] leading-tight underline decoration-slate-900">
                    {settings.namaKepsek}
                  </p>
                  <p className="text-[8px] font-bold text-slate-800 leading-tight mt-0.5">
                    NIP. {settings.nipKepsek}
                  </p>
                </div>
              </div>
            </div>

            {/* Catatan Integrasi */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-slate-700 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Terhubung Otomatis ke Menu:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-1 text-slate-600">
                <li><strong>Halaman Login</strong> (Logo sekolah 100% tersinkronisasi)</li>
                <li><strong>Header Navbar & Beranda</strong> (Logo sekolah & Identitas)</li>
                <li><strong>Kartu Peserta Ujian</strong> (Kop PEMDA & Sekolah, TTD, Titimangsa)</li>
                <li><strong>Cetak Label Meja</strong> (Tahun Ajaran & SAS/SAT)</li>
                <li><strong>Daftar Hadir Ruang</strong> (Kop & Tanggal Ujian)</li>
              </ul>
            </div>

            {/* Database Cloud & Backup */}
            <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Status Database Cloud</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                  Supabase Terhubung
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Project Cloud: <code className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-blue-200">frjaihrbffdnnjdiuvxm.supabase.co</code>
              </p>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={exportBackupJSON}
                  className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition flex items-center justify-center gap-1.5"
                  title="Unduh file backup JSON lengkap"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Cadangkan Seluruh Data (.JSON)</span>
                </button>

                <label className="cursor-pointer w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition flex items-center justify-center gap-1.5 text-center">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Pulihkan dari File (.JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const res = await restoreBackupJSON(file);
                      if (res.success) {
                        showToast(res.message);
                        setSettings(getStoredSchoolSettings());
                      } else {
                        alert(res.message);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}

