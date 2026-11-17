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
  UserCheck,
  Settings,
  DoorOpen,
  Calendar,
  Menu,
  X
} from 'lucide-react';
import { getStoredUser, clearUserSession, isAdmin, AuthUser } from '@/lib/auth';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateSettings = () => {
      setSchoolSettings(getStoredSchoolSettings());
    };
    updateSettings();
    window.addEventListener('school-settings-updated', updateSettings);
    return () => window.removeEventListener('school-settings-updated', updateSettings);
  }, []);

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'} 
            alt="Logo Sekolah" 
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

  const navItems = [
    {
      href: '/kartu-peserta',
      label: 'Kartu Peserta',
      icon: CreditCard,
      activeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30',
      inactiveColor: 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/80',
      iconColor: 'text-blue-600',
    },
    {
      href: '/nomor-meja',
      label: 'Label Meja',
      icon: Tag,
      activeColor: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/30',
      inactiveColor: 'text-slate-700 hover:text-purple-600 hover:bg-purple-50/80',
      iconColor: 'text-purple-600',
    },
    {
      href: '/nilai-kelas',
      shortLabel: 'Nilai Kelas',
      label: 'Nilai Per Kelas',
      icon: FileSpreadsheet,
      activeColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/30',
      inactiveColor: 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/80',
      iconColor: 'text-emerald-600',
    },
    {
      href: '/nilai-mapel',
      shortLabel: 'Nilai Mapel',
      label: 'Nilai Per Mapel',
      icon: Award,
      activeColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/30',
      inactiveColor: 'text-slate-700 hover:text-amber-600 hover:bg-amber-50/80',
      iconColor: 'text-amber-600',
    },
    {
      href: '/daftar-hadir',
      shortLabel: 'Daftar Hadir',
      label: 'Daftar Hadir Ruang',
      icon: ClipboardList,
      activeColor: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/30',
      inactiveColor: 'text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/80',
      iconColor: 'text-cyan-600',
    },
    {
      href: '/siswa',
      shortLabel: 'Data Siswa',
      label: 'Data Siswa',
      icon: Users,
      activeColor: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400/30',
      inactiveColor: 'text-slate-700 hover:text-rose-600 hover:bg-rose-50/80',
      iconColor: 'text-rose-600',
    },
    ...(isAdmin(currentUser) ? [
      {
        href: '/ruang',
        label: 'Ruang',
        icon: DoorOpen,
        activeColor: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/25 ring-2 ring-teal-400/30',
        inactiveColor: 'text-slate-700 hover:text-teal-600 hover:bg-teal-50/80',
        iconColor: 'text-teal-600',
      },
      {
        href: '/jadwal',
        label: 'Jadwal',
        icon: Calendar,
        activeColor: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-400/30',
        inactiveColor: 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/80',
        iconColor: 'text-orange-600',
      },
      {
        href: '/pengaturan',
        label: 'Pengaturan',
        icon: Settings,
        activeColor: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25 ring-2 ring-violet-400/30',
        inactiveColor: 'text-slate-700 hover:text-violet-600 hover:bg-violet-50/80',
        iconColor: 'text-violet-600',
      },
    ] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Top Navbar Full Width, Tanpa Scrollbar, Semua 9 Menu Selalu Muncul (Hidden on print) */}
      <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="w-full px-2 sm:px-4 xl:px-6">
          <div className="flex justify-between h-14 sm:h-16 items-center gap-1.5">
            
            {/* Brand Logo & Title */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'} 
                  alt="Logo Sekolah" 
                  className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform" 
                />
              </div>
              <div className="hidden sm:block leading-tight">
                <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                  Sistem Assesmen
                </h1>
                <p className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                  SMPN 1 Rajapolah
                </p>
              </div>
            </Link>

            {/* Menu Navigasi Desktop: Semua 9 Menu Muncul Utuh Tanpa Scrollbar & Tanpa Terpotong */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 flex-shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2 xl:px-2.5 2xl:px-3 py-1.5 text-[11px] xl:text-[11.5px] 2xl:text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 ease-out transform active:scale-95 ${
                      isActive 
                        ? `${item.activeColor} scale-[1.02]` 
                        : `${item.inactiveColor} hover:-translate-y-0.5 hover:shadow-xs`
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-colors ${isActive ? 'text-white' : item.iconColor}`} />
                    <span>
                      {item.shortLabel ? (
                        <>
                          <span className="2xl:hidden">{item.shortLabel}</span>
                          <span className="hidden 2xl:inline">{item.label}</span>
                        </>
                      ) : (
                        item.label
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* User Session & Logout Action */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="font-bold text-slate-800 text-[11px] hidden xl:inline max-w-[120px] truncate">{currentUser.name}</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded-md">
                  {currentUser.role}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all shadow-xs whitespace-nowrap"
                title="Keluar dari sistem"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-5 space-y-1.5 shadow-xl animate-in slide-in-from-top duration-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    isActive 
                      ? item.activeColor 
                      : `${item.inactiveColor} bg-slate-50/50`
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.iconColor}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer (Hidden on print) */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 Sistem Assesmen SMPN 1 Rajapolah • Terintegrasi Cloud Supabase & Vercel</p>
      </footer>
    </div>
  );
}

