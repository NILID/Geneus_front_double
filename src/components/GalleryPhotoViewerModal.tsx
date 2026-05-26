import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
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

type MobileSheet = 'info' | 'comments';

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

const mobileDrawerPaperSx = {
  maxHeight: 'min(85dvh, 640px)',
  bgcolor: 'grey.900',
  color: 'grey.200',
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
} as const;

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
  const [mobileSheet, setMobileSheet] = useState<MobileSheet | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);

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

  const handleCommentsCountChange = useCallback(
    (photoId: number, count: number) => {
      setCommentsCount(count);
      onCommentsCountChange?.(photoId, count);
    },
    [onCommentsCountChange],
  );

  useEffect(() => {
    setHoveredPersonId(null);
    setMobileSheet(null);
  }, [item?.id, open]);

  useEffect(() => {
    if (!isNarrow) {
      setMobileSheet(null);
    }
  }, [isNarrow]);

  useEffect(() => {
    setCommentsCount(item?.comments_count ?? 0);
  }, [item?.id, item?.comments_count]);

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
        if (isNarrow && mobileSheet) {
          setMobileSheet(null);
          return;
        }
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
  }, [open, onClose, goPrev, goNext, isNarrow, mobileSheet]);

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

  const photoDetails = (
    <>
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
    </>
  );

  const desktopSidebar = (
    <Box
      sx={{
        width: 380,
        maxWidth: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.900',
        color: 'grey.200',
        borderLeft: 1,
        borderColor: 'grey.800',
        maxHeight: '100%',
        minHeight: 0,
      }}
    >
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, flexShrink: 0 }}>{photoDetails}</Box>

      <Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', px: 0, pb: 2 }}>
        <GalleryPhotoCommentsPanel
          key={item.id}
          photoId={item.id}
          currentUserId={currentUserId}
          onCommentsCountChange={handleCommentsCountChange}
          surface="dark"
          sx={{ flex: '1 1 auto', minHeight: 0, borderTop: 1, borderColor: 'grey.800', pt: 1.5 }}
        />
      </Box>
    </Box>
  );

  const mobileActionBar = (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        gap: 1,
        px: 1.5,
        pt: 1,
        pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        bgcolor: 'grey.900',
        borderTop: 1,
        borderColor: 'grey.800',
      }}
    >
      <Button
        fullWidth
        variant={mobileSheet === 'info' ? 'contained' : 'outlined'}
        color="inherit"
        startIcon={<InfoOutlinedIcon />}
        onClick={() => setMobileSheet((s) => (s === 'info' ? null : 'info'))}
        sx={{
          color: 'grey.100',
          borderColor: 'grey.700',
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        Инфо
      </Button>
      <Button
        fullWidth
        variant={mobileSheet === 'comments' ? 'contained' : 'outlined'}
        color="inherit"
        startIcon={<CommentOutlinedIcon />}
        onClick={() => setMobileSheet((s) => (s === 'comments' ? null : 'comments'))}
        sx={{
          color: 'grey.100',
          borderColor: 'grey.700',
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        {commentsCount > 0 ? `Комментарии (${commentsCount})` : 'Комментарии'}
      </Button>
    </Box>
  );

  const drawerZIndex = theme.zIndex.modal + 1;

  const mobileInfoDrawer = (
    <Drawer
      anchor="bottom"
      open={mobileSheet === 'info'}
      onClose={() => setMobileSheet(null)}
      sx={{ zIndex: drawerZIndex }}
      slotProps={{ paper: { sx: mobileDrawerPaperSx } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5, pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'common.white' }}>
          Информация
        </Typography>
        <IconButton aria-label="Закрыть" onClick={() => setMobileSheet(null)} sx={{ color: 'grey.400' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ px: 2.5, pb: 2.5, overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>{photoDetails}</Box>
    </Drawer>
  );

  const mobileCommentsDrawer = (
    <Drawer
      anchor="bottom"
      open={mobileSheet === 'comments'}
      onClose={() => setMobileSheet(null)}
      sx={{ zIndex: drawerZIndex }}
      slotProps={{ paper: { sx: mobileDrawerPaperSx } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'common.white' }}>
          Комментарии{commentsCount > 0 ? ` (${commentsCount})` : ''}
        </Typography>
        <IconButton aria-label="Закрыть" onClick={() => setMobileSheet(null)} sx={{ color: 'grey.400' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      {mobileSheet === 'comments' ? (
        <GalleryPhotoCommentsPanel
          key={item.id}
          photoId={item.id}
          currentUserId={currentUserId}
          onCommentsCountChange={handleCommentsCountChange}
          surface="dark"
          hideTitle
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          }}
        />
      ) : null}
    </Drawer>
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
      <>
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
              flex: '1 1 0',
              minWidth: 0,
              minHeight: 0,
              height: isNarrow ? undefined : '100%',
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
                  maxHeight={isNarrow ? '100%' : 'calc(100dvh - 32px)'}
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

          {isNarrow ? mobileActionBar : desktopSidebar}
        </Box>
      </Fade>

      {isNarrow ? (
        <>
          {mobileInfoDrawer}
          {mobileCommentsDrawer}
        </>
      ) : null}
      </>
    </Modal>
  );
}
