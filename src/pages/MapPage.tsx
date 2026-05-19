import React, { useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {
  fetchPeopleMapLocations,
  personDisplayName,
  type PersonMapLocation,
} from '../api/personApi';
import { getGoogleMapsApiKey, loadGoogleMaps } from '../lib/googleMapsLoader';
import {
  BIRTH_MARKER_COLOR,
  DEATH_MARKER_COLOR,
  personMapMarkerIcon,
} from '../lib/mapMarkers';

const DEFAULT_CENTER = { lat: 55.751574, lng: 37.573856 };
const DEFAULT_ZOOM = 5;
const FIT_BOUNDS_PADDING = 48;
const FIT_BOUNDS_MAX_ZOOM = 14;

type PersonOption = { id: number; label: string };

type MapMarkerEntry = {
  marker: google.maps.Marker;
  infoWindow: google.maps.InfoWindow;
};

export function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<MapMarkerEntry[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
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
    if (!getGoogleMapsApiKey()) {
      setMapLoadError(
        'Не задан REACT_APP_GOOGLE_MAPS_API_KEY. Добавьте ключ в .env и перезапустите приложение.',
      );
      return;
    }

    let cancelled = false;
    let map: google.maps.Map | null = null;

    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) {
          return;
        }
        map = new g.maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapRef.current = map;
        setMapReady(true);
        setMapLoadError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setMapLoadError(e instanceof Error ? e.message : 'Не удалось загрузить Google Maps');
        }
      });

    return () => {
      cancelled = true;
      for (const { marker, infoWindow } of markersRef.current) {
        infoWindow.close();
        marker.setMap(null);
      }
      markersRef.current = [];
      mapRef.current = null;
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
    const map = mapRef.current;
    if (!mapReady || !map) {
      return;
    }

    for (const { marker, infoWindow } of markersRef.current) {
      infoWindow.close();
      marker.setMap(null);
    }
    markersRef.current = [];

    const visible = people.filter((p) => filterIds.length === 0 || filterIds.includes(p.id));
    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;

    const addMarker = (lat: number, lng: number, color: string, caption: string, personId: number) => {
      const position = { lat, lng };
      bounds.extend(position);
      hasPoint = true;
      const marker = new google.maps.Marker({
        map,
        position,
        icon: personMapMarkerIcon(google, color),
        title: caption,
      });
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding:4px 0;max-width:260px;font-size:14px;line-height:1.35">${caption}<br/><a href="/person/${personId}">Открыть карточку</a></div>`,
      });
      marker.addListener('click', () => {
        for (const entry of markersRef.current) {
          entry.infoWindow.close();
        }
        infoWindow.open({ map, anchor: marker });
      });
      markersRef.current.push({ marker, infoWindow });
    };

    for (const p of visible) {
      const name = personDisplayName(p);
      if (p.birth_latitude != null && p.birth_longitude != null) {
        const place = p.location_of_birth?.trim();
        const caption = place ? `${name} — рождение (${place})` : `${name} — рождение`;
        addMarker(p.birth_latitude, p.birth_longitude, BIRTH_MARKER_COLOR, caption, p.id);
      }
      if (p.death_latitude != null && p.death_longitude != null) {
        const place = p.location_of_death?.trim();
        const caption = place ? `${name} — смерть (${place})` : `${name} — смерть`;
        addMarker(p.death_latitude, p.death_longitude, DEATH_MARKER_COLOR, caption, p.id);
      }
    }

    if (!hasPoint) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      return;
    }

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    if (ne.lat() === sw.lat() && ne.lng() === sw.lng()) {
      map.setCenter(bounds.getCenter());
      map.setZoom(10);
      return;
    }

    map.fitBounds(bounds, FIT_BOUNDS_PADDING);
    google.maps.event.addListenerOnce(map, 'idle', () => {
      const zoom = map.getZoom();
      if (zoom != null && zoom > FIT_BOUNDS_MAX_ZOOM) {
        map.setZoom(FIT_BOUNDS_MAX_ZOOM);
      }
    });
  }, [mapReady, people, filterIds]);

  const displayError = mapLoadError ?? error;

  return (
    <Box
      sx={{
        width: '100%',
        height: 'calc(100dvh - 64px)',
        minHeight: 320,
        position: 'relative',
        bgcolor: 'action.hover',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
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
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: 14, color: BIRTH_MARKER_COLOR }} aria-hidden />
            <Typography variant="caption" color="text.secondary" component="span">
              — место рождения
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: 14, color: DEATH_MARKER_COLOR }} aria-hidden />
            <Typography variant="caption" color="text.secondary" component="span">
              — место смерти
            </Typography>
          </Box>
        </Box>
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
      {displayError && (
        <Alert
          severity="error"
          sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1000 }}
        >
          {displayError}
        </Alert>
      )}
      <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />
    </Box>
  );
}
