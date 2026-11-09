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
  Tag
} from 'lucide-react';
import { DEMO_SISWA, DEMO_KELAS, DEMO_RUANG, DEMO_UJIAN } from '@/lib/demo-data';

export default function Dashboard() {
  const aktifUjian = DEMO_UJIAN[0];
  const [totalSiswa, setTotalSiswa] = useState<number>(DEMO_SISWA.length);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('adm_siswa_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTotalSiswa(parsed.length);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/30 text-blue-100 border border-blue-400/20 mb-3">
            <Calendar className="w-3.5 h-3.5" /> Agenda Aktif: {aktifUjian?.nama_ujian || 'Sumatif Akhir Semester (SAS) Ganjil'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrasi Ujian & Penilaian
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Kelola kartu peserta dengan foto siswa, cetak daftar hadir ujian per ruangan, 
            serta cetak rekapitulasi nilai per kelas dan per mata pelajaran secara otomatis.
          </p>
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
            <p className="text-2xl font-bold mt-0.5">{DEMO_RUANG.length} Ruang</p>
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

      {/* Data Master Shortcut */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Kelola Siswa & Upload Foto</h4>
            <p className="text-xs text-slate-500">
              Tambahkan siswa baru atau upload foto siswa agar otomatis muncul di Kartu Peserta.
            </p>
          </div>
        </div>
        <Link 
          href="/siswa"
          className="px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition"
        >
          Buka Data Siswa
        </Link>
      </div>
    </div>
  );
}

