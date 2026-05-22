import React, { useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';

export interface ImageLightboxModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

/** Полноэкранный просмотр одного изображения (без боковой панели и навигации). */
export function ImageLightboxModal({ open, onClose, imageUrl, alt = '' }: ImageLightboxModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 0,
            p: 2,
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
            component="img"
            src={imageUrl}
            alt={alt}
            sx={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 32px)',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Box>
      </Fade>
    </Modal>
  );
}
