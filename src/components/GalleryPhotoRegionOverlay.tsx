import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

import {
  applyRegionEdit,
  clampRegion,
  pixelRectToRegion,
  regionToPercent,
  type GalleryPhotoRegion,
  type RegionEditHandle,
} from '../gallery/galleryPhotoRegion';

export interface RegionHighlight {
  personId: number;
  region: GalleryPhotoRegion;
  /** Яркая подсветка (наведение на имя и т.п.) */
  active?: boolean;
  /** Другая персона в фокусе — эту область приглушить */
  dimmed?: boolean;
}

interface GalleryPhotoRegionOverlayProps {
  imageUrl: string;
  alt?: string;
  /** Режим рисования новой области */
  drawing?: boolean;
  /** Перетаскивание и масштабирование существующих областей */
  editable?: boolean;
  highlights?: RegionHighlight[];
  onRegionDrawn?: (region: GalleryPhotoRegion) => void;
  onRegionChange?: (personId: number, region: GalleryPhotoRegion) => void;
  onRegionFocus?: (personId: number) => void;
  maxHeight?: string | number | Record<string, string | number>;
}

const HANDLE_CURSORS: Record<RegionEditHandle, string> = {
  move: 'move',
  nw: 'nw-resize',
  ne: 'ne-resize',
  sw: 'sw-resize',
  se: 'se-resize',
  n: 'n-resize',
  s: 's-resize',
  e: 'e-resize',
  w: 'w-resize',
};

interface EditSession {
  personId: number;
  handle: RegionEditHandle;
  startRegion: GalleryPhotoRegion;
  startPointer: { x: number; y: number };
}

function ResizeHandle({
  handle,
  left,
  top,
  onPointerDown,
}: {
  handle: RegionEditHandle;
  left: number | string;
  top: number | string;
  onPointerDown: (e: React.PointerEvent, handle: RegionEditHandle) => void;
}) {
  return (
    <Box
      onPointerDown={(e) => onPointerDown(e, handle)}
      sx={{
        position: 'absolute',
        left,
        top,
        width: 10,
        height: 10,
        marginLeft: '-5px',
        marginTop: '-5px',
        borderRadius: '50%',
        bgcolor: 'warning.main',
        border: '2px solid',
        borderColor: 'common.white',
        boxShadow: 1,
        cursor: HANDLE_CURSORS[handle],
        zIndex: 4,
        touchAction: 'none',
      }}
    />
  );
}

