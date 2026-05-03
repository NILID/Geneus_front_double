import React, { useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import L from 'leaflet';
import {
  fetchPeopleMapLocations,
  personDisplayName,
  type PersonMapLocation,
} from '../api/personApi';

const DEFAULT_CENTER: [number, number] = [55.751574, 37.573856];
const DEFAULT_ZOOM = 5;

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

type PersonOption = { id: number; label: string };

export function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<PersonMapLocation[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [filterIds, setFilterIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPeople(true);
    fetchPeopleMapLocations()
      .then((list) => {
        if (!cancelled) {
          setPeople(list);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить места');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPeople(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const map = L.map(el).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    setMapReady(true);

    const t = window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(t);
      markersLayer.clearLayers();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  const personOptions: PersonOption[] = useMemo(
    () =>
      people.map((p) => ({
        id: p.id,
        label: personDisplayName(p),
      })),
    [people],
  );

  const selectedOptions = useMemo(
    () => personOptions.filter((o) => filterIds.includes(o.id)),
    [personOptions, filterIds],
  );

  useEffect(() => {
    if (!mapReady || !mapRef.current || !markersLayerRef.current) {
      return;
    }
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const visible = people.filter((p) => filterIds.length === 0 || filterIds.includes(p.id));
    const bounds = L.latLngBounds([]);

    for (const p of visible) {
      const name = personDisplayName(p);
      if (p.birth_latitude != null && p.birth_longitude != null) {
        const latlng: L.LatLngTuple = [p.birth_latitude, p.birth_longitude];
        bounds.extend(latlng);
        const place = p.location_of_birth?.trim();
        const caption = place ? `${name} — рождение (${place})` : `${name} — рождение`;
        const popup = `<div style="padding:4px 0;max-width:260px;font-size:14px;line-height:1.35">${caption}<br/><a href="/person/${p.id}">Открыть карточку</a></div>`;
        const cm = L.circleMarker(latlng, {
          radius: 8,
          color: '#1565c0',
          weight: 2,
          fillColor: '#1565c0',
          fillOpacity: 0.85,
        }).bindPopup(popup);
        layer.addLayer(cm);
      }
      if (p.death_latitude != null && p.death_longitude != null) {
        const latlng: L.LatLngTuple = [p.death_latitude, p.death_longitude];
        bounds.extend(latlng);
        const place = p.location_of_death?.trim();
        const caption = place ? `${name} — смерть (${place})` : `${name} — смерть`;
        const popup = `<div style="padding:4px 0;max-width:260px;font-size:14px;line-height:1.35">${caption}<br/><a href="/person/${p.id}">Открыть карточку</a></div>`;
        const cm = L.circleMarker(latlng, {
          radius: 8,
          color: '#c62828',
          weight: 2,
          fillColor: '#c62828',
          fillOpacity: 0.85,
        }).bindPopup(popup);
        layer.addLayer(cm);
      }
    }

    if (!bounds.isValid()) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    if (sw.lat === ne.lat && sw.lng === ne.lng) {
      map.setView(sw, 10);
      return;
    }

    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [mapReady, people, filterIds]);

  return (
    <Box
      sx={{
        width: '100%',
        height: 'calc(100dvh - 64px)',
        minHeight: 320,
        position: 'relative',
        bgcolor: 'action.hover',
        '& .leaflet-container': { fontFamily: 'inherit' },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1000,
          p: 1.5,
          maxWidth: { xs: 'calc(100% - 24px)', sm: 400 },
          borderRadius: 1,
        }}
      >
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={personOptions}
          getOptionLabel={(o) => o.label}
          value={selectedOptions}
          onChange={(_, v) => setFilterIds(v.map((x) => x.id))}
          loading={loadingPeople}
          renderOption={(props, option, { selected }) => {
            const { key: _k, ...liProps } = props as React.HTMLAttributes<HTMLLIElement> & {
              key?: React.Key;
            };
            return (
              <li {...liProps} key={option.id}>
                <Checkbox size="small" sx={{ mr: 1 }} checked={selected} />
                {option.label}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Персоны на карте"
              placeholder={loadingPeople ? 'Загрузка…' : 'Все'}
              size="small"
              helperText="Пустой список — показываются все с метками"
            />
          )}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Синяя метка — место рождения, красная — место смерти. Карта © OpenStreetMap.
        </Typography>
      </Paper>
      {loadingPeople && (
        <CircularProgress
          sx={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            zIndex: 1000,
          }}
          size={28}
        />
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1000 }}
        >
          {error}
        </Alert>
      )}
      <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />
    </Box>
  );
}
