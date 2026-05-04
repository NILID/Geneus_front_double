/**
 * Русификация UI библиотеки `family-chart` (подписи в HTML генерируются внутри пакета).
 * Сохраняем английские `id` полей данных (`first name` и т.д.), меняем только `label` для формы.
 */

export type FamilyChartTextField = {
  type: 'text';
  id: string;
  label: string;
};

/** Поля редактирования карточки: ключи совпадают с форматом данных API. */
export const RUSSIAN_EDIT_FIELDS: FamilyChartTextField[] = [
  { type: 'text', id: 'first name', label: 'Имя' },
  { type: 'text', id: 'last name', label: 'Фамилия' },
];

/** Связать существующую персону при добавлении родственника. */
export function russianLinkExistingRelConfig() {
  return {
    title: 'Профиль уже есть?',
    select_placeholder: 'Выберите профиль',
    linkRelLabel: (d: { data?: Record<string, unknown>; id?: string | number }) => {
      const data = d.data ?? {};
      const first = data['first name'];
      const last = data['last name'];
      const parts = [first, last].filter(
        (x): x is string => typeof x === 'string' && x.trim() !== '',
      );
      return parts.join(' ').trim() || String(d.id ?? '');
    },
  };
}

function replaceSelectPlaceholders(root: HTMLElement) {
  root.querySelectorAll('select option[value=""]').forEach((opt) => {
    const t = opt.textContent?.trim() ?? '';
    if (t.startsWith('Select ')) {
      opt.textContent = t.replace(/^Select\b/, 'Выберите');
    }
  });
}

function patchSpouseRemovalModal(root: HTMLElement) {
  const p = root.querySelector('.f3-modal-content-inner p');
  if (p && p.textContent?.includes('removing a spouse relationship')) {
    p.textContent =
      'Вы удаляете брачную связь. У вас есть общие дети — выберите, с кем из родителей они останутся в древе.';
  }
  root.querySelectorAll<HTMLButtonElement>('[data-option="assign-to-current"]').forEach((b) => {
    if (/Keep children/i.test(b.textContent ?? '')) {
      b.textContent = 'Оставить детей с этим человеком';
    }
  });
  root.querySelectorAll<HTMLButtonElement>('[data-option="assign-to-spouse"]').forEach((b) => {
    if (/Keep children|spouse/i.test(b.textContent ?? '')) {
      b.textContent = 'Оставить детей с супругом';
    }
  });
}

function patchModalConfirmButtons(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>('.f3-modal-accept').forEach((b) => {
    if (b.textContent === 'Accept') {
      b.textContent = 'Подтвердить';
    }
  });
  root.querySelectorAll<HTMLButtonElement>('.f3-modal-cancel').forEach((b) => {
    if (b.textContent === 'Cancel') {
      b.textContent = 'Отмена';
    }
  });
}

/**
 * Кнопки и подписи формы после отрисовки (перерисовка при отмене вызывает колбэк снова).
 */
export function applyRussianFamilyChartForm(container: HTMLElement) {
  container.querySelectorAll<HTMLButtonElement>('.f3-cancel-btn').forEach((b) => {
    b.textContent = 'Отмена';
  });
  container.querySelectorAll('#familyForm').forEach((form) => {
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) {
      submit.textContent = 'Сохранить';
    }
  });
  container.querySelectorAll<HTMLButtonElement>('.f3-delete-btn').forEach((b) => {
    b.textContent = 'Удалить';
  });
  container.querySelectorAll<HTMLButtonElement>('.f3-remove-relative-btn').forEach((b) => {
    b.textContent = b.classList.contains('active')
      ? 'Отменить удаление связи'
      : 'Удалить связь';
  });

  container.querySelectorAll('.f3-radio-group label').forEach((label) => {
    const input = label.querySelector<HTMLInputElement>('input[type="radio"][name="gender"]');
    if (!input) {
      return;
    }
    const suffix = input.value === 'M' ? 'Мужской' : input.value === 'F' ? 'Женский' : '';
    const nodes = Array.from(label.childNodes);
    nodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        n.remove();
      }
    });
    if (suffix) {
      label.appendChild(document.createTextNode(` ${suffix}`));
    }
  });

  replaceSelectPlaceholders(container);
  patchModalConfirmButtons(container);
  patchSpouseRemovalModal(container);
}

/** Модалки и тултипы появляются позже отрисовки формы — один наблюдатель на контейнер графа. */
export function observeRussianFamilyChartUi(chartRoot: HTMLElement): () => void {
  let raf: number | null = null;
  const run = () => {
    if (raf != null) {
      cancelAnimationFrame(raf);
    }
    raf = requestAnimationFrame(() => {
      raf = null;
      applyRussianFamilyChartForm(chartRoot);
    });
  };
  run();
  const mo = new MutationObserver(run);
  mo.observe(chartRoot, { childList: true, subtree: true });
  return () => {
    if (raf != null) {
      cancelAnimationFrame(raf);
    }
    mo.disconnect();
  };
}
