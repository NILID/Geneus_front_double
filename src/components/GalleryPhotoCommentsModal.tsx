import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';

import { GalleryPhotoCommentsPanel } from './GalleryPhotoCommentsPanel';

export interface GalleryPhotoCommentsModalProps {
  open: boolean;
  onClose: () => void;
  photoId: number;
  currentUserId?: number | null;
  onCommentsCountChange?: (photoId: number, commentsCount: number) => void;
}

/**
 * Полноэкранное (на мобильном) окно комментариев к фото галереи.
 * Рендерится поверх {@link GalleryPhotoViewerModal} (больший z-index).
 */
export function GalleryPhotoCommentsModal({
  open,
  onClose,
  photoId,
  currentUserId,
  onCommentsCountChange,
}: GalleryPhotoCommentsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      slotProps={{
        backdrop: {
          sx: { bgcolor: 'rgba(0,0,0,0.75)' },
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            maxHeight: '100vh',
            '@supports (height: 100dvh)': {
              maxHeight: '100dvh',
            },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.900',
            color: 'grey.200',
            outline: 0,
            overflow: 'hidden',
            pb: 'env(safe-area-inset-bottom, 0px)',
            pt: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              px: 1,
              py: 1,
              borderBottom: 1,
              borderColor: 'grey.800',
            }}
          >
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, pl: 1 }}>
              Комментарии
            </Typography>
            <IconButton onClick={onClose} aria-label="Закрыть комментарии" color="inherit" size="large">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <GalleryPhotoCommentsPanel
              key={photoId}
              photoId={photoId}
              currentUserId={currentUserId}
              onCommentsCountChange={onCommentsCountChange}
              surface="dark"
              hideSectionTitle
              sx={{
                flex: '1 1 auto',
                minHeight: 0,
                height: '100%',
                px: 2,
                py: 1.5,
                pt: 2,
              }}
            />
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
