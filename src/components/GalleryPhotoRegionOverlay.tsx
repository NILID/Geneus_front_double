import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

import {
  clampRegion,
  pixelRectToRegion,
  regionToPercent,
  type GalleryPhotoRegion,
} from '../gallery/galleryPhotoRegion';

export interface RegionHighlight {
  personId: number;
  region: GalleryPhotoRegion;
  active?: boolean;
}

interface GalleryPhotoRegionOverlayProps {
  imageUrl: string;
  alt?: string;
  /** Режим рисования новой области */
  drawing?: boolean;
  highlights?: RegionHighlight[];
  onRegionDrawn?: (region: GalleryPhotoRegion) => void;
  maxHeight?: string | number | Record<string, string | number>;
}

export function GalleryPhotoRegionOverlay({
  imageUrl,
  alt = '',
  drawing = false,
  highlights = [],
  onRegionDrawn,
  maxHeight = 'min(60vh, 480px)',
}: GalleryPhotoRegionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const img = el.querySelector('img');
    if (!img) {
      return;
    }
    const w = img.clientWidth;
    const h = img.clientHeight;
    if (w > 0 && h > 0) {
      setSize({ w, h });
    }
  }, []);

  useEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) {
      return undefined;
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, imageUrl]);

  const draftRect =
    drag && size.w > 0
      ? {
          left: Math.min(drag.x0, drag.x1),
          top: Math.min(drag.y0, drag.y1),
          width: Math.abs(drag.x1 - drag.x0),
          height: Math.abs(drag.y1 - drag.y0),
        }
      : null;

  function pointerPos(e: React.PointerEvent): { x: number; y: number } {
    const el = containerRef.current;
    if (!el || size.w <= 0) {
      return { x: 0, y: 0 };
    }
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, size.w));
    const y = Math.max(0, Math.min(e.clientY - rect.top, size.h));
    return { x, y };
  }

  function finishDraw(end: { x: number; y: number }) {
    if (!drag || !onRegionDrawn) {
      setDrag(null);
      return;
    }
    const left = Math.min(drag.x0, end.x);
    const top = Math.min(drag.y0, end.y);
    const width = Math.abs(end.x - drag.x0);
    const height = Math.abs(end.y - drag.y0);
    const region = pixelRectToRegion({ left, top, width, height }, size.w, size.h);
    setDrag(null);
    if (region) {
      onRegionDrawn(region);
    }
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        display: 'inline-block',
        maxWidth: '100%',
        lineHeight: 0,
        cursor: drawing ? 'crosshair' : 'default',
        touchAction: drawing ? 'none' : 'auto',
      }}
      onPointerDown={
        drawing
          ? (e) => {
              if (e.button !== 0) {
                return;
              }
              e.preventDefault();
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              const p = pointerPos(e);
              setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
            }
          : undefined
      }
      onPointerMove={
        drawing
          ? (e) => {
              if (!drag) {
                return;
              }
              const p = pointerPos(e);
              setDrag((d) => (d ? { ...d, x1: p.x, y1: p.y } : null));
            }
          : undefined
      }
      onPointerUp={
        drawing
          ? (e) => {
              if (!drag) {
                return;
              }
              finishDraw(pointerPos(e));
            }
          : undefined
      }
      onPointerCancel={
        drawing
          ? () => {
              setDrag(null);
            }
          : undefined
      }
    >
      <Box
        component="img"
        src={imageUrl}
        alt={alt}
        onLoad={measure}
        sx={{
          display: 'block',
          maxWidth: '100%',
          maxHeight,
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          userSelect: 'none',
          pointerEvents: drawing ? 'none' : 'auto',
        }}
      />
      {size.w > 0 && size.h > 0 ? (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: size.w,
            height: size.h,
            pointerEvents: drawing ? 'auto' : 'none',
          }}
        >
          {highlights.map((h) => {
            const pct = regionToPercent(clampRegion(h.region));
            return (
              <Box
                key={h.personId}
                sx={{
                  position: 'absolute',
                  ...pct,
                  boxSizing: 'border-box',
                  border: 2,
                  borderColor: h.active ? 'warning.main' : 'primary.light',
                  bgcolor: h.active ? 'rgba(255, 193, 7, 0.35)' : 'rgba(25, 118, 210, 0.2)',
                  borderRadius: 0.5,
                  transition: 'background-color 0.15s, border-color 0.15s',
                }}
              />
            );
          })}
          {draftRect ? (
            <Box
              sx={{
                position: 'absolute',
                left: draftRect.left,
                top: draftRect.top,
                width: draftRect.width,
                height: draftRect.height,
                border: '2px dashed',
                borderColor: 'warning.main',
                bgcolor: 'rgba(255, 193, 7, 0.25)',
                pointerEvents: 'none',
              }}
            />
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
