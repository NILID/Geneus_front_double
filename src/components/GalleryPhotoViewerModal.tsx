import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { resolveRailsBlobUrl } from '../api/assetUrls';
import type { GalleryMasonryItem } from '../api/galleryPhotoApi';

import { GalleryPhotoCommentsPanel } from './GalleryPhotoCommentsPanel';
import { GalleryPhotoRegionOverlay } from './GalleryPhotoRegionOverlay';
import { GalleryPhotoTaggedPeopleLinks } from './GalleryPhotoTaggedPeople';

function formatMetaDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export interface GalleryPhotoViewerModalProps {
  open: boolean;
  onClose: () => void;
  photos: GalleryMasonryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  currentUserId?: number | null;
  onCommentsCountChange?: (photoId: number, commentsCount: number) => void;
}

export function GalleryPhotoViewerModal({
  open,
  onClose,
  photos,
  index,
  onIndexChange,
  currentUserId,
  onCommentsCountChange,
}: GalleryPhotoViewerModalProps) {
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const [hoveredPersonId, setHoveredPersonId] = useState<number | null>(null);

  const safeLen = photos.length;
  const safeIndex = safeLen > 0 ? Math.min(Math.max(index, 0), safeLen - 1) : 0;
  const item = photos[safeIndex];

  const goPrev = useCallback(() => {
    if (safeLen <= 1) {
      return;
    }
    onIndexChange((safeIndex + safeLen - 1) % safeLen);
  }, [onIndexChange, safeIndex, safeLen]);

  const goNext = useCallback(() => {
    if (safeLen <= 1) {
      return;
    }
    onIndexChange((safeIndex + 1) % safeLen);
  }, [onIndexChange, safeIndex, safeLen]);

  useEffect(() => {
    setHoveredPersonId(null);
  }, [item?.id, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, goPrev, goNext]);

  const captionTitle = useMemo(() => {
    if (!item) {
      return '';
    }
    const t = item.caption?.trim() ? item.caption : 'Без подписи';
    const year = item.taken_year != null && !Number.isNaN(item.taken_year) ? item.taken_year : null;
    return year != null ? `${t} · ${year}` : t;
  }, [item]);

  if (!open || safeLen === 0 || !item) {
    return null;
  }

  const tagged = item.tagged_people ?? [];
  const showNav = safeLen > 1;

  const sidebar = (
    <Box
      sx={{
        width: { xs: '100%', md: 380 },
        maxWidth: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.900',
        color: 'grey.200',
        borderLeft: { xs: 0, md: 1 },
        borderTop: { xs: 1, md: 0 },
        borderColor: 'grey.800',
        maxHeight: { xs: '42vh', md: '100%' },
        minHeight: 0,
      }}
    >
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'common.white', mb: 1, lineHeight: 1.35 }}>
          {captionTitle}
        </Typography>
        {item.uploaded_by_email ? (
          <Typography variant="body2" sx={{ color: 'grey.500', mb: 0.5 }}>
            Загрузил: {item.uploaded_by_email}
          </Typography>
        ) : null}
        <Typography variant="caption" sx={{ color: 'grey.600', display: 'block', mb: 1 }}>
          {formatMetaDate(item.created_at)}
        </Typography>
        {tagged.length > 0 ? (
          <Box sx={{ color: 'grey.400', typography: 'body2' }}>
            <GalleryPhotoTaggedPeopleLinks
              tagged={tagged}
              onPersonClick={onClose}
              onPersonHighlight={setHoveredPersonId}
              highlightedPersonId={hoveredPersonId}
              showTouchHint
            />
          </Box>
        ) : null}
      </Box>

      <Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', px: 0, pb: 2 }}>
        <GalleryPhotoCommentsPanel
          key={item.id}
          photoId={item.id}
          currentUserId={currentUserId}
          onCommentsCountChange={onCommentsCountChange}
          surface="dark"
          sx={{ flex: '1 1 auto', minHeight: 0, borderTop: 1, borderColor: 'grey.800', pt: 1.5 }}
        />
      </Box>
    </Box>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{
        backdrop: {
          sx: { bgcolor: 'rgba(0,0,0,0.92)' },
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            height: '100%',
            maxHeight: '100dvh',
            display: 'flex',
            flexDirection: isNarrow ? 'column' : 'row',
            outline: 0,
            overflow: 'hidden',
          }}
        >
          <IconButton
            onClick={onClose}
            aria-label="Закрыть"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
              color: 'common.white',
              bgcolor: 'rgba(0,0,0,0.35)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
            }}
            size="large"
          >
            <CloseIcon fontSize="medium" />
          </IconButton>

          <Box
            sx={{
              flex: isNarrow ? '1 1 0' : '1 1 auto',
              minWidth: 0,
              minHeight: 0,
              height: isNarrow ? undefined : '100%',
              maxHeight: isNarrow ? 'calc(100dvh - 42vh)' : '100dvh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              bgcolor: '#000',
              overflow: 'hidden',
              py: { xs: 1, md: 2 },
              px: showNav ? { xs: 5, md: 7 } : 2,
            }}
          >
            <Typography
              variant="body2"
              aria-live="polite"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 2,
                color: 'common.white',
                bgcolor: 'rgba(0,0,0,0.45)',
                px: 1.25,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 500,
                letterSpacing: '0.02em',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {safeIndex + 1} из {safeLen}
            </Typography>

            {showNav ? (
              <IconButton
                onClick={goPrev}
                aria-label="Предыдущее фото"
                sx={{
                  position: 'absolute',
                  left: { xs: 4, md: 12 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                }}
                size="large"
              >
                <ChevronLeftIcon fontSize="large" />
              </IconButton>
            ) : null}

            {resolveRailsBlobUrl(item.image_url) ? (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
              <GalleryPhotoRegionOverlay
                imageUrl={resolveRailsBlobUrl(item.image_url)!}
                alt={item.caption ?? ''}
                maxHeight={
                  isNarrow ? 'calc(100dvh - 42vh - 16px)' : 'calc(100dvh - 32px)'
                }
                maxWidth="100%"
                highlights={
                  hoveredPersonId != null
                    ? tagged
                        .filter((p) => p.id === hoveredPersonId && p.region != null)
                        .map((p) => ({
                          personId: p.id,
                          region: p.region!,
                          active: true,
                        }))
                    : []
                }
                onTouchOutsideHighlight={
                  !canHover ? () => setHoveredPersonId(null) : undefined
                }
              />
              </Box>
            ) : (
              <Typography color="grey.500">Нет изображения</Typography>
            )}

            {showNav ? (
              <IconButton
                onClick={goNext}
                aria-label="Следующее фото"
                sx={{
                  position: 'absolute',
                  right: { xs: 4, md: 12 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                }}
                size="large"
              >
                <ChevronRightIcon fontSize="large" />
              </IconButton>
            ) : null}
          </Box>

          {sidebar}
        </Box>
      </Fade>
    </Modal>
  );
}
