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
  DoorOpen,
  UserCheck,
  CalendarCheck
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
          setTotalSiswa(parsed.length);
        }
      }
      if (isSupabaseConfigured) {
        fetchSiswaFromCloud().then(cloudSiswa => {
          if (cloudSiswa && cloudSiswa.length > 0) {
            setTotalSiswa(cloudSiswa.length);
          }
        });
      }
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
      {/* Banner / Header (Deep Pine & Sage Green Theme) */}
      <div className="bg-gradient-to-br from-[#082218] via-[#0d2d22] to-[#143b2e] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 mb-3 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" /> Agenda Aktif: {schoolSettings.namaUjian} ({schoolSettings.semester}) • TP {schoolSettings.tahunAjaran}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
              Sistem Assesmen SMPN 1 Rajapolah
            </h1>
            <p className="mt-2 text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Kelola kartu peserta dengan foto siswa, cetak daftar hadir ujian per ruangan, 
              serta cetak rekapitulasi nilai per kelas dan per mata pelajaran secara otomatis.
            </p>
          </div>
          <div className="hidden sm:flex flex-shrink-0 items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-emerald-400/30 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'} alt="Logo Sekolah" className="w-24 h-24 object-contain drop-shadow-xl" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-800/50">
          <div>
            <p className="text-xs font-medium text-emerald-200/80">Total Siswa</p>
            <p className="text-2xl font-bold mt-0.5 text-white">{totalSiswa}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-200/80">Jumlah Rombel</p>
            <p className="text-2xl font-bold mt-0.5 text-white">{DEMO_KELAS.length} Kelas</p>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-200/80">Ruang Ujian</p>
            <p className="text-2xl font-bold mt-0.5 text-white">{totalRuang} Ruang</p>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-200/80">Status Database</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Siap Digunakan
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

          {/* Fitur 5: Cetak Nomor Meja / Label Bangku */}
          <Link 
            href="/nomor-meja"
            className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-violet-500 hover:shadow-xl transition-all duration-200"
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
              5. Cetak Nomor Meja
            </h3>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Stiker nomor meja peserta siap cetak untuk ditempel di sudut meja ujian (8 label/lembar).
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-violet-600">
              Cetak Label Meja Siswa &rarr;
            </div>
          </Link>

          {/* Fitur 6: Jadwal Mengawas Ruang */}
          <Link 
            href="/jadwal-pengawas"
            className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <span className="text-slate-400 group-hover:text-indigo-600 transition">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition">
              6. Jadwal Mengawas Ruang
            </h3>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Matriks jadwal mengawas 33 ruangan lengkap dengan legenda nama guru pengawas, siap cetak format landscape resmi.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600">
              Lihat & Cetak Jadwal Pengawas &rarr;
            </div>
          </Link>

          {/* Fitur 7: Input & Kelola Data Pengawas */}
          <Link 
            href="/pengawas"
            className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-xl transition-all duration-200 md:col-span-2"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-slate-400 group-hover:text-teal-600 transition">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-teal-600 transition">
              7. Input & Kelola Data Pengawas Ujian
            </h3>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Kelola nama guru pengawas, nomor kode, NIP, serta fitur tambah, ubah, dan hapus data pengawas ujian.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-teal-600">
              Kelola Data Pengawas &rarr;
            </div>
          </Link>

        </div>
      </div>

      {/* Data Master & Admin Quick Shortcut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Shortcut 3: Jadwal Ujian (Role Admin) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/80 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20 flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-slate-900 text-sm">Jadwal Ujian</h4>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                  Role Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Atur mata pelajaran, tanggal, alokasi waktu, serta cetak jadwal resmi.
              </p>
            </div>
          </div>
          <Link 
            href="/jadwal"
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition text-center"
          >
            Kelola Jadwal
          </Link>
        </div>

        {/* Shortcut 4: Pengaturan Sekolah (Role Admin) */}
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

