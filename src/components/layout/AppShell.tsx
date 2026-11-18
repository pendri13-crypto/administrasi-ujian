'use client';

import { useState, useEffect, useRef } from 'react';
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
  CalendarCheck,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { getStoredUser, clearUserSession, isAdmin, AuthUser } from '@/lib/auth';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    {
      href: '/pengawas',
      shortLabel: 'Pengawas',
      label: 'Data Pengawas',
      icon: UserCheck,
      activeColor: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/25 ring-2 ring-teal-400/30',
      inactiveColor: 'text-slate-700 hover:text-teal-600 hover:bg-teal-50/80',
      iconColor: 'text-teal-600',
    },
    {
      href: '/jadwal-pengawas',
      shortLabel: 'Jadwal Pengawas',
      label: 'Jadwal Pengawas',
      icon: CalendarCheck,
      activeColor: 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/30',
      inactiveColor: 'text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80',
      iconColor: 'text-indigo-600',
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
    ] : [])
  ];

  const navRow1 = navItems.slice(0, 5); // Kartu Peserta, Label Meja, Nilai Per Kelas, Nilai Per Mapel, Daftar Hadir Ruang
  const navRow2 = navItems.slice(5);    // Data Siswa, Data Pengawas, Jadwal Pengawas, Ruang, Jadwal

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Top Navbar 2 Jajar & Lebih Lebar ke Bawah (Hidden on print) */}
      <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-50 shadow-xs">
        
        {/* Tingkat 1: Brand Sekolah & Logo (Kiri) + Profil Pengguna / Pengaturan / Keluar (Kanan) */}
        <div className="w-full px-3 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between border-b border-slate-100">
          
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'} 
                alt="Logo Sekolah" 
                className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform" 
              />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                  Sistem Assesmen
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                  {schoolSettings.namaSekolah === 'SMP NEGERI 1 RAJAPOLAH' ? 'SMPN 1 Rajapolah' : schoolSettings.namaSekolah}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 whitespace-nowrap">
                Tahun Pelajaran {schoolSettings.tahunAjaran || '2026/2027'} • Semester {schoolSettings.semester || 'Ganjil'}
              </p>
            </div>
          </Link>

          {/* User Session, Profile Dropdown & Mobile Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            
            {/* Profile Dropdown Menu */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                  profileDropdownOpen 
                    ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/20 text-blue-900' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
                aria-expanded={profileDropdownOpen}
                title="Menu Profil & Pengaturan"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-slate-800 text-[11px] sm:text-xs max-w-[120px] sm:max-w-[160px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded-md hidden md:inline">
                  {currentUser.role}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {/* Dropdown Popup */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header Info Akun */}
                  <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-xl">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">@{currentUser.username}</p>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-100 text-blue-700 uppercase">
                      {currentUser.role === 'admin' ? 'Administrator' : currentUser.role}
                    </div>
                  </div>

                  {/* Menu Items dalam Profil */}
                  <div className="p-1.5 space-y-1">
                    {isAdmin(currentUser) && (
                      <Link
                        href="/pengaturan"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          pathname === '/pengaturan'
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-violet-50 hover:text-violet-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${pathname === '/pengaturan' ? 'bg-violet-700 text-white' : 'bg-violet-100 text-violet-600'}`}>
                          <Settings className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="leading-tight">Pengaturan Sistem</p>
                          <p className={`text-[10px] font-normal ${pathname === '/pengaturan' ? 'text-violet-200' : 'text-slate-400'}`}>
                            Kop, Ujian, TTD & Logo
                          </p>
                        </div>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="leading-tight">Keluar dari Sistem</p>
                        <p className="text-[10px] font-normal text-slate-400">
                          Akhiri sesi panitia asesmen
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

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

        {/* Tingkat 2: Menu Navigasi 2 Jajar Lebar ke Bawah (Desktop) */}
        <nav className="hidden lg:block w-full px-3 sm:px-5 lg:px-6 py-2 bg-slate-50/60 border-t border-slate-100">
          <div className="space-y-1.5">
            
            {/* Jajar 1: Menu Administrasi & Dokumen Ujian (5 Menu) */}
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider w-20 flex-shrink-0 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                Ujian
              </span>
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {navRow1.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 ease-out active:scale-95 ${
                        isActive 
                          ? `${item.activeColor} shadow-xs` 
                          : `${item.inactiveColor} bg-white hover:shadow-2xs border border-slate-200/80`
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.iconColor}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Jajar 2: Menu Master Data & Pengawas (5 Menu) */}
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider w-20 flex-shrink-0 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                Master
              </span>
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {navRow2.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 ease-out active:scale-95 ${
                        isActive 
                          ? `${item.activeColor} shadow-xs` 
                          : `${item.inactiveColor} bg-white hover:shadow-2xs border border-slate-200/80`
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.iconColor}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </nav>

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

            {/* Menu Pengaturan di Mobile */}
            {isAdmin(currentUser) && (
              <Link
                href="/pengaturan"
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  pathname === '/pengaturan'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-violet-600 hover:bg-violet-50/80 bg-slate-50/50'
                }`}
              >
                <Settings className="w-4 h-4 text-violet-600" />
                <span>Pengaturan Sistem</span>
              </Link>
            )}

            {/* Tombol Logout di Mobile */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-200 mt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Sistem</span>
            </button>
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