function EditableRegionBox({
  highlight,
  editable,
  onPointerDownHandle,
  onRegionFocus,
}: {
  highlight: RegionHighlight;
  editable: boolean;
  onPointerDownHandle: (e: React.PointerEvent, personId: number, handle: RegionEditHandle) => void;
  onRegionFocus?: (personId: number) => void;
}) {
  const pct = regionToPercent(clampRegion(highlight.region));
  const showHandles = editable && highlight.active && !highlight.dimmed;

  return (
    <Box
      sx={{
        position: 'absolute',
        ...pct,
        boxSizing: 'border-box',
        borderStyle: highlight.dimmed ? 'dashed' : 'solid',
        borderWidth: highlight.active ? 3 : 1,
        borderColor: highlight.active ? 'warning.main' : highlight.dimmed ? 'grey.400' : 'primary.light',
        bgcolor: highlight.active
          ? 'rgba(255, 193, 7, 0.5)'
          : highlight.dimmed
            ? 'rgba(0, 0, 0, 0.04)'
            : 'rgba(25, 118, 210, 0.12)',
        borderRadius: 0.5,
        opacity: highlight.dimmed ? 0.45 : 1,
        zIndex: highlight.active ? 3 : 1,
        transition: highlight.active
          ? 'none'
          : 'background-color 0.15s, border-color 0.15s, opacity 0.15s, border-width 0.15s',
        boxShadow: highlight.active ? '0 0 0 2px rgba(255, 193, 7, 0.35)' : 'none',
        pointerEvents: editable ? 'auto' : 'none',
        cursor: editable ? (highlight.active ? 'move' : 'pointer') : 'default',
        touchAction: 'none',
      }}
      onPointerDown={
        editable
          ? (e) => {
              if (e.button !== 0) {
                return;
              }
              e.stopPropagation();
              if (!highlight.active) {
                onRegionFocus?.(highlight.personId);
                return;
              }
              onPointerDownHandle(e, highlight.personId, 'move');
            }
          : undefined
      }
    >
      {showHandles ? (
        <>
          <ResizeHandle handle="nw" left={0} top={0} onPointerDown={(e, h) => onPointerDownHandle(e, highlight.personId, h)} />
          <ResizeHandle handle="ne" left="100%" top={0} onPointerDown={(e, h) => onPointerDownHandle(e, highlight.personId, h)} />
          <ResizeHandle handle="sw" left={0} top="100%" onPointerDown={(e, h) => onPointerDownHandle(e, highlight.personId, h)} />
          <ResizeHandle handle="se" left="100%" top="100%" onPointerDown={(e, h) => onPointerDownHandle(e, highlight.personId, h)} />
          <ResizeHandle
            handle="n"
            left="50%"
            top={0}
            onPointerDown={(e, h) => onPointerDownHandle(e, highlight.personId, h)}
          />
          <ResizeHandle
            handle="s"
            left="50%"
            top="100%"
            onPointerDown={(e, h) => onPointerDownHandle(e, highlight.personId, h)}
          />
          <ResizeHandle
            handle="w"
            left={0}
            top="50%"
            onPointerDown={(e, h) => onPointerDownHandle(e, highlight.personId, h)}
          />
          <ResizeHandle
            handle="e"
            left="100%"
            top="50%"
            onPointerDown={(e, h) => onPointerDownHandle(e, highlight.personId, h)}
          />
          {/* Невидимая зона для перетаскивания по центру (не перекрывает углы) */}
          <Box
            sx={{
              position: 'absolute',
              left: 8,
              top: 8,
              right: 8,
              bottom: 8,
              cursor: 'move',
              zIndex: 2,
            }}
            onPointerDown={(e) => {
              if (e.button !== 0) {
                return;
              }
              onPointerDownHandle(e, highlight.personId, 'move');
            }}
          />
        </>
      ) : null}
    </Box>
  );
}

