let loadPromise: Promise<void> | null = null;

function buildScriptUrl(apiKey: string): string {
  const params = new URLSearchParams({ lang: 'ru_RU' });
  if (apiKey) {
    params.set('apikey', apiKey);
  }
  return `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
}

export function loadYandexMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (window.ymaps) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-yandex-maps-api="2.1"]',
    );
    if (existing) {
      if (window.ymaps) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Не удалось загрузить API Яндекс.Карт')),
      );
      return;
    }
    const script = document.createElement('script');
    script.dataset.yandexMapsApi = '2.1';
    script.src = buildScriptUrl(apiKey);
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Не удалось загрузить API Яндекс.Карт'));
    document.head.appendChild(script);
  });
  return loadPromise;
}
