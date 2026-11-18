'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Hash,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Pengawas } from '@/types/database';
import { 
  getStoredPengawas, 
  saveStoredPengawas, 
  INITIAL_PENGAWAS 
} from '@/lib/pengawas-service';

export default function PengawasPage() {
  const [pengawasDataList, setPengawasDataList] = useState<Pengawas[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengawas | null>(null);
  const [formKode, setFormKode] = useState<number>(1);
  const [formNama, setFormNama] = useState<string>('');
  const [formNip, setFormNip] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const loadData = () => {
      setPengawasDataList(getStoredPengawas());
    };
    loadData();
    window.addEventListener('pengawas-updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('pengawas-updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  // Filter pengawas
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return pengawasDataList
      .filter((p) => {
        if (!term) return true;
        const matchNama = (p.nama || '').toLowerCase().includes(term);
        const matchKode = String(p.kode || '').includes(term);
        const matchNip = (p.nip || '').toLowerCase().includes(term);
        return matchNama || matchKode || matchNip;
      })
      .sort((a, b) => a.kode - b.kode);
  }, [pengawasDataList, searchTerm]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    // Cari kode tertinggi + 1
    const maxKode = pengawasDataList.reduce((max, p) => (p.kode > max ? p.kode : max), 0);
    setFormKode(maxKode + 1);
    setFormNama('');
    setFormNip('-');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Pengawas) => {
    setEditingItem(item);
    setFormKode(item.kode);
    setFormNama(item.nama);
    setFormNip(item.nip || '-');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      alert('Nama pengawas wajib diisi!');
      return;
    }

    if (editingItem) {
      // Update
      const updated = pengawasDataList.map((p) =>
        p.id === editingItem.id
          ? { ...p, kode: Number(formKode), nama: formNama.trim(), nip: formNip.trim() || '-' }
          : p
      );
      saveStoredPengawas(updated);
      setPengawasDataList(updated);
      showToast('Data pengawas berhasil diperbarui!');
    } else {
      // Tambah baru
      const newItem: Pengawas = {
        id: Date.now(),
        kode: Number(formKode),
        nama: formNama.trim(),
        nip: formNip.trim() || '-',
      };
      const updated = [...pengawasDataList, newItem];
      saveStoredPengawas(updated);
      setPengawasDataList(updated);
      showToast('Pengawas baru berhasil ditambahkan!');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: number, nama: string) => {
    if (confirm(`Yakin ingin menghapus pengawas "${nama}"?`)) {
      const updated = pengawasDataList.filter((p) => p.id !== id);
      saveStoredPengawas(updated);
      setPengawasDataList(updated);
      showToast('Pengawas berhasil dihapus!');
    }
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan data pengawas ke 37 pengawas awal sesuai SK SAS? Data perubahan Anda saat ini akan direset.')) {
      saveStoredPengawas(INITIAL_PENGAWAS);
      setPengawasDataList(INITIAL_PENGAWAS);
      showToast('Data pengawas berhasil direset ke daftar awal!');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-200 mb-1 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>Administrasi Pengawas Ujian</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Data Pengawas Ujian
              </h1>
              <p className="text-teal-100 text-sm max-w-2xl leading-relaxed">
                Kelola daftar nama, NIP, dan kode pengawas ruang untuk jadwal mengawas Asesmen / Sumatif Akhir Semester (SAS).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleResetDefault}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition shadow-sm"
                title="Reset daftar pengawas ke data default 37 guru"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Awal</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md hover:shadow-emerald-500/25 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengawas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dekorasi Background */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Statistik Cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pengawas</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{pengawasDataList.length} Guru</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rentang Kode</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {pengawasDataList.length > 0 
                ? `1 s.d ${Math.max(...pengawasDataList.map(p => p.kode))}`
                : '-'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Matrix</p>
            <p className="text-sm font-bold text-emerald-600 mt-1">Sinkron ke Jadwal</p>
          </div>
        </div>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama pengawas, kode, atau NIP..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50 focus:bg-white transition"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium self-center">
          Menampilkan <span className="font-bold text-slate-800">{filteredList.length}</span> dari {pengawasDataList.length} data
        </div>
      </div>

      {/* Tabel Data Pengawas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">Kode</th>
                <th className="py-3.5 px-4">Nama Lengkap Pengawas</th>
                <th className="py-3.5 px-4 w-60">NIP</th>
                <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada data pengawas ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Coba cari dengan kata kunci lain atau tambah pengawas baru.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((p) => (
                  <tr key={p.id} className="hover:bg-teal-50/40 transition">
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-black text-xs border border-teal-200">
                        {p.kode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.nama}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.nip && p.nip !== '-' ? p.nip : <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition"
                          title="Edit Pengawas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.nama)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Pengawas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengawas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm sm:text-base">
                {editingItem ? 'Edit Data Pengawas' : 'Tambah Pengawas Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kode Pengawas (Nomor Urut Pada Jadwal)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formKode}
                  onChange={(e) => setFormKode(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Kode ini yang akan dimasukkan ke dalam kotak ruang (1 s.d 33) pada jadwal mengawas.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Pengawas *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: H. Yusuf Nurjaman, S.Pd., M.M.Pd."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NIP (Nomor Induk Pegawai)
                </label>
                <input
                  type="text"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  placeholder="Boleh dikosongkan atau tanda strip (-)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Pengawas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
