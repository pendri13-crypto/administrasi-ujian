'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  RotateCcw, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  CalendarCheck, 
  Settings2,
  Info
} from 'lucide-react';
import { JadwalPengawasSession, Pengawas } from '@/types/database';
import { 
  getStoredPengawas, 
  getStoredJadwalPengawas, 
  saveStoredJadwalPengawas, 
  INITIAL_JADWAL_PENGAWAS 
} from '@/lib/pengawas-service';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';
import { AutoTrimmedLogo } from '@/components/AutoTrimmedLogo';

export default function JadwalPengawasPage() {
  const [jadwalList, setJadwalList] = useState<JadwalPengawasSession[]>([]);
  const [pengawasDataList, setPengawasDataList] = useState<Pengawas[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Edit Sesi (Hari, Waktu, Mapel)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<JadwalPengawasSession | null>(null);
  const [formHari, setFormHari] = useState('');
  const [formWaktu, setFormWaktu] = useState('');
  const [formMapel, setFormMapel] = useState('');

  // Modal Edit Pengawas Per Ruang
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ sessionId: number; ruangNum: number; currentKode: number } | null>(null);
  const [cellKodeInput, setCellKodeInput] = useState<number>(1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const loadAll = () => {
      setJadwalList(getStoredJadwalPengawas());
      setPengawasDataList(getStoredPengawas());
      setSchoolSettings(getStoredSchoolSettings());
    };
    loadAll();

    window.addEventListener('jadwal-pengawas-updated', loadAll);
    window.addEventListener('pengawas-updated', loadAll);
    window.addEventListener('school-settings-updated', loadAll);
    window.addEventListener('storage', loadAll);

    return () => {
      window.removeEventListener('jadwal-pengawas-updated', loadAll);
      window.removeEventListener('pengawas-updated', loadAll);
      window.removeEventListener('school-settings-updated', loadAll);
      window.removeEventListener('storage', loadAll);
    };
  }, []);

  // Map pengawas berdasarkan kode untuk tooltip / info
  const pengawasMap = useMemo(() => {
    const map = new Map<number, Pengawas>();
    pengawasDataList.forEach((p) => map.set(p.kode, p));
    return map;
  }, [pengawasDataList]);

  // Handle Edit Sel Cepat (Pilih Pengawas untuk Ruang Tertentu pada Sesi Tertentu)
  const handleOpenCellEdit = (sessionId: number, ruangNum: number, currentKode: number) => {
    setSelectedCell({ sessionId, ruangNum, currentKode });
    setCellKodeInput(currentKode || 1);
    setIsCellModalOpen(true);
  };

  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;

    const updated = jadwalList.map((s) => {
      if (s.id === selectedCell.sessionId) {
        return {
          ...s,
          ruang_pengawas: {
            ...s.ruang_pengawas,
            [selectedCell.ruangNum]: Number(cellKodeInput),
          },
        };
      }
      return s;
    });

    saveStoredJadwalPengawas(updated);
    setJadwalList(updated);
    setIsCellModalOpen(false);
    showToast(`Pengawas Ruang ${selectedCell.ruangNum} diubah ke Kode ${cellKodeInput}!`);
  };

  // Handle Tambah / Edit Sesi
  const handleOpenAddSession = () => {
    setEditingSession(null);
    setFormHari('Jumat, 4 Desember 2026');
    setFormWaktu('08.00 – 09.30');
    setFormMapel('');
    setIsSessionModalOpen(true);
  };

  const handleOpenEditSession = (session: JadwalPengawasSession) => {
    setEditingSession(session);
    setFormHari(session.hari_tanggal);
    setFormWaktu(session.waktu);
    setFormMapel(session.mapel);
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHari.trim() || !formMapel.trim()) {
      alert('Hari/Tanggal dan Mata Pelajaran wajib diisi!');
      return;
    }

    if (editingSession) {
      const updated = jadwalList.map((s) =>
        s.id === editingSession.id
          ? { ...s, hari_tanggal: formHari.trim(), waktu: formWaktu.trim(), mapel: formMapel.trim() }
          : s
      );
      saveStoredJadwalPengawas(updated);
      setJadwalList(updated);
      showToast('Sesi jadwal berhasil diperbarui!');
    } else {
      // Default salin mapping ruang dari sesi sebelumnya
      const prevMap = jadwalList[jadwalList.length - 1]?.ruang_pengawas || {};
      const newSession: JadwalPengawasSession = {
        id: Date.now(),
        hari_tanggal: formHari.trim(),
        waktu: formWaktu.trim() || '08.00 – 09.30',
        mapel: formMapel.trim(),
        ruang_pengawas: { ...prevMap },
      };
      const updated = [...jadwalList, newSession];
      saveStoredJadwalPengawas(updated);
      setJadwalList(updated);
      showToast('Sesi jadwal baru berhasil ditambahkan!');
    }

    setIsSessionModalOpen(false);
  };

  const handleDeleteSession = (id: number, mapel: string) => {
    if (confirm(`Yakin ingin menghapus sesi mapel "${mapel}" dari jadwal?`)) {
      const updated = jadwalList.filter((s) => s.id !== id);
      saveStoredJadwalPengawas(updated);
      setJadwalList(updated);
      showToast('Sesi berhasil dihapus!');
    }
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan matriks jadwal mengawas ke format default 8 sesi (Senin-Kamis)?')) {
      saveStoredJadwalPengawas(INITIAL_JADWAL_PENGAWAS);
      setJadwalList(INITIAL_JADWAL_PENGAWAS);
      showToast('Jadwal pengawas berhasil direset ke format awal!');
    }
  };

  // Kelompokkan pengawas untuk bagian legenda (1-15, 16-30, 31-37)
  const sortedPengawas = useMemo(() => {
    return [...pengawasDataList].sort((a, b) => a.kode - b.kode);
  }, [pengawasDataList]);

  const col1 = sortedPengawas.slice(0, 15);
  const col2 = sortedPengawas.slice(15, 30);
  const col3 = sortedPengawas.slice(30);

  return (
    <div className="space-y-6 max-w-[100vw] mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Toolbar Atas (Sembunyi saat dicetak) */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Matriks Jadwal Mengawas 33 Ruangan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Jadwal Mengawas SAS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik nomor kode pada sel tabel untuk mengubah pengawas ruang secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-300"
            title="Reset ke Matriks Default Sesuai SK"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Awal</span>
          </button>

          <button
            onClick={handleOpenAddSession}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded-xl transition border border-teal-300"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sesi</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Jadwal Pengawas</span>
          </button>
        </div>
      </div>

      {/* Dynamic Print CSS untuk Format Landscape Kertas Penuh */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: landscape;
            margin: 6mm 8mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />

      {/* Lembar Dokumen Siap Cetak Sesuai PDF Referensi */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        {/* KOP Dokumen */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-1">
          {/* Logo Pemda Tasikmalaya */}
          <div className="w-[60px] h-[65px] flex-shrink-0 flex items-center justify-center">
            <AutoTrimmedLogo
              src={schoolSettings.logoPemdaUrl || schoolSettings.logoTasikmalayaUrl}
              fallbackSrc="/images/logo-tasikmalaya.png"
              alt="Logo Pemda"
              className="w-full h-full object-contain filter drop-shadow-sm select-none"
            />
          </div>

          {/* Teks Judul Tengah */}
          <div className="flex-1 text-center font-bold text-slate-950 space-y-0.5">
            <h1 className="text-sm sm:text-base md:text-lg font-black tracking-wide uppercase">
              JADWAL MENGAWAS {schoolSettings.namaUjian || 'SUMATIF AKHIR SEMESTER'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base font-black tracking-wide uppercase">
              {schoolSettings.namaSekolah === 'SMP NEGERI 1 RAJAPOLAH' ? 'SMPN 1 RAJAPOLAH' : (schoolSettings.namaSekolah || 'SMPN 1 RAJAPOLAH')}
            </p>
            <p className="text-xs sm:text-sm font-black tracking-wide uppercase text-slate-800">
              TAHUN PELAJARAN {schoolSettings.tahunAjaran || '2026/2027'}
            </p>
          </div>

          {/* Logo Sekolah (Kanan) Menyesuaikan KOP */}
          <div className="w-[60px] h-[65px] flex-shrink-0 flex items-center justify-center">
            <AutoTrimmedLogo
              src={schoolSettings.logoSekolahUrl}
              fallbackSrc="/images/logo-smpn1-rajapolah.png"
              alt="Logo Sekolah"
              className="w-full h-full object-contain filter drop-shadow-sm select-none"
            />
          </div>
        </div>

        {/* Tabel Matriks Jadwal Mengawas 33 Ruangan */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-slate-950 text-[10px] leading-tight text-center">
            <thead>
              {/* Baris 1 Header */}
              <tr className="bg-[#fce5cd] print:bg-[#fce5cd] text-slate-950 font-bold border-b border-slate-950">
                <th rowSpan={2} className="border border-slate-950 px-2 py-1.5 w-28 text-center">
                  Hari/Tanggal
                </th>
                <th rowSpan={2} className="border border-slate-950 px-1 py-1.5 w-24 text-center">
                  Waktu
                </th>
                <th rowSpan={2} className="border border-slate-950 px-2 py-1.5 w-32 text-center">
                  Mata Pelajaran
                </th>
                <th colSpan={33} className="border border-slate-950 py-1 uppercase tracking-wider text-xs">
                  RUANG
                </th>
                <th rowSpan={2} className="print:hidden border border-slate-950 px-1 py-1.5 w-16 text-center">
                  Aksi
                </th>
              </tr>

              {/* Baris 2 Nomor Ruangan 1 s.d 33 */}
              <tr className="bg-[#cfe2f3] print:bg-[#cfe2f3] text-slate-950 font-black border-b-2 border-slate-950">
                {Array.from({ length: 33 }, (_, i) => i + 1).map((rNum) => (
                  <th key={rNum} className="border border-slate-950 py-1 min-w-[20px] text-center font-bold">
                    {rNum}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {jadwalList.map((session, sIdx) => {
                // Periksa apakah baris ini adalah awal dari hari yang sama untuk rowSpan
                const isFirstOfDate = sIdx === 0 || jadwalList[sIdx - 1].hari_tanggal !== session.hari_tanggal;
                const sameDateCount = jadwalList.filter((s) => s.hari_tanggal === session.hari_tanggal).length;

                return (
                  <tr key={session.id} className="hover:bg-slate-50 transition border-b border-slate-950">
                    {/* Hari/Tanggal dengan rowSpan otomatis jika harinya sama */}
                    {isFirstOfDate && (
                      <td 
                        rowSpan={sameDateCount} 
                        className="border border-slate-950 px-1.5 py-1 font-semibold text-slate-900 text-left align-middle bg-white"
                      >
                        {session.hari_tanggal}
                      </td>
                    )}

                    {/* Waktu */}
                    <td className="border border-slate-950 px-1 py-1 font-medium text-slate-900 whitespace-nowrap bg-white">
                      {session.waktu}
                    </td>

                    {/* Mata Pelajaran */}
                    <td className="border border-slate-950 px-1.5 py-1 font-bold text-slate-950 text-left bg-white whitespace-nowrap">
                      {session.mapel}
                    </td>

                    {/* Sel Kode Pengawas Ruang 1 s.d 33 */}
                    {Array.from({ length: 33 }, (_, i) => i + 1).map((rNum) => {
                      const kode = session.ruang_pengawas?.[rNum];
                      const teacher = kode ? pengawasMap.get(kode) : null;

                      return (
                        <td
                          key={rNum}
                          onClick={() => handleOpenCellEdit(session.id, rNum, kode || 1)}
                          title={teacher ? `Ruang ${rNum}: [${kode}] ${teacher.nama} (Klik untuk ganti)` : `Ruang ${rNum} (Klik untuk isi)`}
                          className="border border-slate-950 py-0.5 px-0 text-center font-bold text-slate-950 cursor-pointer hover:bg-amber-100 print:cursor-default"
                        >
                          {kode || '-'}
                        </td>
                      );
                    })}

                    {/* Tombol Aksi (Hanya layar, sembunyi saat dicetak) */}
                    <td className="print:hidden border border-slate-950 px-1 py-0.5 text-center bg-slate-50">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditSession(session)}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-200"
                          title="Edit Info Sesi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id, session.mapel)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Hapus Sesi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Petunjuk Penggunaan Cepat (Hanya Layar) */}
        <div className="print:hidden mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2 text-[11px] text-indigo-900 font-medium">
          <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            <strong>Tips:</strong> Klik angka pada kotak ruang mana saja pada tabel di atas untuk mengganti nama/kode pengawas yang bertugas di ruangan tersebut.
          </span>
        </div>

        {/* Bagian Bawah: Legenda Daftar Kode Pengawas & Tanda Tangan Kepala Sekolah */}
        <div className="mt-4 pt-2 text-[9.5px] leading-snug text-slate-950">
          <div className="grid grid-cols-12 gap-2 items-start">
            
            {/* Kolom 1 (Kode 1 s.d 15) */}
            <div className="col-span-3 space-y-0.5">
              {col1.map((p) => (
                <div key={p.id} className="flex gap-1.5">
                  <span className="w-4 font-bold text-right flex-shrink-0">{p.kode}</span>
                  <span className="truncate">{p.nama}</span>
                </div>
              ))}
            </div>

            {/* Kolom 2 (Kode 16 s.d 30) */}
            <div className="col-span-3 space-y-0.5">
              {col2.map((p) => (
                <div key={p.id} className="flex gap-1.5">
                  <span className="w-5 font-bold text-right flex-shrink-0">{p.kode}</span>
                  <span className="truncate">{p.nama}</span>
                </div>
              ))}
            </div>

            {/* Kolom 3 (Kode 31 s.d 37) */}
            <div className="col-span-3 space-y-0.5">
              {col3.map((p) => (
                <div key={p.id} className="flex gap-1.5">
                  <span className="w-5 font-bold text-right flex-shrink-0">{p.kode}</span>
                  <span className="truncate">{p.nama}</span>
                </div>
              ))}
            </div>

            {/* Kolom 4: Tanda Tangan Kepala Sekolah */}
            <div className="col-span-3 text-center space-y-0.5 pl-2">
              <p className="font-medium">
                {schoolSettings.kotaTtd || 'Rajapolah'}, {schoolSettings.tanggalTtd || 'November 2026'}
              </p>
              <p className="font-semibold">{schoolSettings.jabatanKepsek || 'Kepala SMPN 1 Rajapolah'}</p>
              
              {/* Gambar Tanda Tangan / Ruang Kosong */}
              <div className="h-14 flex items-center justify-center my-0.5">
                {schoolSettings.ttdKepsekUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={schoolSettings.ttdKepsekUrl}
                    alt="Tanda Tangan"
                    className="max-h-14 object-contain filter contrast-125"
                  />
                ) : (
                  <div className="h-14" />
                )}
              </div>

              <p className="font-bold underline uppercase tracking-wide">
                {schoolSettings.namaKepsek || 'H. UCU KARNI, M.Pd'}
              </p>
              <p className="text-[8.5px] font-mono text-slate-700">
                NIP {schoolSettings.nipKepsek || '19671116 199203 1 005'}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Modal Edit Kode Pengawas Per Ruang */}
      {isCellModalOpen && selectedCell && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">Ganti Pengawas Ruang {selectedCell.ruangNum}</h3>
                <p className="text-[10px] text-indigo-100">
                  {jadwalList.find((s) => s.id === selectedCell.sessionId)?.mapel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCellModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Guru / Pengawas:
                </label>
                <select
                  value={cellKodeInput}
                  onChange={(e) => setCellKodeInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                >
                  {sortedPengawas.map((p) => (
                    <option key={p.id} value={p.kode}>
                      [{p.kode}] {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Atau Ketik Langsung Nomor Kode:
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={cellKodeInput}
                  onChange={(e) => setCellKodeInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black text-center text-sm"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCellModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Simpan Sel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Sesi */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm sm:text-base">
                {editingSession ? 'Edit Sesi Jadwal' : 'Tambah Sesi Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsSessionModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hari / Tanggal *
                </label>
                <input
                  type="text"
                  required
                  value={formHari}
                  onChange={(e) => setFormHari(e.target.value)}
                  placeholder="Contoh: Senin, 30 November 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pukul / Waktu *
                </label>
                <input
                  type="text"
                  required
                  value={formWaktu}
                  onChange={(e) => setFormWaktu(e.target.value)}
                  placeholder="Contoh: 08.00 – 09.30"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mata Pelajaran *
                </label>
                <input
                  type="text"
                  required
                  value={formMapel}
                  onChange={(e) => setFormMapel(e.target.value)}
                  placeholder="Contoh: Matematika"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingSession ? 'Simpan Perubahan' : 'Tambah Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
