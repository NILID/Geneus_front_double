import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { SxProps, Theme } from '@mui/material/styles';

/** Колонки сетки галереи: 1 / 2 / 4 по брейкпоинтам (страница «Медиа», профиль персоны). */
export function useGalleryPhotoGridCols(): number {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  return isMdUp ? 4 : isSmUp ? 2 : 1;
}

/** Главная: до 5 карточек в ряд на широком экране (всего 10 последних фото). */
export function useHomeGalleryPhotoGridCols(): number {
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  if (isLgUp) {
    return 5;
  }
  if (isMdUp) {
    return 3;
  }
  if (isSmUp) {
    return 2;
  }
  return 1;
}

export function galleryPhotoGridSx(cols: number, gapPx: number): SxProps<Theme> {
  return {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: `${gapPx}px`,
    mb: 0,
  };
}
