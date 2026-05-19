import React, { useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import type { PlaceSuggestion } from '../lib/placeGeocode';
import { reverseGeocodeToLabel } from '../lib/placeGeocode';
import { getGoogleMapsApiKey, loadGoogleMaps } from '../lib/googleMapsLoader';
import { settlementPickerMarkerIcon } from '../lib/mapMarkers';

const DEFAULT_CENTER = { lat: 55.751574, lng: 37.573856 };
const DEFAULT_ZOOM = 4;

export interface SettlementMapPickerProps {
  title: string;
  variant: 'birth' | 'death';
  marker: { lat: number; lng: number } | null;
  onPick: (suggestion: PlaceSuggestion) => void;
  disabled?: boolean;
}

export function SettlementMapPicker({
  title,
  variant,
  marker,
  onPick,
  disabled,
}: SettlementMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const markerPropRef = useRef(marker);
  markerPropRef.current = marker;
  const [busy, setBusy] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const syncMarker = useCallback(
    (map: google.maps.Map, next: { lat: number; lng: number } | null) => {
      markerRef.current?.setMap(null);
      markerRef.current = null;

      if (next) {
        const position = { lat: next.lat, lng: next.lng };
        markerRef.current = new google.maps.Marker({
          map,
          position,
          icon: settlementPickerMarkerIcon(google, variant),
        });
        map.setCenter(position);
        map.setZoom(12);
      } else {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(DEFAULT_ZOOM);
      }
    },
    [variant],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    if (!getGoogleMapsApiKey()) {
      setMapError('Не задан REACT_APP_GOOGLE_MAPS_API_KEY');
      return;
    }

    let cancelled = false;
    let resizeTimer: number | undefined;

    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) {
          return;
        }
        const map = new g.maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;
        setMapReady(true);
        syncMarker(map, markerPropRef.current);
        resizeTimer = window.setTimeout(() => {
          google.maps.event.trigger(map, 'resize');
        }, 100);

        clickListenerRef.current = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (disabledRef.current || e.latLng == null) {
            return;
          }
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setBusy(true);
          try {
            let label = await reverseGeocodeToLabel(lat, lng);
            if (!label) {
              label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
            onPickRef.current({
              id: `map-${Date.now()}`,
              label,
              lat,
              lng,
            });
          } finally {
            setBusy(false);
          }
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMapError(err instanceof Error ? err.message : 'Не удалось загрузить карту');
        }
      });

    return () => {
      cancelled = true;
      if (resizeTimer != null) {
        window.clearTimeout(resizeTimer);
      }
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
      setMapReady(false);
    };
  }, [syncMarker]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) {
      return;
    }
    syncMarker(map, marker);
  }, [mapReady, marker, syncMarker]);

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Клик по карте подставит населённый пункт в поле выше и сохранит координаты для общей карты.
      </Typography>
      {mapError && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {mapError}
        </Alert>
      )}
      <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden' }}>
        {busy && (
          <CircularProgress
            size={28}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-14px',
              marginLeft: '-14px',
              zIndex: 500,
            }}
          />
        )}
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            height: 220,
            bgcolor: 'action.hover',
            opacity: disabled ? 0.55 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
          }}
        />
      </Box>
    </Box>
  );
}
