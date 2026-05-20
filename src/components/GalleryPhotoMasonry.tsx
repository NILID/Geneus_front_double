import React, { useId, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import CommentIcon from '@mui/icons-material/Comment';
import type { SxProps, Theme } from '@mui/material/styles';

import { resolveRailsBlobUrl } from '../api/assetUrls';
import type { GalleryMasonryItem } from '../api/galleryPhotoApi';
import { GalleryPhotoTaggedPeopleLinks } from './GalleryPhotoTaggedPeople';
import { GalleryPhotoViewerModal } from './GalleryPhotoViewerModal';

export type { GalleryMasonryItem } from '../api/galleryPhotoApi';

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
  onTagPeople,
  onDelete,
}: {
  menuInstanceId: string;
  onEdit?: () => void;
  onTagPeople?: () => void;
  onDelete?: () => void;
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
        {onEdit ? (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onEdit();
            }}
          >
            Редактировать
          </MenuItem>
        ) : null}
        {onTagPeople ? (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onTagPeople();
            }}
          >
            Отметить персон
          </MenuItem>
        ) : null}
        {onDelete ? (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onDelete();
            }}
          >
            Удалить
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}

export interface GalleryPhotoMasonryProps {
  photos: GalleryMasonryItem[];
  cols: number;
  gap?: number;
  /** Заголовок над сеткой (например, на странице персоны) */
  title?: React.ReactNode;
  currentUserId?: number | null;
  onEdit?: (item: GalleryMasonryItem) => void;
  /** Разметка персон на фото (отдельно от редактирования метаданных). */
  onTagPeople?: (item: GalleryMasonryItem) => void;
  onDelete?: (id: number) => void;
  /** Префикс для id меню (уникальность при нескольких галереях на странице) */
  menuIdPrefix?: string;
  /** После добавления комментария в просмотре — обновить счётчик в родительском состоянии */
  onGalleryPhotoCommentsCountChange?: (photoId: number, commentsCount: number) => void;
  sx?: SxProps<Theme>;
}

export function GalleryPhotoMasonry({
  photos,
  cols,
  gap = 12,
  title,
  currentUserId,
  onEdit,
  onTagPeople,
  onDelete,
  menuIdPrefix = 'gallery-photo',
  onGalleryPhotoCommentsCountChange,
  sx,
}: GalleryPhotoMasonryProps) {
  const reactId = useId();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (photos.length === 0) {
    return null;
  }

  const canManage = Boolean(currentUserId != null && (onEdit || onTagPeople || onDelete));

  return (
    <Box sx={sx}>
      <GalleryPhotoViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photos={photos}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        currentUserId={currentUserId}
        onCommentsCountChange={onGalleryPhotoCommentsCountChange}
      />
      {title}
      <ImageList variant="masonry" cols={cols} gap={gap} sx={{ width: '100%', mb: 0 }}>
        {photos.map((item, photoIndex) => {
          const tagged = item.tagged_people ?? [];
          const commentCount = item.comments_count ?? 0;
          const subtitleNode = (
            <Box component="span" sx={{ display: 'block' }}>
              {tagged.length > 0 ? <GalleryPhotoTaggedPeopleLinks tagged={tagged} /> : null}
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: tagged.length > 0 ? 0.5 : 0,
                  opacity: 0.9,
                }}
                aria-label={`Комментариев: ${commentCount}`}
              >
                <CommentIcon sx={{ width: 14, height: 14 }} />
                <Typography component="span" variant="caption" sx={{ lineHeight: 1.2 }}>
                  {commentCount}
                </Typography>
              </Box>
            </Box>
          );
          const isOwner = canManage && item.user_id === currentUserId;
          const year = item.taken_year != null && !Number.isNaN(item.taken_year) ? item.taken_year : null;
          const titleText = item.caption?.trim() ? item.caption : 'Без подписи';
          const barTitle = year != null ? `${titleText} (${year})` : titleText;

          return (
            <ImageListItem key={item.id} sx={{ overflow: 'hidden', borderRadius: 1 }}>
              {resolveRailsBlobUrl(item.image_url) ? (
                <Box
                  component="button"
                  type="button"
                  onClick={() => {
                    setViewerIndex(photoIndex);
                    setViewerOpen(true);
                  }}
                  aria-label="Открыть фото"
                  sx={{
                    display: 'block',
                    width: '100%',
                    p: 0,
                    m: 0,
                    border: 0,
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    lineHeight: 0,
                    color: 'inherit',
                    font: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <img
                    src={resolveRailsBlobUrl(item.image_url)}
                    alt={item.caption ?? ''}
                    loading="lazy"
                    style={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'bottom' }}
                  />
                </Box>
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
                      onEdit={onEdit ? () => onEdit(item) : undefined}
                      onTagPeople={onTagPeople ? () => onTagPeople(item) : undefined}
                      onDelete={onDelete ? () => onDelete(item.id) : undefined}
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
