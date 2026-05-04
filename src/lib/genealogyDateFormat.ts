/** YYYY from full date, year-only, or YYYY-MM; otherwise null. */
export function extractGenealogyYear(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const s = value.trim();
  if (s === '') {
    return null;
  }
  const y4 = /^(\d{4})\b/.exec(s);
  if (y4) {
    return y4[1];
  }
  return null;
}

function deathYearFromChartData(data: Record<string, unknown>): string | null {
  const keys = ['deathday', 'date of death', 'death', 'date_of_death'] as const;
  for (const k of keys) {
    const y = extractGenealogyYear(data[k] as string | undefined);
    if (y) {
      return y;
    }
  }
  return null;
}

/**
 * Tree card line: years only, no day/month.
 * — both dates: "1910 - 2000"
 * — birth only: "род. 1910"
 * — death only: "ум. 2000"
 */
export function formatFamilyChartYearLine(data: Record<string, unknown>): string {
  const birth = extractGenealogyYear(data['birthday'] as string | undefined);
  const death = deathYearFromChartData(data);
  if (birth && death) {
    return `${birth} - ${death}`;
  }
  if (birth) {
    return `род. ${birth}`;
  }
  if (death) {
    return `ум. ${death}`;
  }
  return '';
}

const UNKNOWN_NAME = /^unknown$/i;

/**
 * Строка имени на карточке family-chart: пустые поля и плейсхолдеры вроде «Unknown» → «Неизвестно».
 * `chartNode` — тот же объект, что передаёт `setCardDisplay` в функции-форматтеры (`d` с полем `data`).
 */
export function formatFamilyChartPersonNameLine(chartNode: { data?: Record<string, unknown> }): string {
  const person = chartNode.data ?? {};
  const firstRaw = typeof person['first name'] === 'string' ? person['first name'].trim() : '';
  const lastRaw = typeof person['last name'] === 'string' ? person['last name'].trim() : '';

  const isBlankOrUnknown = (s: string) => s === '' || UNKNOWN_NAME.test(s);
  if (isBlankOrUnknown(firstRaw) && isBlankOrUnknown(lastRaw)) {
    return 'Неизвестно';
  }

  const first = isBlankOrUnknown(firstRaw) ? '' : firstRaw;
  const last = isBlankOrUnknown(lastRaw) ? '' : lastRaw;
  const line = [first, last].filter(Boolean).join(' ').trim();
  return line || 'Неизвестно';
}

/** Genitive month names for dates like "7 августа 1984". */
const RU_MONTHS_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Formats a stored date (typically `YYYY-MM-DD`) for display, e.g. "7 августа 1984".
 * Non-ISO values are returned unchanged.
 */
export function formatGenealogyDateForDisplay(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }
  const s = value.trim();
  if (s === '') {
    return '';
  }
  const m = ISO_DATE.exec(s.length >= 10 ? s.slice(0, 10) : s);
  if (!m) {
    return s;
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) {
    return s;
  }
  return `${day} ${RU_MONTHS_GEN[month - 1]} ${year}`;
}

/** Для персоны: при флаге «только год» показываем четырёхзначный год, иначе полная дата. */
export function formatPersonGenealogyDate(
  iso: string | null | undefined,
  yearOnly: boolean | null | undefined,
): string {
  if (!iso) {
    return '';
  }
  if (yearOnly) {
    return extractGenealogyYear(iso) ?? formatGenealogyDateForDisplay(iso);
  }
  return formatGenealogyDateForDisplay(iso);
}
