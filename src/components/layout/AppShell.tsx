'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  CreditCard, 
  FileSpreadsheet, 
  Award, 
  ClipboardList, 
  Users,
  Tag,
  LogOut,
  UserCheck
} from 'lucide-react';
import { getStoredUser, clearUserSession, AuthUser } from '@/lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);

    if (pathname === '/login') {
      setIsCheckingAuth(false);
      return;
    }

    if (!user) {
      router.replace('/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      clearUserSession();
      setCurrentUser(null);
      router.replace('/login');
    }
  };

  // Jika sedang di halaman login, tampilkan langsung tanpa navbar & footer
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Jika sedang memeriksa status autentikasi dan belum ada sesi
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-16 h-16 relative animate-pulse flex items-center justify-center">
          <img 
            src="/images/logo-sekolah-3d.png" 
            alt="Logo SMPN 1 Rajapolah" 
            className="w-full h-full object-contain" 
          />
        </div>
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Memeriksa hak akses sistem...</span>
        </div>
      </div>
    );
  }

  // Jika tidak ada user dan bukan di /login (sedang dialihkan oleh router)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar (Hidden on print) */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Brand Logo & Title */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0">
                <img 
                  src="/images/logo-sekolah-3d.png" 
                  alt="Logo SMPN 1 Rajapolah" 
                  className="w-full h-full object-contain filter drop-shadow hover:scale-105 transition-transform" 
                />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">ADM UJIAN</h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Sistem Administrasi & Asesmen SMPN 1 Rajapolah
                </p>
              </div>
            </Link>

            {/* Menu Navigasi */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/kartu-peserta"
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  pathname === '/kartu-peserta' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                Kartu Peserta
              </Link>
              <Link
                href="/nomor-meja"
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  pathname === '/nomor-meja' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Tag className="w-4 h-4 text-violet-600" />
                Label Meja
              </Link>
              <Link
                href="/nilai-kelas"
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  pathname === '/nilai-kelas' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Nilai Per Kelas
              </Link>
              <Link
                href="/nilai-mapel"
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  pathname === '/nilai-mapel' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Award className="w-4 h-4 text-amber-600" />
                Nilai Per Mapel
              </Link>
              <Link
                href="/daftar-hadir"
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  pathname === '/daftar-hadir' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                Daftar Hadir Ruang
              </Link>
              <Link
                href="/siswa"
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  pathname === '/siswa' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Users className="w-4 h-4 text-slate-600" />
                Data Siswa
              </Link>
            </nav>

            {/* User Session & Logout Action */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-slate-800">{currentUser.name}</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                  {currentUser.role}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition shadow-sm"
                title="Keluar dari sistem"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer (Hidden on print) */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 Sistem Administrasi & Asesmen SMPN 1 Rajapolah • Siap Hosting Gratis di Vercel & Supabase</p>
      </footer>
    </div>
  );
}

