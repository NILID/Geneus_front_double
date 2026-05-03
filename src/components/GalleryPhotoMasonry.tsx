import React, { useEffect, useId, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Fancybox } from '@fancyapps/ui/dist/fancybox/';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';
import type { SxProps, Theme } from '@mui/material/styles';

import { type GalleryTaggedPerson } from '../api/galleryPhotoApi';
import { personDisplayName } from '../api/personApi';
import useFancybox from '../hooks/useFancybox';

export interface GalleryMasonryItem {
  id: number;
  caption: string | null;
  taken_year?: number | null;
  image_url: string | null;
  created_at: string;
  uploaded_by_email?: string | null;
  tagged_people?: GalleryTaggedPerson[];
  user_id?: number;
}

function GearIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fontSize="inherit">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.499.499 0 0 0-.59.22l-1.92 3.32c-.12.22-.07.47.12.61l2.03 1.58c-.05.31-.08.63-.08.94s.03.63.06.94l-2.03 1.58a.499.499 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </SvgIcon>
  );
}

function OwnerPhotoMenu({
  menuInstanceId,
  onEdit,
  onDelete,
}: {
  menuInstanceId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        sx={{ color: 'common.white' }}
        aria-label="Действия с фото"
        aria-controls={open ? menuInstanceId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
      >
        <GearIcon fontSize="small" />
      </IconButton>
      <Menu
        id={menuInstanceId}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit();
          }}
        >
          Редактировать
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete();
          }}
        >
          Удалить
        </MenuItem>
      </Menu>
    </>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function personPath(id: number): string {
  return `/person/${encodeURIComponent(String(id))}`;
}

function fancyCaptionHtmlForItem(item: GalleryMasonryItem): string {
  const cap = item.caption?.trim() ? escapeHtml(item.caption) : 'Без подписи';
  const parts: string[] = [cap];
  if (item.taken_year != null && !Number.isNaN(item.taken_year)) {
    parts.push(`Год съёмки: ${escapeHtml(String(item.taken_year))}`);
  }
  if (item.uploaded_by_email !== undefined) {
    parts.push(escapeHtml(item.uploaded_by_email ?? 'Неизвестно'));
  }
  parts.push(escapeHtml(new Date(item.created_at).toLocaleString()));
  const tagged = item.tagged_people;
  if (tagged && tagged.length > 0) {
    const links = tagged
      .map(
        (p) =>
          `<a href="${escapeHtml(personPath(p.id))}">${escapeHtml(personDisplayName(p))}</a>`,
      )
      .join(', ');
    parts.push(`На фото: ${links}`);
  }
  return parts.filter((s) => s !== '').join(' · ');
}

function TaggedPeopleSubtitle({ tagged }: { tagged: GalleryTaggedPerson[] }) {
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
            to={personPath(p.id)}
            color="inherit"
            variant="inherit"
            underline="hover"
            onClick={(e) => e.stopPropagation()}
          >
            {personDisplayName(p)}
          </Link>
        </React.Fragment>
      ))}
    </Box>
  );
}

export interface GalleryPhotoMasonryProps {
  photos: GalleryMasonryItem[];
  /** Значение `data-fancybox` — группа слайдов в лайтбоксе */
  fancyboxGroup: string;
  cols: number;
  gap?: number;
  /** Заголовок над сеткой (например, на странице персоны) */
  title?: React.ReactNode;
  currentUserId?: number | null;
  onEdit?: (item: GalleryMasonryItem) => void;
  onDelete?: (id: number) => void;
  /** Префикс для id меню (уникальность при нескольких галереях на странице) */
  menuIdPrefix?: string;
  sx?: SxProps<Theme>;
}

export function GalleryPhotoMasonry({
  photos,
  fancyboxGroup,
  cols,
  gap = 12,
  title,
  currentUserId,
  onEdit,
  onDelete,
  menuIdPrefix = 'gallery-photo',
  sx,
}: GalleryPhotoMasonryProps) {
  const reactId = useId();
  const navigate = useNavigate();
  const [setFancyboxRoot] = useFancybox({});

  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) {
        return;
      }
      const a = t.closest('a[href^="/person/"]');
      if (!(a instanceof HTMLAnchorElement) || !a.closest('.fancybox__dialog')) {
        return;
      }
      const href = a.getAttribute('href');
      if (!href?.startsWith('/person/')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      void Fancybox.close();
      navigate(href);
    };
    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, [navigate]);

  if (photos.length === 0) {
    return null;
  }

  const canManage = Boolean(onEdit && onDelete && currentUserId != null);

  return (
    <Box ref={setFancyboxRoot} sx={sx}>
      {title}
      <ImageList variant="masonry" cols={cols} gap={gap} sx={{ width: '100%', mb: 0 }}>
        {photos.map((item) => {
          const fancyCaptionHtml = fancyCaptionHtmlForItem(item);
          const tagged = item.tagged_people ?? [];
          const subtitleNode = tagged.length > 0 ? <TaggedPeopleSubtitle tagged={tagged} /> : undefined;
          const isOwner = canManage && item.user_id === currentUserId;
          const year = item.taken_year != null && !Number.isNaN(item.taken_year) ? item.taken_year : null;
          const titleText = item.caption?.trim() ? item.caption : 'Без подписи';
          const barTitle = year != null ? `${titleText} (${year})` : titleText;

          return (
            <ImageListItem key={item.id} sx={{ overflow: 'hidden', borderRadius: 1 }}>
              {item.image_url ? (
                <a
                  href={item.image_url}
                  data-fancybox={fancyboxGroup}
                  data-caption={fancyCaptionHtml}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    lineHeight: 0,
                  }}
                >
                  <img
                    src={item.image_url}
                    alt={item.caption ?? ''}
                    loading="lazy"
                    style={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'bottom' }}
                  />
                </a>
              ) : (
                <Box sx={{ minHeight: 120, bgcolor: 'action.hover' }} />
              )}
              <ImageListItemBar
                title={barTitle}
                subtitle={subtitleNode}
                position="bottom"
                actionIcon={
                  isOwner ? (
                    <OwnerPhotoMenu
                      menuInstanceId={`${menuIdPrefix}-menu-${reactId}-${item.id}`}
                      onEdit={() => onEdit!(item)}
                      onDelete={() => onDelete!(item.id)}
                    />
                  ) : undefined
                }
                actionPosition="right"
              />
            </ImageListItem>
          );
        })}
      </ImageList>
    </Box>
  );
}
