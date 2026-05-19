/** Круглая метка на карте (рождение / смерть). */
export function personMapMarkerIcon(
  googleMaps: typeof google,
  color: string,
): google.maps.Symbol {
  return {
    path: googleMaps.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: color,
    fillOpacity: 0.85,
    strokeColor: color,
    strokeWeight: 2,
  };
}

export const BIRTH_MARKER_COLOR = '#1565c0';
export const DEATH_MARKER_COLOR = '#c62828';

export function settlementPickerMarkerIcon(
  googleMaps: typeof google,
  variant: 'birth' | 'death',
): google.maps.Symbol {
  return personMapMarkerIcon(
    googleMaps,
    variant === 'birth' ? BIRTH_MARKER_COLOR : DEATH_MARKER_COLOR,
  );
}