export function GalleryPhotoRegionOverlay({
  imageUrl,
  alt = '',
  drawing = false,
  editable = false,
  highlights = [],
  onRegionDrawn,
  onRegionChange,
  onRegionFocus,
  maxHeight = 'min(60vh, 480px)',
}: GalleryPhotoRegionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drawDrag, setDrawDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [editSession, setEditSession] = useState<EditSession | null>(null);
  const [liveRegions, setLiveRegions] = useState<Record<number, GalleryPhotoRegion>>({});

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

  const pointerPosFromClient = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const el = containerRef.current;
      if (!el || size.w <= 0) {
        return { x: 0, y: 0 };
      }
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, size.w));
      const y = Math.max(0, Math.min(clientY - rect.top, size.h));
      return { x, y };
    },
    [size.w, size.h],
  );

  function pointerPos(e: React.PointerEvent): { x: number; y: number } {
    return pointerPosFromClient(e.clientX, e.clientY);
  }

  const draftRect =
    drawDrag && size.w > 0
      ? {
          left: Math.min(drawDrag.x0, drawDrag.x1),
          top: Math.min(drawDrag.y0, drawDrag.y1),
          width: Math.abs(drawDrag.x1 - drawDrag.x0),
          height: Math.abs(drawDrag.y1 - drawDrag.y0),
        }
      : null;

  function finishDraw(end: { x: number; y: number }) {
    if (!drawDrag || !onRegionDrawn) {
      setDrawDrag(null);
      return;
    }
    const left = Math.min(drawDrag.x0, end.x);
    const top = Math.min(drawDrag.y0, end.y);
    const width = Math.abs(end.x - drawDrag.x0);
    const height = Math.abs(end.y - drawDrag.y0);
    const region = pixelRectToRegion({ left, top, width, height }, size.w, size.h);
    setDrawDrag(null);
    if (region) {
      onRegionDrawn(region);
    }
  }

  function beginEdit(e: React.PointerEvent, personId: number, handle: RegionEditHandle) {
    if (!editable || !onRegionChange || drawing) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    const highlight = highlights.find((h) => h.personId === personId);
    if (!highlight) {
      return;
    }
    onRegionFocus?.(personId);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture?.(e.pointerId);
    const p = pointerPos(e);
    setEditSession({
      personId,
      handle,
      startRegion: liveRegions[personId] ?? highlight.region,
      startPointer: p,
    });
  }

  useEffect(() => {
    if (!editSession || size.w <= 0) {
      return undefined;
    }

    const onPointerMove = (e: PointerEvent) => {
      const p = pointerPosFromClient(e.clientX, e.clientY);
      const dx = (p.x - editSession.startPointer.x) / size.w;
      const dy = (p.y - editSession.startPointer.y) / size.h;
      const next = applyRegionEdit(editSession.startRegion, editSession.handle, { dx, dy });
      setLiveRegions((prev) => ({ ...prev, [editSession.personId]: next }));
    };

    const finishEdit = () => {
      setLiveRegions((prev) => {
        const final = prev[editSession.personId];
        if (final && onRegionChange) {
          onRegionChange(editSession.personId, final);
        }
        const next = { ...prev };
        delete next[editSession.personId];
        return next;
      });
      setEditSession(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', finishEdit);
    window.addEventListener('pointercancel', finishEdit);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finishEdit);
      window.removeEventListener('pointercancel', finishEdit);
    };
  }, [editSession, onRegionChange, pointerPosFromClient, size.w, size.h]);

  const displayHighlights = highlights.map((h) => ({
    ...h,
    region: liveRegions[h.personId] ?? h.region,
  }));

  const overlayInteractive = drawing || editable;

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        display: 'inline-block',
        maxWidth: '100%',
        lineHeight: 0,
        cursor: drawing ? 'crosshair' : 'default',
        touchAction: overlayInteractive ? 'none' : 'auto',
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
              setDrawDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
            }
          : undefined
      }
      onPointerMove={
        drawing
          ? (e) => {
              if (!drawDrag) {
                return;
              }
              const p = pointerPos(e);
              setDrawDrag((d) => (d ? { ...d, x1: p.x, y1: p.y } : null));
            }
          : undefined
      }
      onPointerUp={
        drawing
          ? (e) => {
              if (!drawDrag) {
                return;
              }
              finishDraw(pointerPos(e));
            }
          : undefined
      }
      onPointerCancel={
        drawing
          ? () => {
              setDrawDrag(null);
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
            pointerEvents: overlayInteractive ? 'auto' : 'none',
          }}
        >
          {editable
            ? displayHighlights.map((h) => (
                <EditableRegionBox
                  key={h.personId}
                  highlight={h}
                  editable={editable && !drawing}
                  onPointerDownHandle={beginEdit}
                  onRegionFocus={onRegionFocus}
                />
              ))
            : displayHighlights.map((h) => {
                const pct = regionToPercent(clampRegion(h.region));
                return (
                  <Box
                    key={h.personId}
                    sx={{
                      position: 'absolute',
                      ...pct,
                      boxSizing: 'border-box',
                      borderStyle: h.dimmed ? 'dashed' : 'solid',
                      borderWidth: h.active ? 3 : 1,
                      borderColor: h.active ? 'warning.main' : h.dimmed ? 'grey.400' : 'primary.light',
                      bgcolor: h.active
                        ? 'rgba(255, 193, 7, 0.5)'
                        : h.dimmed
                          ? 'rgba(0, 0, 0, 0.04)'
                          : 'rgba(25, 118, 210, 0.12)',
                      borderRadius: 0.5,
                      opacity: h.dimmed ? 0.45 : 1,
                      zIndex: h.active ? 2 : 1,
                      transition:
                        'background-color 0.15s, border-color 0.15s, opacity 0.15s, border-width 0.15s',
                      boxShadow: h.active ? '0 0 0 2px rgba(255, 193, 7, 0.35)' : 'none',
                      pointerEvents: 'none',
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
                zIndex: 5,
              }}
            />
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
