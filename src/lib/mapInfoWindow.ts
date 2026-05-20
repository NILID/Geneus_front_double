/** HTML для Google Maps InfoWindow: явные цвета, чтобы не наследовать тёмную тему приложения. */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function avatarBlock(name: string, avatarUrl?: string): string {
  const safeName = escapeHtml(name);
  if (avatarUrl) {
    const safeUrl = escapeHtml(avatarUrl);
    return `<img src="${safeUrl}" alt="${safeName}" width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block;background:#e0e0e0;" />`;
  }
  const initials = escapeHtml(personInitials(name));
  return `<div style="width:48px;height:48px;border-radius:50%;background:#9e9e9e;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:16px;flex-shrink:0;line-height:1;" aria-hidden="true">${initials}</div>`;
}

export function buildMapInfoWindowHtml(params: {
  personId: number;
  name: string;
  kind: 'birth' | 'death';
  place?: string;
  avatarUrl?: string;
}): string {
  const { personId, name, kind, place, avatarUrl } = params;
  const safeName = escapeHtml(name);
  const kindLabel = kind === 'birth' ? 'рождение' : 'смерть';
  const placeLine = place
    ? `<div style="margin-top:4px;font-size:13px;line-height:1.35;color:#616161;">${escapeHtml(place)}</div>`
    : '';
  const kindColor = kind === 'birth' ? '#1565c0' : '#c62828';

  return `<div style="padding:10px 12px;max-width:280px;font-family:Roboto,Arial,sans-serif;color:#212121;background:#fff;">
  <div style="display:flex;gap:12px;align-items:flex-start;">
    ${avatarBlock(name, avatarUrl)}
    <div style="min-width:0;flex:1;">
      <div style="font-size:15px;font-weight:600;line-height:1.35;color:#212121;">${safeName}</div>
      <div style="margin-top:2px;font-size:13px;line-height:1.35;color:${kindColor};font-weight:500;">${kindLabel}</div>
      ${placeLine}
      <a href="/person/${personId}" style="display:inline-block;margin-top:10px;font-size:13px;line-height:1.35;color:#1565c0;text-decoration:none;font-weight:500;">Открыть карточку</a>
    </div>
  </div>
</div>`;
}
