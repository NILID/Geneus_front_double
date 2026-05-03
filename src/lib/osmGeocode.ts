/**
 * Геокодирование через Photon (данные OSM, без API-ключа).
 * https://photon.komoot.io — при недоступности можно заменить на свой инстанс.
 */

const PHOTON_SEARCH_BASE = 'https://photon.komoot.io/api';
const PHOTON_REVERSE_BASE = 'https://photon.komoot.io/reverse';

const PHOTON_LANG = 'ru';

export interface PlaceSuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  geometry?: { type?: string; coordinates?: number[] };
  properties?: Record<string, unknown>;
}

interface PhotonSearchGeoJSON {
  features?: PhotonFeature[];
}

function suggestionId(props: Record<string, unknown>, index: number, lat: number, lon: number): string {
  const osmId = props.osm_id;
  const osmType = props.osm_type;
  if (osmId != null && osmType != null) {
    return `${osmType}:${osmId}`;
  }
  return `photon:${index}:${lat.toFixed(5)}:${lon.toFixed(5)}`;
}

/** Человекочитаемая подпись населённого пункта (без улицы). */
export function formatPhotonPlaceLabel(props: Record<string, unknown>): string {
  const locality =
    (typeof props.city === 'string' && props.city.trim()) ||
    (typeof props.town === 'string' && props.town.trim()) ||
    (typeof props.village === 'string' && props.village.trim()) ||
    (typeof props.hamlet === 'string' && props.hamlet.trim()) ||
    (typeof props.name === 'string' && props.name.trim()) ||
    '';

  const region =
    (typeof props.state === 'string' && props.state.trim()) ||
    (typeof props.county === 'string' && props.county.trim()) ||
    '';

  const country = typeof props.country === 'string' ? props.country.trim() : '';

  const parts: string[] = [];
  if (locality) {
    parts.push(locality);
  }
  if (region && region !== locality) {
    parts.push(region);
  }
  if (country) {
    parts.push(country);
  }

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return locality;
}

/** Подсказки для автодополнения по строке поиска. */
export async function searchPhotonPlaces(query: string, limit = 10): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const url = `${PHOTON_SEARCH_BASE}?q=${encodeURIComponent(q)}&limit=${limit}&lang=${PHOTON_LANG}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Photon: ${res.status}`);
  }
  const data = (await res.json()) as PhotonSearchGeoJSON;
  const features = data.features ?? [];
  const seen = new Set<string>();
  const out: PlaceSuggestion[] = [];

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) {
      continue;
    }
    const [lon, lat] = coords;
    if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
      continue;
    }
    const props = f.properties ?? {};
    const label = formatPhotonPlaceLabel(props).trim();
    if (!label) {
      continue;
    }
    const id = suggestionId(props, i, lat, lon);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push({ id, label, lat, lng: lon });
  }

  return out;
}

/** Прямой геокодинг одной строки (резерв, если не выбран пункт из списка). */
export async function forwardGeocodeToLatLng(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) {
    return null;
  }
  const url = `${PHOTON_SEARCH_BASE}?q=${encodeURIComponent(q)}&limit=1&lang=${PHOTON_LANG}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Photon: ${res.status}`);
  }
  const data = (await res.json()) as PhotonSearchGeoJSON;
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) {
    return null;
  }
  const [lon, lat] = coords;
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }
  return { lat, lng: lon };
}

/** Обратное геокодирование: координаты клика → подпись населённого пункта для поля формы. */
export async function reverseGeocodeToLabel(lat: number, lng: number): Promise<string | null> {
  const url = `${PHOTON_REVERSE_BASE}?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&lang=${PHOTON_LANG}`;
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as PhotonSearchGeoJSON;
  const props = data.features?.[0]?.properties as Record<string, unknown> | undefined;
  if (!props) {
    return null;
  }
  const label = formatPhotonPlaceLabel(props).trim();
  return label || null;
}

/**
 * Координаты для сохранения: при совпадении текста с выбранной подсказкой берём её точку,
 * иначе пробуем общий геокодинг строки.
 */
export async function resolvePlaceCoordinates(
  inputText: string,
  selected: PlaceSuggestion | null,
): Promise<{ lat: number; lng: number } | null> {
  const t = inputText.trim();
  if (!t) {
    return null;
  }
  if (selected && selected.label.trim() === t) {
    return { lat: selected.lat, lng: selected.lng };
  }
  try {
    return await forwardGeocodeToLatLng(t);
  } catch {
    return null;
  }
}
