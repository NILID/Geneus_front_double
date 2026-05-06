import { API_BASE } from '../auth/authApi';

/**
 * Rails serializers build blob URLs with `request.base_url + rails_blob_path(...)`.
 * That breaks when the SPA is opened by LAN IP / another host than Rails saw:
 * e.g. JSON contains `http://localhost:3000/rails/active_storage/...` while the tablet
 * loads the app from `http://192.168.x.x:3001` — on the device `localhost` is the device,
 * not the dev machine. HTTPS pages loading `http://` asset URLs can also fail (mixed content).
 *
 * Always rewrite to the same origin the app already uses for API calls (`API_BASE`).
 */
export function resolveRailsBlobUrl(url: string | null | undefined): string | undefined {
  if (url == null || url === '') {
    return undefined;
  }
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const base = API_BASE.replace(/\/$/, '');
  if (!base) {
    return url;
  }

  try {
    const absolute = url.startsWith('http://') || url.startsWith('https://');
    const parsed = absolute ? new URL(url) : new URL(url, `${base}/`);
    const pathAndQuery = `${parsed.pathname}${parsed.search}`;
    const apiOrigin = new URL(base.includes('://') ? base : `http://${base}`);
    return `${apiOrigin.origin}${pathAndQuery}`;
  } catch {
    return url;
  }
}
