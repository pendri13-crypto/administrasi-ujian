'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DoorOpen, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Printer, 
  ShieldAlert, 
  Sparkles, 
  Building2, 
  Eye, 
  X, 
  Save, 
  RotateCcw,
  ArrowRight,
  Sliders,
  ArrowLeftRight,
  LayoutGrid,
  FileText,
  Table,
  Check,
  Tag,
  CreditCard,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Ruang, Siswa, Kelas, SplitGroupRule, PesertaUjian } from '@/types/database';
import { DEMO_KELAS, DEMO_RUANG, generatePesertaFromSiswa } from '@/lib/demo-data';
import { 
  getStoredRuang, 
  saveStoredRuang, 
  fetchRuangFromCloud, 
  pushRuangToCloud, 
  deleteRuangFromCloud,
  fetchSiswaFromCloud,
  getStoredSplitRules,
  saveStoredSplitRules
} from '@/lib/data-service';
import { getStoredUser, isAdmin } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SchoolSettings, DEFAULT_SCHOOL_SETTINGS, getStoredSchoolSettings } from '@/lib/school-settings';

export default function KelolaRuangPage() {
  const router = useRouter();

  // Authentication & Security
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Active Tab: 'mapping' (Fitur Split & Silang) atau 'master' (Daftar Ruang)
  const [activeTab, setActiveTab] = useState<'mapping' | 'master'>('mapping');

  // Data States
  const [ruangList, setRuangList] = useState<Ruang[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);

  // Split Rules State
  const [splitRules, setSplitRules] = useState<SplitGroupRule[]>([]);
  const [selectedPreviewRuangId, setSelectedPreviewRuangId] = useState<number>(1);
  const [filterKelasId, setFilterKelasId] = useState<string>('all');

  // Cloud & Sync States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Form State (Tambah / Edit Ruang Master)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRuang, setEditingRuang] = useState<Ruang | null>(null);
  const [formKode, setFormKode] = useState<string>('');
  const [formNama, setFormNama] = useState<string>('');
  const [formKapasitas, setFormKapasitas] = useState<number>(36);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmRuang, setDeleteConfirmRuang] = useState<Ruang | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Verifikasi Hak Akses Role Admin
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin(user)) {
      setIsAuthorized(false);
      setIsLoadingAuth(false);
      return;
    }
    setIsAuthorized(true);
    setIsLoadingAuth(false);
  }, [router]);

  // Load School Settings
  useEffect(() => {
    setSchoolSettings(getStoredSchoolSettings());
    const handleSettingsUpdate = () => setSchoolSettings(getStoredSchoolSettings());
    window.addEventListener('school-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('school-settings-updated', handleSettingsUpdate);
  }, []);

  // Load Data Ruang, Siswa & Split Rules
  useEffect(() => {
    const initialRuang = getStoredRuang();
    setRuangList(initialRuang);

    const savedRules = getStoredSplitRules();
    if (savedRules && savedRules.length > 0) {
      setSplitRules(savedRules);
    } else {
      // Inisialisasi template split rules default jika belum ada
      setSplitRules(initDefaultSplitRules(DEMO_KELAS));
    }

    // Ambil data siswa
    try {
      const savedSiswa = localStorage.getItem('adm_siswa_data');
      if (savedSiswa) {
        const parsed: Siswa[] = JSON.parse(savedSiswa);
        if (Array.isArray(parsed)) {
          const enriched = parsed.map(s => {
            if (!s.kelas && s.kelas_id) {
              const k = DEMO_KELAS.find(c => c.id === Number(s.kelas_id));
              if (k) return { ...s, kelas: k };
            }
            return s;
          });
          setSiswaList(enriched);
        }
      } else if (isSupabaseConfigured) {
        fetchSiswaFromCloud().then(data => {
          if (data) setSiswaList(data);
        });
      }
    } catch (e) {
      console.error(e);
    }

    // Jika Supabase aktif, coba sinkron data ruang dari Supabase
    if (isSupabaseConfigured) {
      fetchRuangFromCloud().then(cloudRuang => {
        if (cloudRuang && cloudRuang.length > 0) {
          setRuangList(cloudRuang);
        }
      });
    }

    const handleRuangUpdate = () => {
      setRuangList(getStoredRuang());
    };
    window.addEventListener('ruang-data-updated', handleRuangUpdate);
    return () => window.removeEventListener('ruang-data-updated', handleRuangUpdate);
  }, []);

  // Inisialisasi aturan split bawaan: Membagi setiap kelas menjadi 2 paruh (1-17 dan 18-34)
  function initDefaultSplitRules(kelasList: Kelas[]): SplitGroupRule[] {
    const rules: SplitGroupRule[] = [];
    kelasList.forEach((k) => {
      // Paruh 1: No. 1 - 17 (Default Kursi Kiri, Ruang sesuai ID kelas)
      rules.push({
        id: `rule-${k.id}-part1`,
        kelas_id: k.id,
        label: `${k.nama_kelas} (No. 1-17)`,
        start_urut: 1,
        end_urut: 17,
        target_ruang_id: k.id,
        posisi: 'kiri',
        start_meja: 1,
      });

      // Paruh 2: No. 18 - 34 (Default Kursi Kiri, Ruang berikutnya atau sama)
      rules.push({
        id: `rule-${k.id}-part2`,
        kelas_id: k.id,
        label: `${k.nama_kelas} (No. 18-34)`,
        start_urut: 18,
        end_urut: 34,
        target_ruang_id: k.id + 1 <= kelasList.length ? k.id + 1 : k.id,
        posisi: 'kiri',
        start_meja: 1,
      });
    });
    return rules;
  }

  // Hitung Peserta Ujian berdasarkan split rules aktif
  const pesertaListGenerated: PesertaUjian[] = useMemo(() => {
    return generatePesertaFromSiswa(siswaList, ruangList, splitRules);
  }, [siswaList, ruangList, splitRules]);

  // Kelompokkan siswa per kelas untuk menghitung jumlah siswa per kelas
  const siswaPerKelas = useMemo(() => {
    const map: Record<number, Siswa[]> = {};
    siswaList.forEach(s => {
      const kId = s.kelas_id || 1;
      if (!map[kId]) map[kId] = [];
      map[kId].push(s);
    });
    return map;
  }, [siswaList]);

  // Daftar Peserta di Ruang yang dipilih untuk Denah Pratinjau
  const pesertaInPreviewRuang = useMemo(() => {
    return pesertaListGenerated
      .filter(p => p.ruang_id === selectedPreviewRuangId)
      .sort((a, b) => (a.no_meja || 0) - (b.no_meja || 0));
  }, [pesertaListGenerated, selectedPreviewRuangId]);

  const kursiKiriPeserta = useMemo(() => {
    return pesertaInPreviewRuang.filter(p => (p.no_meja || 0) <= 17);
  }, [pesertaInPreviewRuang]);

  const kursiKananPeserta = useMemo(() => {
    return pesertaInPreviewRuang.filter(p => (p.no_meja || 0) >= 18);
  }, [pesertaInPreviewRuang]);

  // Statistik Ringkas
  const totalKapasitas = useMemo(() => {
    return ruangList.reduce((acc, r) => acc + (Number(r.kapasitas) || 0), 0);
  }, [ruangList]);

  const totalSiswaTerisi = useMemo(() => {
    return siswaList.length;
  }, [siswaList]);

  // Handler: Ubah Nomor Ruang Tujuan secara manual
  const handleUpdateTargetRuang = (ruleId: string, newTargetRuangId: number) => {
    setSplitRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return { ...rule, target_ruang_id: Number(newTargetRuangId) || 1 };
      }
      return rule;
    }));
  };

  // Handler: Ubah Posisi Kursi (Kiri / Kanan)
  const handleUpdatePosisi = (ruleId: string, newPosisi: 'kiri' | 'kanan') => {
    setSplitRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return { 
          ...rule, 
          posisi: newPosisi,
          start_meja: newPosisi === 'kanan' ? 18 : 1
        };
      }
      return rule;
    }));
  };

  // Handler: Ubah Rentang Nomor Urut Siswa (contoh 1-17 atau 18-34)
  const handleUpdateRentang = (ruleId: string, field: 'start_urut' | 'end_urut', val: number) => {
    setSplitRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return { ...rule, [field]: Number(val) || 1 };
      }
      return rule;
    }));
  };

  // Simpan Aturan Split ke localStorage & Sinkronkan
  const handleSaveSplitRules = () => {
    saveStoredSplitRules(splitRules);
    showToast('Aturan pembagian & split ruang berhasil disimpan dan diterapkan ke seluruh modul!');
  };

  // Preset Otomatis: Atur Pola Silang Standar (Sesuai contoh kasus: Tingkat 7 silang dengan Tingkat 8)
  // Contoh: Ruang 1 Kiri = Kelas 1 (VII-A No 1-17), Ruang 1 Kanan = Kelas 12 (VIII-A No 1-17)
  //         Ruang 2 Kiri = Kelas 1 (VII-A No 18-34), Ruang 2 Kanan = Kelas 12 (VIII-A No 18-34)
  const handleAutoCrossPreset = () => {
    if (!confirm('Terapkan Pola Silang Otomatis?\n\nRuang 1:\n- Kiri: Kelas VII-A (No. 1-17)\n- Kanan: Kelas VIII-A / Ruang 12 (No. 1-17)\n\nRuang 2:\n- Kiri: Kelas VII-A (No. 18-34)\n- Kanan: Kelas VIII-A / Ruang 12 (No. 18-34)\n\ndan seterusnya untuk seluruh 11 rombel tingkat 7 & 8.')) {
      return;
    }

    const newRules: SplitGroupRule[] = [];
    const numPairs = 11; // 11 Kelas Tingkat 7 (ID 1-11) dan 11 Kelas Tingkat 8 (ID 12-22)

    for (let i = 0; i < numPairs; i++) {
      const kelas7Id = i + 1;  // ID 1 s/d 11
      const kelas8Id = i + 12; // ID 12 s/d 22

      const roomA = (i * 2) + 1; // Ruang 1, 3, 5, 7, ...
      const roomB = (i * 2) + 2; // Ruang 2, 4, 6, 8, ...

      const k7 = DEMO_KELAS.find(k => k.id === kelas7Id);
      const k8 = DEMO_KELAS.find(k => k.id === kelas8Id);

      // Kelas VII-A Part 1 (No. 1 - 17) -> Ruang 1 Kiri (Meja 1-17)
      newRules.push({
        id: `rule-${kelas7Id}-part1`,
        kelas_id: kelas7Id,
        label: `${k7?.nama_kelas || `VII-${i+1}`} (No. 1-17)`,
        start_urut: 1,
        end_urut: 17,
        target_ruang_id: roomA,
        posisi: 'kiri',
        start_meja: 1,
      });

      // Kelas VII-A Part 2 (No. 18 - 34) -> Ruang 2 Kiri (Meja 1-17)
      newRules.push({
        id: `rule-${kelas7Id}-part2`,
        kelas_id: kelas7Id,
        label: `${k7?.nama_kelas || `VII-${i+1}`} (No. 18-34)`,
        start_urut: 18,
        end_urut: 34,
        target_ruang_id: roomB,
        posisi: 'kiri',
        start_meja: 1,
      });

      // Kelas VIII-A Part 1 (No. 1 - 17) -> Ruang 1 Kanan (Meja 18-34)
      newRules.push({
        id: `rule-${kelas8Id}-part1`,
        kelas_id: kelas8Id,
        label: `${k8?.nama_kelas || `VIII-${i+1}`} (No. 1-17)`,
        start_urut: 1,
        end_urut: 17,
        target_ruang_id: roomA,
        posisi: 'kanan',
        start_meja: 18,
      });

      // Kelas VIII-A Part 2 (No. 18 - 34) -> Ruang 2 Kanan (Meja 18-34)
      newRules.push({
        id: `rule-${kelas8Id}-part2`,
        kelas_id: kelas8Id,
        label: `${k8?.nama_kelas || `VIII-${i+1}`} (No. 18-34)`,
        start_urut: 18,
        end_urut: 34,
        target_ruang_id: roomB,
        posisi: 'kanan',
        start_meja: 18,
      });
    }

    // Kelas Tingkat 9 (ID 23 s/d 33) jika ada, tetap dialokasikan
    for (let i = 22; i < DEMO_KELAS.length; i++) {
      const k = DEMO_KELAS[i];
      const targetRoom = 23 + (i - 22);
      newRules.push({
        id: `rule-${k.id}-part1`,
        kelas_id: k.id,
        label: `${k.nama_kelas} (No. 1-17)`,
        start_urut: 1,
        end_urut: 17,
        target_ruang_id: targetRoom,
        posisi: 'kiri',
        start_meja: 1,
      });
      newRules.push({
        id: `rule-${k.id}-part2`,
        kelas_id: k.id,
        label: `${k.nama_kelas} (No. 18-34)`,
        start_urut: 18,
        end_urut: 34,
        target_ruang_id: targetRoom,
        posisi: 'kanan',
        start_meja: 18,
      });
    }

    setSplitRules(newRules);
    saveStoredSplitRules(newRules);
    showToast('Pola silang otomatis berhasil diterapkan!');
  };

  // Reset Aturan Split ke Default (1 Kelas = 1 Ruang)
  const handleResetToStandard = () => {
    if (!confirm('Kembalikan aturan ke pembagian standar (1 kelas = 1 ruang)?')) return;
    const defaultRules = initDefaultSplitRules(DEMO_KELAS);
    // Atur target ruang sama dengan id kelas
    defaultRules.forEach(r => {
      r.target_ruang_id = r.kelas_id;
      r.posisi = r.start_urut === 1 ? 'kiri' : 'kanan';
      r.start_meja = r.start_urut === 1 ? 1 : 18;
    });
    setSplitRules(defaultRules);
    saveStoredSplitRules(defaultRules);
    showToast('Aturan direset ke standar (1 kelas = 1 ruang).');
  };

  // Helper: Mendapatkan Nama Kelas Siswa secara aman (fallback dari kelas_id / DEMO_KELAS)
  const getNamaKelas = (p?: PesertaUjian | null): string => {
    if (!p || !p.siswa) return '-';
    if (p.siswa.kelas?.nama_kelas) return p.siswa.kelas.nama_kelas;
    if ((p.siswa as any).nama_kelas) return (p.siswa as any).nama_kelas;
    if ((p.siswa as any).kelas_nama) return (p.siswa as any).kelas_nama;
    const kId = Number(p.siswa.kelas_id);
    if (kId) {
      const k = DEMO_KELAS.find(c => c.id === kId);
      if (k) return k.nama_kelas;
      return `Kelas ${kId}`;
    }
    return '-';
  };

  // Helper: Membuat Worksheet Denah Meja Siswa (Sisi Kiri & Sisi Kanan Bersebelahan sesuai Posisi Duduk di Kelas)
  const buildDenahWorksheet = (ruang: Ruang, participants: PesertaUjian[]) => {
    const kiri = participants
      .filter(p => (p.no_meja || 0) <= 17)
      .sort((a, b) => (a.no_meja || 0) - (b.no_meja || 0));

    const kanan = participants
      .filter(p => (p.no_meja || 0) >= 18)
      .sort((a, b) => (a.no_meja || 0) - (b.no_meja || 0));

    const kelasKiri = Array.from(new Set(kiri.map(p => getNamaKelas(p)).filter(k => k && k !== '-'))).join(', ') || '-';
    const kelasKanan = Array.from(new Set(kanan.map(p => getNamaKelas(p)).filter(k => k && k !== '-'))).join(', ') || '-';

    const cleanNamaSekolah = (schoolSettings.namaSekolah || 'SMP NEGERI 1 RAJAPOLAH').toUpperCase();
    const cleanUjian = (schoolSettings.namaUjian || 'SUMATIF AKHIR SEMESTER (SAS)').toUpperCase();
    const cleanTahun = schoolSettings.tahunAjaran || '2025/2026';
    const cleanSemester = (schoolSettings.semester || 'GANJIL').toUpperCase();

    const aoa: any[][] = [
      ['DENAH TEMPAT DUDUK & DAFTAR PESERTA RUANG UJIAN'],
      [`${cleanNamaSekolah} • ${cleanUjian}`],
      [`TAHUN PELAJARAN ${cleanTahun} • SEMESTER ${cleanSemester}`],
      [],
      [`RUANG UJIAN: ${ruang.nama_ruang || 'Ruang 01'} (${ruang.kode_ruang || 'R-01'})`, '', '', '', '', '', `KAPASITAS: ${ruang.kapasitas || 34} KURSI • TERISI: ${participants.length} SISWA`],
      [],
      ['[ PAPAN TULIS & MEJA PENGAWAS UJIAN (DEPAN KELAS) ]'],
      [],
      [`SISI KIRI (MEJA 01 S/D 17) - Terisi: ${kiri.length} Siswa (${kelasKiri})`, '', '', '', '', '', `SISI KANAN (MEJA 18 S/D 34) - Terisi: ${kanan.length} Siswa (${kelasKanan})`],
      ['No. Meja', 'No. Peserta', 'NISN', 'Nama Lengkap Siswa', 'Kelas', '', 'No. Meja', 'No. Peserta', 'NISN', 'Nama Lengkap Siswa', 'Kelas']
    ];

    const maxRows = Math.max(kiri.length, kanan.length, 17);
    for (let i = 0; i < maxRows; i++) {
      const pKiri = kiri[i];
      const pKanan = kanan[i];
      const defMejaKiri = i + 1;
      const defMejaKanan = 18 + i;

      aoa.push([
        pKiri ? String(pKiri.no_meja || defMejaKiri).padStart(2, '0') : String(defMejaKiri).padStart(2, '0'),
        pKiri?.no_peserta || (pKiri ? '-' : '(Kosong)'),
        pKiri?.siswa?.nisn || '',
        pKiri?.siswa?.nama_lengkap || (pKiri ? '-' : '-'),
        pKiri ? getNamaKelas(pKiri) : '',
        '',
        pKanan ? String(pKanan.no_meja || defMejaKanan).padStart(2, '0') : String(defMejaKanan).padStart(2, '0'),
        pKanan?.no_peserta || (pKanan ? '-' : '(Kosong)'),
        pKanan?.siswa?.nisn || '',
        pKanan?.siswa?.nama_lengkap || (pKanan ? '-' : '-'),
        pKanan ? getNamaKelas(pKanan) : ''
      ]);
    }

    aoa.push([]);
    aoa.push([
      `Total Sisi Kiri: ${kiri.length} Siswa`, '', '', '', '', '',
      `Total Sisi Kanan: ${kanan.length} Siswa`, '', '', '', ''
    ]);
    aoa.push([]);

    const ttdKota = schoolSettings.kotaTtd || 'Rajapolah';
    const ttdTgl = schoolSettings.tanggalTtd || '30 November 2026';
    const ttdJabatan = schoolSettings.jabatanKepsek || 'Kepala SMPN 1 Rajapolah,';
    const ttdNama = schoolSettings.namaKepsek || 'H. UCU KARNI, M.Pd.';
    const ttdNip = schoolSettings.nipKepsek || '19671116 199203 1 005';

    aoa.push(['', '', '', '', '', '', `${ttdKota}, ${ttdTgl}`]);
    aoa.push(['', '', '', '', '', '', ttdJabatan]);
    aoa.push([]);
    aoa.push([]);
    aoa.push([]);
    aoa.push(['', '', '', '', '', '', ttdNama]);
    aoa.push(['', '', '', '', '', '', `NIP. ${ttdNip}`]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Judul Denah
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Sekolah & Ujian
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }, // TP & Semester
      { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },  // Ruang Ujian
      { s: { r: 4, c: 6 }, e: { r: 4, c: 10 } }, // Kapasitas
      { s: { r: 6, c: 0 }, e: { r: 6, c: 10 } }, // Papan Tulis
      { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } },  // Header Sisi Kiri
      { s: { r: 8, c: 6 }, e: { r: 8, c: 10 } }, // Header Sisi Kanan
      { s: { r: aoa.length - 8, c: 0 }, e: { r: aoa.length - 8, c: 4 } }, // Total Kiri
      { s: { r: aoa.length - 8, c: 6 }, e: { r: aoa.length - 8, c: 10 } }, // Total Kanan
      { s: { r: aoa.length - 6, c: 6 }, e: { r: aoa.length - 6, c: 10 } }, // Titimangsa
      { s: { r: aoa.length - 5, c: 6 }, e: { r: aoa.length - 5, c: 10 } }, // Jabatan Kepsek
      { s: { r: aoa.length - 2, c: 6 }, e: { r: aoa.length - 2, c: 10 } }, // Nama Kepsek
      { s: { r: aoa.length - 1, c: 6 }, e: { r: aoa.length - 1, c: 10 } }, // NIP
    ];

    ws['!cols'] = [
      { wch: 10 }, // No. Meja (Kiri)
      { wch: 14 }, // No. Peserta
      { wch: 14 }, // NISN
      { wch: 32 }, // Nama Lengkap Siswa
      { wch: 10 }, // Kelas Asal
      { wch: 4 },  // Spacer
      { wch: 10 }, // No. Meja (Kanan)
      { wch: 14 }, // No. Peserta
      { wch: 14 }, // NISN
      { wch: 32 }, // Nama Lengkap Siswa
      { wch: 10 }  // Kelas Asal
    ];

    return ws;
  };

  // Unduh Berkas Excel Hasil Denah & Posisi Siswa (Sisi Kiri & Kanan) Khusus Ruang Ini
  const handleExportExcelPreviewRuang = () => {
    if (pesertaInPreviewRuang.length === 0) {
      alert('Tidak ada data peserta di ruang yang dipilih untuk diekspor ke Excel.');
      return;
    }

    const currentRuang = ruangList.find(r => r.id === selectedPreviewRuangId) || DEMO_RUANG[0];
    const ws = buildDenahWorksheet(currentRuang, pesertaInPreviewRuang);

    const workbook = XLSX.utils.book_new();
    const sheetName = (currentRuang.kode_ruang || 'Denah_Ruang').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);

    const cleanSekolah = schoolSettings.namaSekolah ? schoolSettings.namaSekolah.replace(/[^a-zA-Z0-9]/g, '_') : 'SMPN1_Rajapolah';
    const filename = `Denah_Meja_${currentRuang.kode_ruang}_${cleanSekolah}.xlsx`;
    XLSX.writeFile(workbook, filename);
    showToast(`Sukses! Berkas Excel format denah siswa (Kiri & Kanan) untuk ${currentRuang.nama_ruang} berhasil diunduh.`);
  };

  // Unduh Berkas Excel Denah Siswa Seluruh Ruang Ujian (Multi-sheet Denah Sisi Kiri & Kanan)
  const handleExportExcelAllRuang = () => {
    if (pesertaListGenerated.length === 0) {
      alert('Belum ada data peserta untuk diekspor. Pastikan data siswa sudah tersedia.');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Rekapitulasi Seluruh Ruang Ujian
    const sortedAll = [...pesertaListGenerated].sort((a, b) => {
      if ((a.ruang_id || 0) !== (b.ruang_id || 0)) {
        return (a.ruang_id || 0) - (b.ruang_id || 0);
      }
      return (a.no_meja || 0) - (b.no_meja || 0);
    });

    const rekapRuang = ruangList.map((r, rIdx) => {
      const siswaInRoom = sortedAll.filter(p => p.ruang_id === r.id);
      const kiri = siswaInRoom.filter(p => (p.no_meja || 0) <= 17);
      const kanan = siswaInRoom.filter(p => (p.no_meja || 0) >= 18);
      
      const kelasKiri = Array.from(new Set(kiri.map(p => getNamaKelas(p)).filter(k => k && k !== '-'))).join(', ') || '-';
      const kelasKanan = Array.from(new Set(kanan.map(p => getNamaKelas(p)).filter(k => k && k !== '-'))).join(', ') || '-';

      return {
        'No': rIdx + 1,
        'Kode Ruang': r.kode_ruang,
        'Nama Ruang': r.nama_ruang,
        'Kapasitas': r.kapasitas || 34,
        'Kelas Sisi Kiri (Meja 1-17)': kelasKiri,
        'Jml Siswa Kiri': kiri.length,
        'Kelas Sisi Kanan (Meja 18-34)': kelasKanan,
        'Jml Siswa Kanan': kanan.length,
        'Total Siswa Terisi': siswaInRoom.length,
        'Sisa Meja Kosong': Math.max(0, (r.kapasitas || 34) - siswaInRoom.length),
        'Status': siswaInRoom.length >= (r.kapasitas || 34) ? 'Penuh' : siswaInRoom.length > 0 ? 'Terisi' : 'Kosong'
      };
    });

    const wsRekap = XLSX.utils.json_to_sheet(rekapRuang);
    wsRekap['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 28 },
      { wch: 12 },
      { wch: 26 },
      { wch: 16 },
      { wch: 26 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsRekap, 'Rekapitulasi Ruang');

    // Sheet 2 dst: Denah Meja Format Siswa Kiri & Kanan untuk Setiap Ruang
    ruangList.forEach(ruang => {
      const siswaInRoom = sortedAll.filter(p => p.ruang_id === ruang.id);
      if (siswaInRoom.length > 0) {
        const wsRoom = buildDenahWorksheet(ruang, siswaInRoom);
        const sheetName = (ruang.kode_ruang || `R-${ruang.id}`).slice(0, 31).replace(/[^a-zA-Z0-9]/g, '_');
        XLSX.utils.book_append_sheet(workbook, wsRoom, sheetName);
      }
    });

    const cleanSekolah = schoolSettings.namaSekolah ? schoolSettings.namaSekolah.replace(/[^a-zA-Z0-9]/g, '_') : 'SMPN1_Rajapolah';
    const filename = `Denah_Meja_Lengkap_Semua_Ruang_${cleanSekolah}.xlsx`;
    XLSX.writeFile(workbook, filename);
    showToast(`Sukses! Berkas Excel format denah posisi duduk seluruh ruang berhasil diunduh.`);
  };

  // Handler Buka Modal Tambah Master Ruang
  const handleOpenAddModal = () => {
    setEditingRuang(null);
    const nextNum = ruangList.length + 1;
    setFormKode(`R-${nextNum.toString().padStart(2, '0')}`);
    setFormNama(`Ruang ${nextNum.toString().padStart(2, '0')}`);
    setFormKapasitas(36);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handler Buka Modal Edit Master Ruang
  const handleOpenEditModal = (ruang: Ruang) => {
    setEditingRuang(ruang);
    setFormKode(ruang.kode_ruang);
    setFormNama(ruang.nama_ruang);
    setFormKapasitas(ruang.kapasitas || 36);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Simpan Data Ruang Master (Tambah / Update)
  const handleSaveRuang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKode.trim()) {
      setFormError('Kode ruang wajib diisi (contoh: R-01)');
      return;
    }
    if (!formNama.trim()) {
      setFormError('Nama ruang wajib diisi (contoh: Ruang 01)');
      return;
    }
    if (formKapasitas < 1) {
      setFormError('Kapasitas minimal 1 peserta');
      return;
    }

    let updated: Ruang[];
    if (editingRuang) {
      updated = ruangList.map(r => 
        r.id === editingRuang.id 
          ? { ...r, kode_ruang: formKode.trim(), nama_ruang: formNama.trim(), kapasitas: Number(formKapasitas) }
          : r
      );
      showToast(`Ruang "${formNama}" berhasil diperbarui.`);
    } else {
      if (ruangList.some(r => r.kode_ruang.toLowerCase() === formKode.trim().toLowerCase())) {
        setFormError(`Kode ruang "${formKode.trim()}" sudah digunakan. Gunakan kode lain.`);
        return;
      }
      const newId = ruangList.length > 0 ? Math.max(...ruangList.map(r => r.id)) + 1 : 1;
      const newRuang: Ruang = {
        id: newId,
        kode_ruang: formKode.trim(),
        nama_ruang: formNama.trim(),
        kapasitas: Number(formKapasitas),
      };
      updated = [...ruangList, newRuang];
      showToast(`Ruang baru "${formNama}" berhasil ditambahkan.`);
    }

    setRuangList(updated);
    saveStoredRuang(updated);
    setIsModalOpen(false);

    if (isSupabaseConfigured) {
      try {
        await pushRuangToCloud(updated);
      } catch (err) {
        console.error('Auto sync to Supabase error:', err);
      }
    }
  };

  // Hapus Ruang Master
  const handleDeleteRuang = async (ruang: Ruang) => {
    const updated = ruangList.filter(r => r.id !== ruang.id);
    setRuangList(updated);
    saveStoredRuang(updated);
    setDeleteConfirmRuang(null);
    showToast(`Ruang "${ruang.nama_ruang}" telah dihapus.`);

    if (isSupabaseConfigured) {
      try {
        await deleteRuangFromCloud(ruang.id);
      } catch (err) {
        console.error('Delete from cloud error:', err);
      }
    }
  };

  // Filter Rules untuk tampilan tabel
  const filteredRules = useMemo(() => {
    return splitRules.filter(r => {
      if (filterKelasId !== 'all' && r.kelas_id.toString() !== filterKelasId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const kelas = DEMO_KELAS.find(k => k.id === r.kelas_id);
        const targetRuang = ruangList.find(ru => ru.id === r.target_ruang_id);
        const matchKelas = kelas?.nama_kelas.toLowerCase().includes(q);
        const matchRuang = targetRuang?.nama_ruang.toLowerCase().includes(q) || targetRuang?.kode_ruang.toLowerCase().includes(q);
        const matchLabel = r.label?.toLowerCase().includes(q);
        return matchKelas || matchRuang || matchLabel;
      }
      return true;
    });
  }, [splitRules, filterKelasId, searchQuery, ruangList]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Tampilan jika bukan Role Admin
  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Akses Ditolak (Khusus Role Admin)</h2>
        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
          Halaman <b>Kelola Ruang Ujian</b> hanya dapat diakses oleh pengguna dengan kewenangan <b>Administrator</b>.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Utama */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 flex-shrink-0">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">Manajemen Ruang & Penataan Meja</h1>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                Role Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Split nomor urut siswa (contoh 1-17 & 18-34), atur kursi silang (kiri & kanan), serta kelola master ruang ujian.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'mapping'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Split & Mapping Siswa (Silang Ruang)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'master'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Master Daftar Ruang ({ruangList.length})</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SPLIT & MAPPING SILANG SISWA                         */}
      {/* ============================================================ */}
      {activeTab === 'mapping' && (
        <div className="space-y-6">
          {/* Card Panduan & Kontrol Tindakan Cepat */}
          <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 p-5 rounded-2xl border border-teal-200/80 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-teal-600 text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-sm font-extrabold text-teal-950">
                    Aturan Split & Mapping Siswa Manual (Sistem Duduk Silang)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setiap kelas otomatis dipotong per rentang nomor urut (default: <b>No. 1 - 17</b> dan <b>No. 18 - 34</b>). 
                  Anda <b>cukup memasukkan Nomor Ruang</b> pada tabel di bawah. Siswa di kursi <b>Kiri</b> akan menempati Meja 1-17, 
                  dan siswa di kursi <b>Kanan</b> akan menempati Meja 18-34.
                </p>
              </div>

              {/* Tombol Aksi Cepat */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoCrossPreset}
                  title="Otomatis silangkan Tingkat 7 (Ruang 1-11) dengan Tingkat 8 (Ruang 12-22)"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Pola Silang Otomatis</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcelAllRuang}
                  title="Unduh Berkas Excel Hasil Mapping Siswa Seluruh Ruang Ujian (Ruang 1 s.d 33)"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>Cetak Excel Semua Ruang</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSplitRules}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Simpan & Terapkan</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToStandard}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>
          </div>

          {/* DENAH PRATINJAU RUANG UJIAN (SIMULASI TATA LETAK MEJA) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-teal-600" />
                  Pratinjau Denah Ruang Ujian (Simulasi Kursi Kiri & Kanan)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Melihat susunan tempat duduk peserta yang dihasilkan di ruang yang dipilih secara langsung.
                </p>
              </div>

              {/* Pilihan Ruang untuk Denah */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Pilih Ruang:</span>
                <select
                  value={selectedPreviewRuangId}
                  onChange={(e) => setSelectedPreviewRuangId(Number(e.target.value))}
                  className="text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {ruangList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.kode_ruang} - {r.nama_ruang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Simulasi Ruangan Kelas */}
            <div className="mt-6 bg-slate-50 rounded-2xl p-6 border border-slate-200">
              {/* Meja Pengawas */}
              <div className="max-w-md mx-auto mb-8 py-2.5 px-6 rounded-xl bg-slate-800 text-white text-center font-bold text-xs tracking-wider shadow-md">
                PAPAN TULIS &bull; MEJA PENGAWAS UJIAN (DEPAN KELAS)
              </div>

              {/* Peringatan jika Ruang Kelebihan Kapasitas */}
              {pesertaInPreviewRuang.length > 34 && (
                <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      <b>Perhatian:</b> Ruang ini terisi <b>{pesertaInPreviewRuang.length} siswa</b> (kapasitas standar 34 kursi). Jika terjadi penumpukan karena banyak kelas diarahkan ke ruang yang sama, klik <b>Pola Silang Otomatis</b> atau sesuaikan target ruang pada tabel bawah.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoCrossPreset}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs whitespace-nowrap self-end sm:self-center transition shadow-sm"
                  >
                    Terapkan Pola Silang
                  </button>
                </div>
              )}

              {/* 2 Kolom Meja (Kiri & Kanan) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SISI KIRI (MEJA 1 - 17) */}
                <div className="bg-white rounded-xl p-4 border-2 border-teal-500/40 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                        L
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase">
                          Sisi Kiri (Meja 01 s/d 17)
                        </h4>
                        <p className="text-[11px] text-teal-700 font-semibold">
                          {kursiKiriPeserta.length > 0 
                            ? `Terisi: ${kursiKiriPeserta.length} Siswa (${getNamaKelas(kursiKiriPeserta[0])})`
                            : 'Belum ada siswa yang dimapping ke sisi kiri'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                      Kursi Kiri
                    </span>
                  </div>

                  {/* Grid Meja Kiri */}
                  <div className="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {kursiKiriPeserta.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-400">
                        Tidak ada siswa di sisi kiri ruang ini.
                      </p>
                    ) : (
                      kursiKiriPeserta.map((p) => (
                        <div key={p.id} className="py-2 px-1 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-6 rounded bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[11px] flex items-center justify-center font-mono">
                              {p.no_meja?.toString().padStart(2, '0')}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 text-xs leading-tight">{p.siswa?.nama_lengkap}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">NISN: {p.siswa?.nisn || '-'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {getNamaKelas(p)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SISI KANAN (MEJA 18 - 34) */}
                <div className="bg-white rounded-xl p-4 border-2 border-indigo-500/40 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">
                        R
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase">
                          Sisi Kanan (Meja 18 s/d 34)
                        </h4>
                        <p className="text-[11px] text-indigo-700 font-semibold">
                          {kursiKananPeserta.length > 0 
                            ? `Terisi: ${kursiKananPeserta.length} Siswa (${getNamaKelas(kursiKananPeserta[0])})`
                            : 'Belum ada siswa yang dimapping ke sisi kanan'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      Kursi Kanan
                    </span>
                  </div>

                  {/* Grid Meja Kanan */}
                  <div className="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {kursiKananPeserta.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-400">
                        Tidak ada siswa di sisi kanan ruang ini.
                      </p>
                    ) : (
                      kursiKananPeserta.map((p) => (
                        <div key={p.id} className="py-2 px-1 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-6 rounded bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[11px] flex items-center justify-center font-mono">
                              {p.no_meja?.toString().padStart(2, '0')}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 text-xs leading-tight">{p.siswa?.nama_lengkap}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">NISN: {p.siswa?.nisn || '-'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {getNamaKelas(p)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Tautan Cepat Cetak Ruang Ini */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 font-medium">
                  Total Peserta di {ruangList.find(r => r.id === selectedPreviewRuangId)?.nama_ruang || `Ruang ${selectedPreviewRuangId}`}: <b>{pesertaInPreviewRuang.length} Siswa</b>
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href="/kartu-peserta"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cetak Kartu Peserta</span>
                  </Link>

                  <Link
                    href="/daftar-hadir"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cetak Daftar Hadir</span>
                  </Link>

                  <Link
                    href="/nomor-meja"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    <Tag className="w-3.5 h-3.5 text-violet-600" />
                    <span>Cetak Label Meja</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleExportExcelPreviewRuang}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 border border-emerald-700 text-white font-bold hover:bg-emerald-700 shadow-sm transition"
                    title="Unduh Berkas Excel Hasil Mapping Siswa Khusus Ruang Ini"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                    <span>Cetak Excel Ruang Ini</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL ATURAN MAPPING MANUAL SETIAP KELAS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Toolbar Filter & Search */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kelas atau ruang..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>

                <select
                  value={filterKelasId}
                  onChange={(e) => setFilterKelasId(e.target.value)}
                  className="text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">Semua Rombel ({DEMO_KELAS.length} Kelas)</option>
                  {DEMO_KELAS.map(k => (
                    <option key={k.id} value={k.id.toString()}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveSplitRules}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Aturan Mapping</span>
                </button>
              </div>
            </div>

            {/* Tabel Konfigurasi Rule */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-44">Kelas / Rombel Asal</th>
                    <th className="py-3 px-4 w-44">Rentang No. Urut Siswa</th>
                    <th className="py-3 px-4 w-32 text-center">Jml Siswa</th>
                    <th className="py-3 px-4 w-52">
                      <div className="flex items-center gap-1 text-teal-800">
                        <span>Input Nomor Ruang Ujian</span>
                        <span className="text-[10px] text-teal-600 font-normal">(Cukup ketik nomor)</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 w-44">Posisi Duduk di Ruang</th>
                    <th className="py-3 px-4 w-36 text-center">Nomor Meja Dihasilkan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                  {filteredRules.map((rule, index) => {
                    const kelas = DEMO_KELAS.find(k => k.id === rule.kelas_id);
                    const countSiswaInClass = siswaPerKelas[rule.kelas_id]?.length || 0;
                    const countInChunk = Math.max(0, rule.end_urut - rule.start_urut + 1);

                    const targetRuangObj = ruangList.find(r => r.id === rule.target_ruang_id) || 
                                           ruangList[0] || 
                                           DEMO_RUANG[0];

                    const startDesk = rule.posisi === 'kanan' ? 18 : 1;
                    const endDesk = startDesk + countInChunk - 1;

                    return (
                      <tr key={rule.id} className="hover:bg-teal-50/30 transition">
                        <td className="py-3 px-4 text-center text-slate-500 font-bold">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center font-mono">
                              {kelas?.nama_kelas}
                            </span>
                            <div>
                              <p className="font-extrabold text-slate-900">{kelas?.nama_kelas}</p>
                              <p className="text-[10px] text-slate-500">Tingkat {kelas?.tingkat} &bull; Total {countSiswaInClass} Siswa</p>
                            </div>
                          </div>
                        </td>

                        {/* Rentang Nomor Urut Siswa */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={rule.start_urut}
                              onChange={(e) => handleUpdateRentang(rule.id, 'start_urut', Number(e.target.value))}
                              className="w-14 px-2 py-1 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                            <span className="text-slate-400 font-bold">s/d</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={rule.end_urut}
                              onChange={(e) => handleUpdateRentang(rule.id, 'end_urut', Number(e.target.value))}
                              className="w-14 px-2 py-1 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                          </div>
                        </td>

                        {/* Jumlah Siswa dalam Potongan */}
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                            {countInChunk} Siswa
                          </span>
                        </td>

                        {/* INPUT NOMOR RUANG TUJUAN (CUKUP MASUKKAN NOMOR RUANG SAJA) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <select
                                value={rule.target_ruang_id}
                                onChange={(e) => handleUpdateTargetRuang(rule.id, Number(e.target.value))}
                                className="w-full px-3 py-1.5 bg-teal-50/60 border-2 border-teal-500/70 rounded-xl text-xs font-bold text-teal-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition shadow-sm"
                              >
                                {ruangList.map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.kode_ruang} - {r.nama_ruang}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Kotak Angka Nomor Ruang Cepat */}
                            <input
                              type="number"
                              min="1"
                              max={ruangList.length || 99}
                              value={rule.target_ruang_id}
                              onChange={(e) => handleUpdateTargetRuang(rule.id, Number(e.target.value))}
                              title="Ketik nomor ruang langsung di sini (contoh: 1, 2, 12)"
                              className="w-14 px-2 py-1.5 text-center bg-white border-2 border-slate-300 focus:border-teal-600 rounded-xl text-xs font-mono font-extrabold text-slate-900 outline-none"
                            />
                          </div>
                        </td>

                        {/* Posisi Duduk: Sisi Kiri vs Sisi Kanan */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleUpdatePosisi(rule.id, 'kiri')}
                              className={`flex-1 py-1 px-2 text-[10px] font-bold rounded transition ${
                                rule.posisi === 'kiri'
                                  ? 'bg-teal-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Kiri (1-17)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePosisi(rule.id, 'kanan')}
                              className={`flex-1 py-1 px-2 text-[10px] font-bold rounded transition ${
                                rule.posisi === 'kanan'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Kanan (18-34)
                            </button>
                          </div>
                        </td>

                        {/* Nomor Meja Dihasilkan */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-[11px] border border-slate-200">
                            Meja {startDesk.toString().padStart(2, '0')} - {endDesk.toString().padStart(2, '0')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MASTER RUANG UJIAN (CRUD & KAPASITAS)                 */}
      {/* ============================================================ */}
      {activeTab === 'master' && (
        <div className="space-y-6">
          {/* Action Bar Master Ruang */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Daftar Fisik Ruang Ujian</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {ruangList.length} ruang aktif &bull; Daya tampung total {totalKapasitas} kursi ujian.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Ruang</span>
              </button>

              {isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      const res = await pushRuangToCloud(ruangList);
                      if (res.success) showToast(`Berhasil menyimpan ${res.count} ruang ke cloud Supabase!`);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition disabled:opacity-60"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Supabase'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Cetak Rekap</span>
              </button>
            </div>
          </div>

          {/* Statistik Ringkas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Ruang Ujian</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{ruangList.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Kapasitas Kursi</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{totalKapasitas} <span className="text-xs font-normal text-slate-500">Meja</span></p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Siswa Terdaftar</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{totalSiswaTerisi} <span className="text-xs font-normal text-slate-500">Siswa</span></p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Database Cloud</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Terhubung
                </span>
              </div>
            </div>
          </div>

          {/* Tabel Master Ruang */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-32">Kode Ruang</th>
                    <th className="py-3 px-4">Nama Ruang Ujian</th>
                    <th className="py-3 px-4 w-36 text-center">Kapasitas Kursi</th>
                    <th className="py-3 px-4 w-40 text-center">Peserta Terisi</th>
                    <th className="py-3 px-4 w-32 text-center">Status</th>
                    <th className="no-print py-3 px-4 w-48 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                  {ruangList.map((ruang, index) => {
                    const siswaInRoom = pesertaListGenerated.filter(p => p.ruang_id === ruang.id).length;
                    const isFull = siswaInRoom >= (ruang.kapasitas || 36);

                    return (
                      <tr key={ruang.id} className="hover:bg-teal-50/40 transition">
                        <td className="py-3 px-4 text-center text-slate-500 font-bold">{index + 1}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold font-mono text-[11px]">
                            {ruang.kode_ruang}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {ruang.nama_ruang}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {ruang.kapasitas || 36} Meja
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {siswaInRoom} / {ruang.kapasitas || 36}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isFull 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {isFull ? 'Penuh' : 'Tersedia'}
                          </span>
                        </td>
                        <td className="no-print py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(ruang)}
                              title="Edit Ruang"
                              className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPreviewRuangId(ruang.id);
                                setActiveTab('mapping');
                              }}
                              title="Lihat Denah Ruang Ini"
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmRuang(ruang)}
                              title="Hapus Ruang"
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Ruang Master */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingRuang ? 'Edit Ruang Ujian' : 'Tambah Ruang Ujian Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRuang} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kode Ruang
                </label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value.toUpperCase())}
                  placeholder="Contoh: R-01 atau LAB-KOMP"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Ruang
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Ruang 01 (Kelas VII-A)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kapasitas Tempat Duduk (Meja)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formKapasitas}
                  onChange={(e) => setFormKapasitas(Number(e.target.value))}
                  placeholder="36"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingRuang ? 'Simpan Perubahan' : 'Tambahkan Ruang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirmRuang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Hapus Ruang Ujian?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus <b>{deleteConfirmRuang.nama_ruang}</b> ({deleteConfirmRuang.kode_ruang})?
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRuang(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRuang(deleteConfirmRuang)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition"
              >
                Ya, Hapus Ruang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
