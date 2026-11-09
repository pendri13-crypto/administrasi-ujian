import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'ADM UJIAN - SMPN 1 Rajapolah',
  description: 'Sistem Administrasi & Asesmen SMPN 1 Rajapolah: cetak kartu peserta, label meja, daftar hadir, dan rekapitulasi nilai ujian.',
  icons: {
    icon: '/images/logo-sekolah-3d.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
