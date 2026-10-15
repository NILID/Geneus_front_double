import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { resolveRailsBlobUrl } from '../api/assetUrls';

export interface GalleryPhotoPolaroidCardProps {
  imageUrl: string | null | undefined;
  alt: string;
  onClick?: () => void;
  /** Год съёмки или подпись в нижней полосе */
  caption?: React.ReactNode;
  /** Теги, комментарии и т.п. */
  footer?: React.ReactNode;
  /** Меню действий (шестерёнка) */
  action?: React.ReactNode;
}

export function GalleryPhotoPolaroidCard({
  imageUrl,
  alt,
  onClick,
  caption,
  footer,
  action,
}: GalleryPhotoPolaroidCardProps) {
  const resolved = resolveRailsBlobUrl(imageUrl);
  const hasCaption = Boolean(caption);
  const hasMeta = Boolean(footer) || hasCaption || action;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'block',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: (t) => (t.palette.mode === 'dark' ? 'grey.900' : 'grey.300'),
        lineHeight: 0,
      }}
    >
      {resolved ? (
        <Box
          component="img"
          src={resolved}
          alt={alt}
          loading="lazy"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : null}
      {onClick ? (
        <Box
          component="button"
          type="button"
          onClick={onClick}
          aria-label="Открыть фото"
          sx={{
            position: 'absolute',
            inset: 0,
            p: 0,
            m: 0,
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'inherit',
            font: 'inherit',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: -2,
            },
          }}
        />
      ) : null}
      {hasMeta ? (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.5,
            px: 1,
            py: 0.75,
            bgcolor: 'rgba(0, 0, 0, 0.55)',
            color: 'common.white',
            lineHeight: 1.35,
            pointerEvents: 'none',
            '& a, & button': { pointerEvents: 'auto' },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
            {hasCaption ? (
              <Typography
                component="div"
                variant="caption"
                sx={{ fontWeight: 600, lineHeight: 1.3, color: 'common.white' }}
              >
                {caption}
              </Typography>
            ) : null}
            {footer ? (
              <Box
                sx={{
                  mt: hasCaption ? 0.35 : 0,
                  typography: 'caption',
                  color: 'grey.200',
                  lineHeight: 1.35,
                  '& a': { color: 'grey.100' },
                }}
              >
                {footer}
              </Box>
            ) : null}
          </Box>
          {action ? (
            <Box
              sx={{ flexShrink: 0, alignSelf: 'flex-end', mr: -0.5, lineHeight: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              {action}
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
