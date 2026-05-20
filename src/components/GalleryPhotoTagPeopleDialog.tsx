import React, { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import type { GalleryPhoto } from '../api/galleryPhotoApi';
import type { GalleryPersonTagInput } from '../gallery/galleryPhotoRegion';
import type { ChartPersonOption } from '../familyChartApi';

import { GalleryPhotoPersonTagEditor } from './GalleryPhotoPersonTagEditor';

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

  useEffect(() => {
    if (!open || !photo) {
      return;
    }
    setTags(
      (photo.tagged_people ?? []).map((p) => ({
        person_id: p.id,
        region: p.region ?? null,
      })),
    );
  }, [open, photo]);

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
      <DialogTitle>Отметить персон на фото</DialogTitle>
      <DialogContent>
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
        <Button onClick={() => !saving && onClose()} disabled={saving}>
          Отмена
        </Button>
        <Button
          variant="contained"
          disabled={saving || !photo}
          onClick={() => void onSave(tags)}
        >
          {saving ? 'Сохранение…' : 'Сохранить отметки'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
