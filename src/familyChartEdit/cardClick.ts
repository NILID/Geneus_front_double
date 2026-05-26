/**
 * ## Regression: mini-tree / branch icons must not open EditTree
 *
 * With `setCardHtml()`, family-chart listens for clicks on the whole `.card`.
 * Icons `.mini-tree` and `.f3-toggle-div` are inside `.card`; only the SVG card
 * renderer calls `stopPropagation` on them. If we call `editTree.setCardClickOpen(card)`
 * alone, a click on those icons opens the edit form AND rebuilds the tree.
 *
 * **Do not call `setCardClickOpen` from app code.** Use {@link wireFamilyChartCardClickForEdit}
 * and {@link bindFamilyChartAuxiliaryClickIsolation} (see `familyChartEditor.contract.test.ts`).
 */

/** Marker on card DOM nodes — second layer of isolation in `setOnCardUpdate`. */
export const FAMILY_CHART_AUX_CLICK_GUARD_ATTR = 'data-geneus-f3-aux-click-guard';

/** Set on the card instance by {@link wireFamilyChartCardClickForEdit} (tested). */
export const FAMILY_CHART_CARD_CLICK_GUARD_KEY = '__geneusFamilyChartAuxClickGuard';

export function isFamilyChartNonEditClick(event: Event): boolean {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(
    target.closest('.mini-tree') ||
      target.closest('.f3-toggle-div') ||
      target.closest('.f3-person-profile-bar'),
  );
}

export type CardClickHandlers = {
  onCardClick: (e: Event, d: unknown) => void;
  onCardClickDefault: (e: Event, d: unknown) => void;
  setOnCardClick: (fn: (e: Event, d: unknown) => void) => unknown;
};

export type EditTreeWithCardClickOpen = {
  setCardClickOpen(card: CardClickHandlers): unknown;
};

function wrapCardClickOpenWithoutAuxiliary(card: CardClickHandlers): void {
  const openEditOnCardClick = card.onCardClick.bind(card);
  card.setOnCardClick((e, d) => {
    if (isFamilyChartNonEditClick(e)) {
      card.onCardClickDefault(e, d);
      return;
    }
    openEditOnCardClick(e, d);
  });
}

function markCardClickGuardApplied(card: object): void {
  Object.defineProperty(card, FAMILY_CHART_CARD_CLICK_GUARD_KEY, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

export function hasFamilyChartCardClickGuard(card: object): boolean {
  return (card as Record<string, unknown>)[FAMILY_CHART_CARD_CLICK_GUARD_KEY] === true;
}

/**
 * The only supported way to connect EditTree card clicks when using HTML cards.
 * Applies the onCardClick filter; pair with {@link bindFamilyChartAuxiliaryClickIsolation}.
 */
export function wireFamilyChartCardClickForEdit(
  editTree: EditTreeWithCardClickOpen,
  card: CardClickHandlers,
): void {
  editTree.setCardClickOpen(card);
  wrapCardClickOpenWithoutAuxiliary(card);
  markCardClickGuardApplied(card);
}

/**
 * DOM-level backup: stop bubble to `.card` and rebuild the tree (same as `onCardClickDefault`).
 * Idempotent per element — safe to call from `setOnCardUpdate` on every card paint.
 */
export function bindFamilyChartAuxiliaryClickIsolation(
  cardEl: Element,
  onAuxiliaryClick: () => void,
): void {
  cardEl.querySelectorAll<HTMLElement>('.mini-tree, .f3-toggle-div').forEach((el) => {
    if (el.getAttribute(FAMILY_CHART_AUX_CLICK_GUARD_ATTR) === '1') {
      return;
    }
    el.setAttribute(FAMILY_CHART_AUX_CLICK_GUARD_ATTR, '1');
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onAuxiliaryClick();
    });
  });
}
