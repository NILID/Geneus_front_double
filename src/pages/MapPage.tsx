import React, { useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { loadYandexMapsScript } from '../lib/yandexMapsLoader';

const DEFAULT_CENTER: [number, number] = [55.751574, 37.573856];
const DEFAULT_ZOOM = 10;

export function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let destroyed = false;
    let mapInstance: { destroy: () => void } | null = null;
    const apiKey = process.env.REACT_APP_YANDEX_MAPS_API_KEY ?? '';

    loadYandexMapsScript(apiKey)
      .then(() => {
        if (destroyed || !containerRef.current || !window.ymaps) {
          return;
        }
        window.ymaps.ready(() => {
          if (destroyed || !containerRef.current || !window.ymaps) {
            return;
          }
          mapInstance = new window.ymaps.Map(containerRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl'],
          });
        });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки карты');
      });

    return () => {
      destroyed = true;
      mapInstance?.destroy();
    };
  }, []);

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
      {!process.env.REACT_APP_YANDEX_MAPS_API_KEY && (
        <Alert severity="info" sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1, maxWidth: 560 }}>
          Для карты задайте ключ в <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>.env</Typography>:{' '}
          <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>
            REACT_APP_YANDEX_MAPS_API_KEY
          </Typography>{' '}
          (см.{' '}
          <a href="https://developer.tech.yandex.ru/services/" target="_blank" rel="noreferrer">
            кабинет разработчика Яндекса
          </a>
          ).
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1 }}>
          {error}
        </Alert>
      )}
      <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />
    </Box>
  );
}
