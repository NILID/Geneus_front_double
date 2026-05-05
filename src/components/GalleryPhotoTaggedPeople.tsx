import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

import { type GalleryTaggedPerson } from '../api/galleryPhotoApi';
import { personDisplayName } from '../api/personApi';

export function galleryPersonPath(id: number): string {
  return `/person/${encodeURIComponent(String(id))}`;
}

export function GalleryPhotoTaggedPeopleLinks({
  tagged,
  onPersonClick,
}: {
  tagged: GalleryTaggedPerson[];
  /** Вызвать перед переходом (например, закрыть просмотр фото) */
  onPersonClick?: () => void;
}) {
  if (tagged.length === 0) {
    return null;
  }
  return (
    <Box component="span" sx={{ display: 'block' }}>
      На фото:{' '}
      {tagged.map((p, i) => (
        <React.Fragment key={p.id}>
          {i > 0 ? ', ' : null}
          <Link
            component={RouterLink}
            to={galleryPersonPath(p.id)}
            color="inherit"
            variant="inherit"
            underline="hover"
            onClick={(e) => {
              e.stopPropagation();
              onPersonClick?.();
            }}
          >
            {personDisplayName(p)}
          </Link>
        </React.Fragment>
      ))}
    </Box>
  );
}
