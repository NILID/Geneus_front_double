import { Loader } from '@googlemaps/js-api-loader';

let loadPromise: Promise<typeof google> | null = null;

export function getGoogleMapsApiKey(): string {
  return (process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? '').trim();
}

/** Однократная загрузка Maps JavaScript API (places + geocoding). */
export function loadGoogleMaps(): Promise<typeof google> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(
      new Error(
        'Не задан REACT_APP_GOOGLE_MAPS_API_KEY. Добавьте ключ Google Maps в .env и перезапустите npm start.',
      ),
    );
  }
  if (!loadPromise) {
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
      language: 'ru',
      region: 'RU',
    });
    loadPromise = loader.load();
  }
  return loadPromise;
}
