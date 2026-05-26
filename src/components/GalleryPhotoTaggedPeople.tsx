import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';

import { type GalleryTaggedPerson } from '../api/galleryPhotoApi';
import { personDisplayName } from '../api/personApi';

export function galleryPersonPath(id: number): string {
  return `/person/${encodeURIComponent(String(id))}`;
}

export function GalleryPhotoTaggedPeopleLinks({
  tagged,
  onPersonClick,
  onPersonHighlight,
  highlightedPersonId,
  showTouchHint,
}: {
  tagged: GalleryTaggedPerson[];
  /** Вызвать перед переходом (например, закрыть просмотр фото) */
  onPersonClick?: () => void;
  /** Подсветка области на фото (hover на десктопе, нажатие на сенсорных экранах) */
  onPersonHighlight?: (personId: number | null) => void;
  highlightedPersonId?: number | null;
  /** Подсказка для touch: «нажмите на имя…» */
  showTouchHint?: boolean;
}) {
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const hasHighlightable = tagged.some((p) => p.region != null);

  if (tagged.length === 0) {
    return null;
  }

  function handleLinkClick(e: React.MouseEvent, p: GalleryTaggedPerson) {
    e.stopPropagation();
    const hasRegion = p.region != null;

    if (onPersonHighlight && hasRegion && !canHover) {
      if (highlightedPersonId === p.id) {
        onPersonHighlight(null);
        onPersonClick?.();
        return;
      }
      e.preventDefault();
      onPersonHighlight(p.id);
      return;
    }

    onPersonClick?.();
  }

  return (
    <Box component="span" sx={{ display: 'block' }}>
      На фото:{' '}
      {tagged.map((p, i) => {
        const isHighlighted = highlightedPersonId === p.id;
        const touchTarget = onPersonHighlight && p.region != null && !canHover;
        return (
          <React.Fragment key={p.id}>
            {i > 0 ? ', ' : null}
            <Link
              component={RouterLink}
              to={galleryPersonPath(p.id)}
              color="inherit"
              variant="inherit"
              underline="hover"
              sx={{
                fontWeight: isHighlighted ? 700 : 400,
                color: isHighlighted ? 'warning.main' : 'inherit',
                ...(touchTarget
                  ? {
                      py: 0.25,
                      px: 0.25,
                      mx: -0.25,
                      borderRadius: 0.5,
                      WebkitTapHighlightColor: 'transparent',
                    }
                  : {}),
              }}
              onMouseEnter={canHover && onPersonHighlight ? () => onPersonHighlight(p.id) : undefined}
              onMouseLeave={canHover && onPersonHighlight ? () => onPersonHighlight(null) : undefined}
              onFocus={canHover && onPersonHighlight ? () => onPersonHighlight(p.id) : undefined}
              onBlur={canHover && onPersonHighlight ? () => onPersonHighlight(null) : undefined}
              onClick={(e) => handleLinkClick(e, p)}
            >
              {personDisplayName(p)}
            </Link>
          </React.Fragment>
        );
      })}
      {showTouchHint && hasHighlightable && !canHover && onPersonHighlight ? (
        <Box
          component="span"
          sx={{ display: 'block', mt: 0.75, color: 'grey.600', typography: 'caption', lineHeight: 1.35 }}
        >
          Нажмите на имя, чтобы показать человека на фото. Нажмите на другое место фото, чтобы скрыть
          рамку. Повторное нажатие на имя — открыть профиль.
        </Box>
      ) : null}
    </Box>
  );
}
