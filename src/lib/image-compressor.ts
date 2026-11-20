/**
 * Utility Pemrosesan & Kompresi Otomatis Foto Siswa (Pas Foto 3x4)
 * Menjaga kualitas visual tetap tajam untuk cetak Kartu Peserta & Daftar Hadir,
 * namun dengan ukuran file sangat ringan (~8 KB - 15 KB), menghemat kuota hingga 98%.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Format ukuran byte ke string terbaca (B, KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Memeriksa apakah sebuah string data URL base64 berukuran besar (> 25 KB)
 */
export function isLargeImageBase64(dataUrl?: string | null): boolean {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return false;
  // Perkiraan ukuran byte dari panjang base64
  const estimatedBytes = Math.round((dataUrl.length * 3) / 4);
  return estimatedBytes > 25 * 1024; // > 25 KB
}

/**
 * Hitung perkiraan ukuran byte dari base64 string
 */
export function getBase64Size(dataUrl: string): number {
  if (!dataUrl) return 0;
  return Math.round((dataUrl.length * 3) / 4);
}

/**
 * Kompresi dan Auto Center-Crop foto siswa ke rasio standar 3:4 (180x240 piksel)
 * Menerima input berupa File (dari input type=file) atau string (Base64 Data URL).
 */
export async function compressStudentPhoto(
  input: File | string,
  targetWidth = 180,
  targetHeight = 240,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Dapatkan Data URL sumber
    const getSourceDataUrl = (): Promise<string> => {
      if (typeof input === 'string') {
        return Promise.resolve(input);
      }
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = () => rej(new Error('Gagal membaca file foto'));
        reader.readAsDataURL(input);
      });
    };

    getSourceDataUrl()
      .then((srcDataUrl) => {
        if (!srcDataUrl) {
          resolve('');
          return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              resolve(srcDataUrl);
              return;
            }

            // Gunakan imageSmoothing berkualitas tinggi
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Bersihkan latar belakang dengan warna putih
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            // Logika Auto Center-Crop ke Rasio 3:4 agar wajah tidak gepeng/terdistorsi
            const imgWidth = img.naturalWidth || img.width;
            const imgHeight = img.naturalHeight || img.height;
            const targetRatio = targetWidth / targetHeight; // 0.75
            const imgRatio = imgWidth / imgHeight;

            let sWidth = imgWidth;
            let sHeight = imgHeight;
            let sx = 0;
            let sy = 0;

            if (imgRatio > targetRatio) {
              // Gambar terlalu lebar / landscape -> potong sisi kiri dan kanan
              sWidth = imgHeight * targetRatio;
              sx = (imgWidth - sWidth) / 2;
            } else {
              // Gambar terlalu tinggi -> potong sedikit bagian bawah (fokus bagian atas/wajah)
              sHeight = imgWidth / targetRatio;
              sy = Math.max(0, (imgHeight - sHeight) * 0.25); // Ambil 25% dari atas agar kepala tidak terpotong
            }

            ctx.drawImage(
              img,
              sx, sy, sWidth, sHeight,
              0, 0, targetWidth, targetHeight
            );

            // Export ke JPEG dengan kualitas terkompresi optimal (0.72)
            // Menghasilkan ukuran file hanya ~8 KB - 14 KB!
            const compressedUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedUrl);
          } catch (err) {
            console.error('Error saat kompresi canvas:', err);
            resolve(srcDataUrl);
          }
        };

        img.onerror = () => {
          // Jika gambar gagal dimuat (misal format rusak), kembalikan sumber apa adanya
          resolve(srcDataUrl);
        };

        img.src = srcDataUrl;
      })
      .catch((err) => {
        console.error('CompressStudentPhoto exception:', err);
        resolve('');
      });
  });
}
