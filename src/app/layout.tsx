import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { 
  GraduationCap, 
  CreditCard, 
  FileSpreadsheet, 
  Award, 
  ClipboardList, 
  Users,
  Tag
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sistem Administrasi Ujian Sekolah',
  description: 'Aplikasi cetak kartu ujian, daftar hadir ruang, dan rekapitulasi nilai ujian.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col">
        {/* Top Navbar (Hidden on print) */}
        <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 leading-tight">ADM UJIAN</h1>
                  <p className="text-xs text-slate-500">Sistem Administrasi & Asesmen Sekolah</p>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                <Link
                  href="/kartu-peserta"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Kartu Peserta
                </Link>
                <Link
                  href="/nomor-meja"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Tag className="w-4 h-4 text-violet-600" />
                  Label Meja
                </Link>
                <Link
                  href="/nilai-kelas"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Nilai Per Kelas
                </Link>
                <Link
                  href="/nilai-mapel"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Award className="w-4 h-4 text-amber-600" />
                  Nilai Per Mapel
                </Link>
                <Link
                  href="/daftar-hadir"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  Daftar Hadir Ruang
                </Link>
                <Link
                  href="/siswa"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Users className="w-4 h-4 text-slate-600" />
                  Data Siswa
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer (Hidden on print) */}
        <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
          <p>© 2026 Sistem Administrasi Ujian Sekolah • Siap Hosting Gratis di Vercel & Supabase</p>
        </footer>
      </body>
    </html>
  );
}
