/**
 * ==============================================================================
 * SISTEM ADMINISTRASI UJIAN SMP NEGERI 1 RAJAPOLAH
 * BACKEND GOOGLE APPS SCRIPT (GAS)
 * ==============================================================================
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Sistem Assesmen SMPN 1 Rajapolah')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Mengambil seluruh data administrasi ujian dari Google Spreadsheet
 */
function getInitialData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  return {
    pengaturan: getPengaturanData(ss),
    ruangList: getSheetData(ss, 'Ruang_Ujian'),
    kelasList: getSheetData(ss, 'Kelas'),
    mapelList: getSheetData(ss, 'Mata_Pelajaran'),
    jadwalList: getSheetData(ss, 'Jadwal_Ujian'),
    siswaList: getSheetData(ss, 'Data_Siswa'),
    pesertaList: getSheetData(ss, 'Kartu_Peserta')
  };
}

/**
 * Helper untuk membaca sheet menjadi Array of Objects
 */
function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var rows = [];
  
  for (var i = 1; i < values.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      var headerKey = String(headers[j]).trim();
      rowObj[headerKey] = values[i][j];
    }
    rows.push(rowObj);
  }
  return rows;
}

/**
 * Membaca data pengaturan dari Sheet 'Pengaturan'
 */
function getPengaturanData(ss) {
  var sheet = ss.getSheetByName('Pengaturan');
  var config = {
    namaSekolah: 'SMP NEGERI 1 RAJAPOLAH',
    namaUjian: 'SUMATIF AKHIR SEMESTER (SAS)',
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    kotaTtd: 'Rajapolah',
    tanggalTtd: '30 November 2026',
    jabatanKepsek: 'Kepala SMPN 1 Rajapolah',
    namaKepsek: 'H. UCU KARNI, M.Pd.',
    nipKepsek: '19671116 199203 1 005',
    logoPemdaUrl: 'https://administrasi-ujian-mu.vercel.app/images/logo-tasikmalaya.png',
    logoSekolahUrl: 'https://administrasi-ujian-mu.vercel.app/images/logo-smpn1-rajapolah.png',
    ttdKepsekUrl: 'https://administrasi-ujian-mu.vercel.app/images/ttd-kepsek.png'
  };
  
  if (!sheet) return config;
  
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var param = String(values[i][0]).trim().toUpperCase();
    var val = values[i][1];
    
    if (param === 'NAMA_SEKOLAH') config.namaSekolah = val;
    else if (param === 'NAMA_UJIAN') config.namaUjian = val;
    else if (param === 'TAHUN_AJARAN') config.tahunAjaran = val;
    else if (param === 'SEMESTER') config.semester = val;
    else if (param === 'KOTA_TTD') config.kotaTtd = val;
    else if (param === 'TANGGAL_TTD') config.tanggalTtd = val;
    else if (param === 'JABATAN_KEPSEK') config.jabatanKepsek = val;
    else if (param === 'NAMA_KEPSEK') config.namaKepsek = val;
    else if (param === 'NIP_KEPSEK') config.nipKepsek = val;
    else if (param === 'LOGO_PEMDA_URL' && val) config.logoPemdaUrl = val;
    else if (param === 'LOGO_SEKOLAH_URL' && val) config.logoSekolahUrl = val;
    else if (param === 'TTD_KEPSEK_URL' && val) config.ttdKepsekUrl = val;
  }
  
  return config;
}
