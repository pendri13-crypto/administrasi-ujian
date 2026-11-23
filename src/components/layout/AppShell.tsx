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
  CalendarCheck,
  Menu,
  X,
  ChevronRight,
  Sparkles
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

  // Jika sedang di halaman login, tampilkan langsung tanpa layout sidebar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Loading state saat cek autentikasi
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <div className="w-16 h-16 relative animate-pulse flex items-center justify-center p-2 rounded-2xl bg-slate-800/80 border border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'} 
            alt="Logo Sekolah" 
            className="w-full h-full object-contain" 
          />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Memeriksa hak akses sistem...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Kelompok Menu 1: Asesmen / Dokumen Ujian
  const menuAsesmen = [
    {
      href: '/kartu-peserta',
      label: 'Kartu Peserta',
      icon: CreditCard,
    },
    {
      href: '/nomor-meja',
      label: 'Label Meja',
      icon: Tag,
    },
    {
      href: '/nilai-kelas',
      label: 'Nilai Per Kelas',
      icon: FileSpreadsheet,
    },
    {
      href: '/nilai-mapel',
      label: 'Nilai Per Mapel',
      icon: Award,
    },
    {
      href: '/daftar-hadir',
      label: 'Daftar Hadir Ruang',
      icon: ClipboardList,
    },
  ];

  // Kelompok Menu 2: Data Master & Pengawas
  const menuMaster = [
    {
      href: '/siswa',
      label: 'Data Siswa',
      icon: Users,
    },
    {
      href: '/pengawas',
      label: 'Data Pengawas',
      icon: UserCheck,
    },
    {
      href: '/jadwal-pengawas',
      label: 'Jadwal Pengawas',
      icon: CalendarCheck,
    },
    ...(isAdmin(currentUser) ? [
      {
        href: '/ruang',
        label: 'Ruang Ujian',
        icon: DoorOpen,
      },
      {
        href: '/jadwal',
        label: 'Jadwal Ujian',
        icon: Calendar,
      },
    ] : [])
  ];

  // Konten Navigasi Sidebar (Digunakan di Desktop dan Mobile Drawer)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0b1329] text-slate-200 select-none">
      
      {/* 1. Header Sidebar: Logo & Identitas Sistem */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#090f21]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center p-1.5 flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'} 
              alt="Logo Sekolah" 
              className="w-full h-full object-contain filter drop-shadow-sm" 
            />
          </div>
          <div className="leading-tight overflow-hidden">
            <h1 className="text-sm font-black tracking-wider text-white uppercase truncate font-serif">
              SISTEM ASESMEN
            </h1>
            <p className="text-[10px] font-semibold text-amber-400/90 tracking-wide truncate mt-0.5">
              SMPN 1 RAJAPOLAH • {schoolSettings.tahunAjaran || '2026/2027'}
            </p>
          </div>
        </Link>
      </div>

      {/* 2. Daftar Menu Navigasi (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        
        {/* KELOMPOK 1: MENU UTAMA / ASESMEN */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span>Menu Utama</span>
          </div>
          {menuAsesmen.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#c59b53] text-slate-950 font-black shadow-md shadow-amber-950/20 ring-1 ring-amber-300/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400 transition-colors'}`} />
                <span className="truncate flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-950" />}
              </Link>
            );
          })}
        </div>

        {/* KELOMPOK 2: DATA MASTER */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            <span>Data Master</span>
          </div>
          {menuMaster.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#c59b53] text-slate-950 font-black shadow-md shadow-amber-950/20 ring-1 ring-amber-300/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400 transition-colors'}`} />
                <span className="truncate flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-950" />}
              </Link>
            );
          })}
        </div>

        {/* KELOMPOK 3: PENGATURAN SISTEM (ADMIN) */}
        {isAdmin(currentUser) && (
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
              <span>Pengaturan</span>
            </div>
            <Link
              href="/pengaturan"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                pathname === '/pengaturan'
                  ? 'bg-[#c59b53] text-slate-950 font-black shadow-md shadow-amber-950/20 ring-1 ring-amber-300/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Settings className={`w-4 h-4 flex-shrink-0 ${pathname === '/pengaturan' ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400 transition-colors'}`} />
              <span className="truncate flex-1">Pengaturan Sistem</span>
              {pathname === '/pengaturan' && <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-950" />}
            </Link>
          </div>
        )}

      </div>

      {/* 3. Footer Sidebar: Profil Singkat & Tombol Keluar Akun */}
      <div className="p-3 border-t border-slate-800/80 bg-[#080d1d] space-y-2">
        <div className="px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-extrabold text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              {currentUser.role === 'admin' ? 'Administrator' : currentUser.role}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl border border-rose-900/40 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-100/75 text-slate-800">
      
      {/* 1. SIDEBAR DESKTOP (Sebelah Kiri - Permanen & Sticky) */}
      <aside className="no-print hidden lg:flex flex-col w-64 xl:w-72 border-r border-slate-800/80 sticky top-0 h-screen flex-shrink-0 z-40 shadow-xl">
        {renderSidebarContent()}
      </aside>

      {/* 2. DRAWER SIDEBAR MOBILE (Muncul saat tombol menu HP diklik) */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop gelap */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          {/* Off-canvas sidebar */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent()}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-3 p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. KONTEN UTAMA (Sebelah Kanan) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar untuk Mobile (Tampil di layar < lg) */}
        <header className="no-print lg:hidden bg-[#0b1329] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white focus:outline-none"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 p-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={schoolSettings.logoSekolahUrl || '/images/logo-smpn1-rajapolah.png'} 
                alt="Logo Sekolah" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-bold text-xs truncate">Sistem Asesmen</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-400/30">
              {currentUser.role}
            </span>
          </div>
        </header>

        {/* Area Halaman Konten */}
        <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer Aplikasi (Hidden on print) */}
        <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 Sistem Assesmen SMPN 1 Rajapolah • Terintegrasi Cloud Supabase & Vercel</p>
          <p className="text-[11px] text-slate-400">
            Software Engineer <span className="font-semibold text-slate-600">Pendri Prayoga, S.Kom</span>
          </p>
        </footer>

      </div>

    </div>
  );
}
