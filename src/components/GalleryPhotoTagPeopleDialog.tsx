import React, { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import type { GalleryPhoto } from '../api/galleryPhotoApi';
import { arePersonTagsEqual, type GalleryPersonTagInput } from '../gallery/galleryPhotoRegion';
import type { ChartPersonOption } from '../familyChartApi';

import { GalleryPhotoPersonTagEditor } from './GalleryPhotoPersonTagEditor';

function photoToTagInputs(photo: GalleryPhoto): GalleryPersonTagInput[] {
  return (photo.tagged_people ?? []).map((p) => ({
    person_id: p.id,
    region: p.region ?? null,
  }));
}

export function GalleryPhotoTagPeopleDialog({
  photo,
  chartPeople,
  open,
  saving,
  error,
  onClose,
  onSave,
}: {
  photo: GalleryPhoto | null;
  chartPeople: ChartPersonOption[];
  open: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (tags: GalleryPersonTagInput[]) => void | Promise<void>;
}) {
  const [tags, setTags] = useState<GalleryPersonTagInput[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<GalleryPersonTagInput[]>([]);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  useEffect(() => {
    if (!open || !photo) {
      return;
    }
    const initial = photoToTagInputs(photo);
    setTags(initial);
    setSavedSnapshot(initial);
    setConfirmDiscardOpen(false);
  }, [open, photo]);

  const isDirty = useMemo(
    () => open && photo != null && !arePersonTagsEqual(tags, savedSnapshot),
    [open, photo, tags, savedSnapshot],
  );

  function requestClose() {
    if (saving) {
      return;
    }
    if (isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    onClose();
  }

  function confirmDiscard() {
    setConfirmDiscardOpen(false);
    onClose();
  }

  async function handleSave() {
    await onSave(tags);
    setSavedSnapshot(tags);
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (saving) {
            return;
          }
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            requestClose();
          }
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Отметить персон на фото</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0 }}>
          {photo ? (
            <GalleryPhotoPersonTagEditor
              key={photo.id}
              imageUrl={photo.image_url}
              caption={photo.caption}
              chartPeople={chartPeople}
              initialTagged={photo.tagged_people ?? []}
              disabled={saving}
              onChange={setTags}
            />
          ) : null}
          {error ? (
            <Alert severity="error" role="alert" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={requestClose} disabled={saving}>
            Отмена
          </Button>
          <Button variant="contained" disabled={saving || !photo} onClick={() => void handleSave()}>
            {saving ? 'Сохранение…' : 'Сохранить отметки'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Несохранённые изменения</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Внесённые изменения не сохранены. Вы точно хотите выйти?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDiscardOpen(false)}>Остаться</Button>
          <Button color="warning" onClick={confirmDiscard}>
            Выйти без сохранения
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
