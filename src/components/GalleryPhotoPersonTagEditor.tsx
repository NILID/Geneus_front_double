import React, { useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { resolveRailsBlobUrl } from '../api/assetUrls';
import type { GalleryPersonTagInput } from '../gallery/galleryPhotoRegion';
import type { GalleryPhotoRegion } from '../gallery/galleryPhotoRegion';
import { personDisplayName } from '../api/personApi';
import type { ChartPersonOption } from '../familyChartApi';
import type { GalleryTaggedPerson } from '../api/galleryPhotoApi';

import { GalleryPhotoRegionOverlay } from './GalleryPhotoRegionOverlay';

function taggedToInputs(tagged: GalleryTaggedPerson[]): GalleryPersonTagInput[] {
  return tagged.map((p) => ({
    person_id: p.id,
    region: p.region ?? null,
  }));
}

export function GalleryPhotoPersonTagEditor({
  imageUrl,
  caption,
  chartPeople,
  initialTagged,
  disabled,
  onChange,
}: {
  imageUrl: string | null;
  caption?: string | null;
  chartPeople: ChartPersonOption[];
  initialTagged: GalleryTaggedPerson[];
  disabled?: boolean;
  onChange: (tags: GalleryPersonTagInput[]) => void;
}) {
  const [tags, setTags] = useState<GalleryPersonTagInput[]>(() => taggedToInputs(initialTagged));
  const [drawing, setDrawing] = useState(false);
  const [pickPersonOpen, setPickPersonOpen] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<GalleryPhotoRegion | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<ChartPersonOption | null>(null);

  const resolvedUrl = imageUrl ? resolveRailsBlobUrl(imageUrl) : null;

  const personById = useMemo(() => {
    const m = new Map<number, ChartPersonOption>();
    for (const o of chartPeople) {
      m.set(o.id, o);
    }
    return m;
  }, [chartPeople]);

  function commit(next: GalleryPersonTagInput[]) {
    setTags(next);
    onChange(next);
  }

  function handleRegionDrawn(region: GalleryPhotoRegion) {
    setDrawing(false);
    setPendingRegion(region);
    setSelectedPerson(null);
    setPickPersonOpen(true);
  }

  function confirmPersonForRegion() {
    if (!pendingRegion || !selectedPerson) {
      return;
    }
    const pid = selectedPerson.id;
    const without = tags.filter((t) => t.person_id !== pid);
    commit([...without, { person_id: pid, region: pendingRegion }]);
    setPickPersonOpen(false);
    setPendingRegion(null);
    setSelectedPerson(null);
  }

  function removeTag(personId: number) {
    commit(tags.filter((t) => t.person_id !== personId));
  }

  const highlights = tags
    .filter((t): t is GalleryPersonTagInput & { region: GalleryPhotoRegion } => t.region != null)
    .map((t) => ({ personId: t.person_id, region: t.region }));

  if (!resolvedUrl) {
    return (
      <Typography variant="body2" color="text.secondary">
        Нет изображения для разметки.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Выделите область на фото мышью, затем выберите персону. Координаты сохраняются относительно
        изображения и подсвечиваются при просмотре.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1, p: 1 }}>
        <GalleryPhotoRegionOverlay
          imageUrl={resolvedUrl}
          alt={caption ?? ''}
          drawing={drawing && !disabled}
          highlights={highlights}
          onRegionDrawn={handleRegionDrawn}
        />
      </Box>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
        <Button
          variant={drawing ? 'contained' : 'outlined'}
          size="small"
          disabled={disabled}
          onClick={() => setDrawing((d) => !d)}
        >
          {drawing ? 'Отменить выделение' : 'Выделить персону'}
        </Button>
      </Stack>
      {tags.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {tags.map((t) => {
            const opt = personById.get(t.person_id);
            const label =
              opt?.label ??
              (() => {
                const fromInitial = initialTagged.find((p) => p.id === t.person_id);
                return fromInitial ? personDisplayName(fromInitial) : `ID ${t.person_id}`;
              })();
            return (
              <Chip
                key={t.person_id}
                label={t.region ? `${label} (область)` : label}
                size="small"
                onDelete={disabled ? undefined : () => removeTag(t.person_id)}
              />
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Пока никто не отмечен.
        </Typography>
      )}

      <Dialog open={pickPersonOpen} onClose={() => setPickPersonOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Кто на выделенной области?</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={chartPeople}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={selectedPerson}
            onChange={(_, v) => setSelectedPerson(v)}
            renderInput={(params) => (
              <TextField {...params} label="Персона" autoFocus sx={{ mt: 1 }} />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickPersonOpen(false)}>Отмена</Button>
          <Button variant="contained" disabled={!selectedPerson} onClick={confirmPersonForRegion}>
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
