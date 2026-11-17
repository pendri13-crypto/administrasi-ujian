'use client';

import React, { useState, useEffect } from 'react';

export function trimImageWhitespace(base64OrUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!base64OrUrl) return resolve(base64OrUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64OrUrl);

        ctx.drawImage(img, 0, 0);
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let found = false;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Cek apakah pixel ini berisi logo (bukan transparan dan bukan putih bersih)
            const isTransparent = a <= 15;
            const isWhite = a > 220 && r > 248 && g > 248 && b > 248;

            if (!isTransparent && !isWhite) {
              found = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const trimmedWidth = maxX - minX + 1;
        const trimmedHeight = maxY - minY + 1;

        // Jika gambar memiliki padding kosong lebih dari 4%, lakukan crop presisi
        if (found && trimmedWidth > 0 && trimmedHeight > 0 &&
            (trimmedWidth < width * 0.96 || trimmedHeight < height * 0.96)) {
          const padX = Math.round(trimmedWidth * 0.02);
          const padY = Math.round(trimmedHeight * 0.02);
          const cropX = Math.max(0, minX - padX);
          const cropY = Math.max(0, minY - padY);
          const cropW = Math.min(width - cropX, trimmedWidth + padX * 2);
          const cropH = Math.min(height - cropY, trimmedHeight + padY * 2);

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            return resolve(cropCanvas.toDataURL('image/png'));
          }
        }

        resolve(base64OrUrl);
      } catch {
        resolve(base64OrUrl);
      }
    };

    img.onerror = () => resolve(base64OrUrl);
    img.src = base64OrUrl;
  });
}

interface AutoTrimmedLogoProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function AutoTrimmedLogo({
  src,
  alt,
  className = 'w-full h-full object-contain filter drop-shadow-sm select-none',
  fallbackSrc = '/images/logo-smpn1-rajapolah.png',
}: AutoTrimmedLogoProps) {
  const initialSrc = src || fallbackSrc;
  const [displaySrc, setDisplaySrc] = useState<string>(initialSrc);

  useEffect(() => {
    const rawSrc = src || fallbackSrc;
    if (!rawSrc) return;

    trimImageWhitespace(rawSrc).then((trimmed) => {
      setDisplaySrc(trimmed);
    });
  }, [src, fallbackSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      className={className}
    />
  );
}
