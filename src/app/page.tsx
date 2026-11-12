'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  FileSpreadsheet, 
  Award, 
  ClipboardList, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Calendar,
  Tag,
  Settings,
  DoorOpen
} from 'lucide-react';
import { DEMO_SISWA, DEMO_KELAS, DEMO_RUANG, DEMO_UJIAN } from '@/lib/demo-data';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { fetchSiswaFromCloud, getStoredRuang } from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Dashboard() {
  const aktifUjian = DEMO_UJIAN[0];
  const [totalSiswa, setTotalSiswa] = useState<number>(0);
  const [totalRuang, setTotalRuang] = useState<number>(DEMO_RUANG.length);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);

  useEffect(() => {
    const updateSettings = () => {
      setSchoolSettings(getStoredSchoolSettings());
    };
    updateSettings();
    window.addEventListener('school-settings-updated', updateSettings);
    return () => window.removeEventListener('school-settings-updated', updateSettings);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('adm_siswa_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.some((s: { nama_lengkap?: string; id?: number }) => s.nama_lengkap === 'ADELFIO PRADITYA PUTRA' && s.id === 1)) {
            localStorage.removeItem('adm_siswa_data');
            setTotalSiswa(0);
            return;
          }
          setTotalSiswa(parsed.length);
          return;
        }
      }
      if (isSupabaseConfigured) {
        fetchSiswaFromCloud().then(cloudSiswa => {
          if (cloudSiswa && cloudSiswa.length > 0) {
            setTotalSiswa(cloudSiswa.length);
          }
        });
      }
      setTotalSiswa(0);
    } catch (e) {
      console.error(e);
    }

    const updateRuang = () => {
      setTotalRuang(getStoredRuang().length);
    };
    updateRuang();
    window.addEventListener('ruang-data-updated', updateRuang);
    return () => window.removeEventListener('ruang-data-updated', updateRuang);
  }, []);

  return (
    <div className="space-y-8">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/30 text-blue-100 border border-blue-400/20 mb-3">
              <Calendar className="w-3.5 h-3.5" /> Agenda Aktif: {schoolSettings.namaUjian} ({schoolSettings.semester}) • TP {schoolSettings.tahunAjaran}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrasi Ujian & Penilaian SMPN 1 Rajapolah
            </h1>
            <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
              Kelola kartu peserta dengan foto siswa, cetak daftar hadir ujian per ruangan, 
              serta cetak rekapitulasi nilai per kelas dan per mata pelajaran secara otomatis.
            </p>
          </div>
          <div className="hidden sm:flex flex-shrink-0 items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={schoolSettings.logoSekolahUrl || '/images/logo-sekolah-3d.png'} alt="Logo Sekolah" className="w-24 h-24 object-contain drop-shadow-xl" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-blue-500/30">
          <div>
            <p className="text-xs text-blue-200">Total Siswa</p>
            <p className="text-2xl font-bold mt-0.5">{totalSiswa}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Jumlah Rombel</p>
            <p className="text-2xl font-bold mt-0.5">{DEMO_KELAS.length} Kelas</p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Ruang Ujian</p>
            <p className="text-2xl font-bold mt-0.5">{totalRuang} Ruang</p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Status Database</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Siap Digunakan
            </span>
          </div>
        </div>
      </div>

      {/* 4 Fitur Utama Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Fitur Administrasi Ujian</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Fitur 1: Kartu Peserta */}
          <Link 
            href="/kartu-peserta"
            className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-slate-400 group-hover:text-blue-600 transition">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition">
              1. Cetak Kartu Peserta
            </h3>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Format siap cetak A4 (grid 2x2 atau 4 kartu per halaman) dilengkapi pas foto 3x4 siswa, 
              nomor peserta, nomor meja, ruangan, dan tanda tangan kepala sekolah.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-600">
              Buka Modul Cetak Kartu &rarr;
            </div>
          </Link>

          {/* Fitur 2: Daftar Nilai Per Kelas */}
          <Link 
            href="/nilai-kelas"
            className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-slate-400 group-hover:text-emerald-600 transition">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-emerald-600 transition">
              2. Daftar Nilai Per Kelas
            </h3>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Tabel matriks nilai per rombel/kelas. Seluruh mata pelajaran tersusun per kolom, 
              lengkap dengan rata-rata nilai siswa dan status ketuntasan.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
              Lihat Rekap Nilai Kelas &rarr;
            </div>
          </Link>

          {/* Fitur 3: Daftar Nilai Per Mapel */}
          <Link 
            href="/nilai-mapel"
            className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-slate-400 group-hover:text-amber-600 transition">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-amber-600 transition">
              3. Daftar Nilai Per Mapel
            </h3>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Laporan khusus per mata pelajaran untuk guru pengampu. Dilengkapi ranking / peringkat, 
              pemisahan nilai pilihan ganda vs esai, serta indikator KKM.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-600">
              Lihat Leger Mapel &rarr;
            </div>
          </Link>

          {/* Fitur 4: Daftar Hadir Per Ruang */}
          <Link 
            href="/daftar-hadir"
            className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <ClipboardList className="w-6 h-6" />
              </div>
              <span className="text-slate-400 group-hover:text-indigo-600 transition">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition">
              4. Daftar Hadir Per Ruang
            </h3>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Format lembar presensi resmi per ruangan ujian. Dilengkapi kolom tanda tangan peserta, 
              nomor meja, serta berita acara pengawas ruang.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600">
              Cetak Daftar Hadir Ruangan &rarr;
            </div>
          </Link>

          {/* Fitur Tambahan: Cetak Nomor Meja / Label Bangku */}
          <Link 
            href="/nomor-meja"
            className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-violet-500 hover:shadow-xl transition-all duration-200 md:col-span-2"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">
                <Tag className="w-6 h-6" />
              </div>
              <span className="text-slate-400 group-hover:text-violet-600 transition">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-violet-600 transition">
              5. Cetak Nomor Meja & Label Bangku
            </h3>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Stiker/label nomor meja peserta yang siap dicetak dan ditempel di setiap sudut meja ruang ujian (8 label per lembar A4).
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-violet-600">
              Cetak Label Meja Siswa &rarr;
            </div>
          </Link>

        </div>
      </div>

      {/* Data Master & Admin Quick Shortcut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shortcut 1: Siswa */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Data Siswa & Foto</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Impor siswa atau pasang foto 3x4 agar otomatis tampil pada kartu peserta.
              </p>
            </div>
          </div>
          <Link 
            href="/siswa"
            className="w-full py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition text-center"
          >
            Buka Data Siswa
          </Link>
        </div>

        {/* Shortcut 2: Ruang Ujian (Role Admin) */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-200/80 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 flex-shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-slate-900 text-sm">Kelola Ruang Ujian</h4>
                <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded border border-teal-300">
                  Role Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Atur kode ruang, kapasitas kursi, alokasi kelas, dan sinkron Supabase.
              </p>
            </div>
          </div>
          <Link 
            href="/ruang"
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition text-center"
          >
            Kelola Ruang
          </Link>
        </div>

        {/* Shortcut 3: Pengaturan Sekolah (Role Admin) */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-200/70 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-slate-900 text-sm">Pengaturan Sekolah</h4>
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                  Role Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Tahun Ajaran, status SAS/SAT, Nama/NIP Kepsek, TTD, & titimangsa.
              </p>
            </div>
          </div>
          <Link 
            href="/pengaturan"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition text-center"
          >
            Buka Pengaturan
          </Link>
        </div>
      </div>
    </div>
  );
}

