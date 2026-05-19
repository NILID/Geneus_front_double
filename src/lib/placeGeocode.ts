/**
 * Геокодирование и подсказки населённых пунктов через Google Places API и Geocoder.
 */

import { loadGoogleMaps } from './googleMapsLoader';

export interface PlaceSuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

let placesService: google.maps.places.PlacesService | null = null;

function getPlacesService(): google.maps.places.PlacesService {
  if (!placesService) {
    const el = document.createElement('div');
    placesService = new google.maps.places.PlacesService(el);
  }
  return placesService;
}

/** Человекочитаемая подпись населённого пункта (без улицы). */
export function formatPlaceAddressComponents(
  components: google.maps.GeocoderAddressComponent[],
): string {
  const pick = (...types: string[]): string => {
    for (const t of types) {
      const c = components.find((x) => x.types.includes(t));
      if (c?.long_name?.trim()) {
        return c.long_name.trim();
      }
    }
    return '';
  };

  const locality = pick(
    'locality',
    'postal_town',
    'administrative_area_level_2',
    'sublocality',
    'neighborhood',
  );
  const region = pick('administrative_area_level_1');
  const country = pick('country');

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

  return parts.join(', ');
}

function placeDetails(
  placeId: string,
): Promise<google.maps.places.PlaceResult | null> {
  return new Promise((resolve) => {
    getPlacesService().getDetails(
      {
        placeId,
        fields: ['geometry', 'address_components', 'name', 'formatted_address'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          resolve(null);
        }
      },
    );
  });
}

function autocompletePredictions(
  query: string,
): Promise<google.maps.places.AutocompletePrediction[]> {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: query,
        language: 'ru',
        types: ['(cities)'],
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
          return;
        }
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
          return;
        }
        reject(new Error(`Places: ${status}`));
      },
    );
  });
}

async function predictionToSuggestion(
  pred: google.maps.places.AutocompletePrediction,
): Promise<PlaceSuggestion | null> {
  const details = await placeDetails(pred.place_id);
  const loc = details?.geometry?.location;
  if (!loc) {
    return null;
  }
  const lat = loc.lat();
  const lng = loc.lng();
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  let label = '';
  if (details?.address_components) {
    label = formatPlaceAddressComponents(details.address_components).trim();
  }
  if (!label) {
    label = (pred.structured_formatting?.main_text ?? pred.description).trim();
  }
  if (!label) {
    return null;
  }

  return { id: pred.place_id, label, lat, lng };
}

/** Подсказки для автодополнения по строке поиска. */
export async function searchPlaces(query: string, limit = 10): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  await loadGoogleMaps();
  const predictions = await autocompletePredictions(q);
  const slice = predictions.slice(0, limit);
  const out: PlaceSuggestion[] = [];
  const seen = new Set<string>();

  for (const pred of slice) {
    try {
      const suggestion = await predictionToSuggestion(pred);
      if (!suggestion || seen.has(suggestion.id)) {
        continue;
      }
      seen.add(suggestion.id);
      out.push(suggestion);
    } catch {
      // пропускаем отдельную подсказку
    }
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
  await loadGoogleMaps();
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: q, language: 'ru' }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry!.location!;
        resolve({ lat: loc.lat(), lng: loc.lng() });
        return;
      }
      if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
        resolve(null);
        return;
      }
      reject(new Error(`Geocoder: ${status}`));
    });
  });
}

/** Обратное геокодирование: координаты клика → подпись населённого пункта для поля формы. */
export async function reverseGeocodeToLabel(lat: number, lng: number): Promise<string | null> {
  await loadGoogleMaps();
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng }, language: 'ru' }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results?.[0]?.address_components) {
        resolve(null);
        return;
      }
      const label = formatPlaceAddressComponents(results[0].address_components).trim();
      resolve(label || null);
    });
  });
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
