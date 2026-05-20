import React, { useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

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
  const [hoveredPersonId, setHoveredPersonId] = useState<number | null>(null);

  const theme = useTheme();
  const isSideBySide = useMediaQuery(theme.breakpoints.up('sm'));

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

  function updateTagRegion(personId: number, region: GalleryPhotoRegion) {
    commit(
      tags.map((t) => (t.person_id === personId ? { ...t, region } : t)),
    );
  }

  const highlights = tags
    .filter((t): t is GalleryPersonTagInput & { region: GalleryPhotoRegion } => t.region != null)
    .map((t) => ({
      personId: t.person_id,
      region: t.region,
      active: hoveredPersonId === t.person_id,
      dimmed: hoveredPersonId != null && hoveredPersonId !== t.person_id,
    }));

  if (!resolvedUrl) {
    return (
      <Typography variant="body2" color="text.secondary">
        Нет изображения для разметки.
      </Typography>
    );
  }

  const personList = (
    <>
      {tags.length > 0 ? (
        <Stack spacing={0.75}>
          {tags.map((t) => {
            const opt = personById.get(t.person_id);
            const label =
              opt?.label ??
              (() => {
                const fromInitial = initialTagged.find((p) => p.id === t.person_id);
                return fromInitial ? personDisplayName(fromInitial) : `ID ${t.person_id}`;
              })();
            const isHovered = hoveredPersonId === t.person_id;
            const hasRegion = t.region != null;
            return (
              <Box
                key={t.person_id}
                onMouseEnter={hasRegion ? () => setHoveredPersonId(t.person_id) : undefined}
                onMouseLeave={hasRegion ? () => setHoveredPersonId(null) : undefined}
                onFocus={hasRegion ? () => setHoveredPersonId(t.person_id) : undefined}
                onBlur={hasRegion ? () => setHoveredPersonId(null) : undefined}
                tabIndex={hasRegion ? 0 : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 0.5,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1,
                  border: 1,
                  borderColor: isHovered ? 'warning.main' : 'divider',
                  bgcolor: isHovered ? 'warning.50' : 'background.paper',
                  cursor: hasRegion ? 'pointer' : 'default',
                  transition: 'border-color 0.15s, background-color 0.15s',
                  outline: 'none',
                  '&:focus-visible': hasRegion
                    ? { boxShadow: (th) => `0 0 0 2px ${th.palette.warning.main}` }
                    : {},
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isHovered ? 700 : 500,
                    color: isHovered ? 'warning.dark' : 'text.primary',
                    flex: '1 1 auto',
                    minWidth: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {label}
                  {!hasRegion ? (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                      (без области)
                    </Typography>
                  ) : null}
                </Typography>
                {!disabled ? (
                  <Button
                    size="small"
                    color="inherit"
                    sx={{ minWidth: 0, px: 0.75, flexShrink: 0, color: 'text.secondary', mt: -0.25 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(t.person_id);
                      if (hoveredPersonId === t.person_id) {
                        setHoveredPersonId(null);
                      }
                    }}
                  >
                    Убрать
                  </Button>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Пока никто не отмечен.
        </Typography>
      )}
    </>
  );

  const sidebar = (
    <Stack
      spacing={1.5}
      sx={{
        width: isSideBySide ? { sm: 260, md: 300 } : '100%',
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
        Выделите область на фото, выберите персону. Наведите на имя или нажмите на рамку — перетащите
        или измените размер.
      </Typography>
      <Button
        variant={drawing ? 'contained' : 'outlined'}
        size="small"
        disabled={disabled}
        fullWidth
        onClick={() => {
          setDrawing((d) => !d);
          if (!drawing) {
            setHoveredPersonId(null);
          }
        }}
      >
        {drawing ? 'Отменить выделение' : 'Выделить персону'}
      </Button>
      <Typography variant="subtitle2" sx={{ pt: 0.5 }}>
        Отмеченные ({tags.length})
      </Typography>
      <Box
        sx={{
          flex: isSideBySide ? '1 1 auto' : undefined,
          minHeight: 0,
          maxHeight: isSideBySide ? 'min(65vh, 520px)' : 240,
          overflowY: 'auto',
          pr: 0.5,
        }}
      >
        {personList}
      </Box>
    </Stack>
  );

  const photoPanel = (
    <Box
      sx={{
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        bgcolor: 'grey.100',
        borderRadius: 1,
        p: 1,
      }}
    >
      <GalleryPhotoRegionOverlay
        imageUrl={resolvedUrl}
        alt={caption ?? ''}
        drawing={drawing && !disabled}
        editable={!disabled && !drawing}
        highlights={highlights}
        onRegionDrawn={handleRegionDrawn}
        onRegionChange={updateTagRegion}
        onRegionFocus={setHoveredPersonId}
        maxHeight={isSideBySide ? 'min(70vh, 640px)' : 'min(50vh, 400px)'}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isSideBySide ? 'row' : 'column',
        gap: 2,
        alignItems: isSideBySide ? 'stretch' : 'stretch',
        minHeight: 0,
      }}
    >
      {photoPanel}
      {sidebar}

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
    </Box>
  );
}
