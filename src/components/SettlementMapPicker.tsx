import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import L from 'leaflet';
import type { PlaceSuggestion } from '../lib/osmGeocode';
import { reverseGeocodeToLabel } from '../lib/osmGeocode';

const DEFAULT_CENTER: L.LatLngTuple = [55.751574, 37.573856];
const DEFAULT_ZOOM = 4;
const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function markerIcon(variant: 'birth' | 'death'): L.DivIcon {
  const color = variant === 'birth' ? '#1565c0' : '#c62828';
  return L.divIcon({
    className: 'settlement-map-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

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
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const map = L.map(el, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;
    L.tileLayer(OSM_TILE, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (disabledRef.current) {
        return;
      }
      const { lat, lng } = e.latlng;
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

    const t = window.setTimeout(() => map.invalidateSize(), 100);

    return () => {
      window.clearTimeout(t);
      markerLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
      markerLayerRef.current = null;
    }
    if (marker) {
      const m = L.marker([marker.lat, marker.lng], { icon: markerIcon(variant) }).addTo(map);
      markerLayerRef.current = m;
      map.setView([marker.lat, marker.lng], 12);
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [marker, variant]);

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Клик по карте подставит населённый пункт в поле выше и сохранит координаты для общей карты.
      </Typography>
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
            '& .leaflet-container': { fontFamily: 'inherit' },
          }}
        />
      </Box>
    </Box>
  );
}
