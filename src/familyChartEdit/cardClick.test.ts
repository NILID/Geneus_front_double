import {
  FAMILY_CHART_CARD_CLICK_GUARD_KEY,
  bindFamilyChartAuxiliaryClickIsolation,
  hasFamilyChartCardClickGuard,
  isFamilyChartNonEditClick,
  wireFamilyChartCardClickForEdit,
  wireFamilyChartCardClickForRelativeAdd,
  type CardClickHandlers,
} from './cardClick';

function clickOn(el: Element): Event {
  return { target: el } as unknown as Event;
}

describe('isFamilyChartNonEditClick', () => {
  it('returns true for mini-tree icon area', () => {
    const card = document.createElement('div');
    card.className = 'card';
    const mini = document.createElement('div');
    mini.className = 'mini-tree';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mini.appendChild(svg);
    card.appendChild(mini);
    expect(isFamilyChartNonEditClick(clickOn(svg))).toBe(true);
  });

  it('returns false for card body', () => {
    const inner = document.createElement('div');
    inner.className = 'card-inner';
    expect(isFamilyChartNonEditClick(clickOn(inner))).toBe(false);
  });

  it('returns true for duplicate branch toggle', () => {
    const toggle = document.createElement('div');
    toggle.className = 'f3-toggle-div';
    expect(isFamilyChartNonEditClick(clickOn(toggle))).toBe(true);
  });
});

describe('wireFamilyChartCardClickForEdit', () => {
  it('opens edit form on card body but only rebuilds tree on mini-tree click', () => {
    const open = jest.fn();
    const editTree = {
      setCardClickOpen: jest.fn((card) => {
        card.setOnCardClick(() => {
          open();
          card.onCardClickDefault({} as Event, {});
        });
      }),
    };

    const onCardClickDefault = jest.fn();
    const card: CardClickHandlers = {
      onCardClick: () => {},
      onCardClickDefault,
      setOnCardClick(fn) {
        this.onCardClick = fn;
      },
    };

    wireFamilyChartCardClickForEdit(editTree, card);

    const inner = document.createElement('div');
    inner.className = 'card-inner';
    card.onCardClick(clickOn(inner), {});
    expect(open).toHaveBeenCalledTimes(1);
    expect(onCardClickDefault).toHaveBeenCalledTimes(1);

    open.mockClear();
    onCardClickDefault.mockClear();

    const mini = document.createElement('div');
    mini.className = 'mini-tree';
    card.onCardClick(clickOn(mini), {});
    expect(open).not.toHaveBeenCalled();
    expect(onCardClickDefault).toHaveBeenCalledTimes(1);
  });

  it('marks the card instance so regressions are detectable', () => {
    const editTree = { setCardClickOpen: jest.fn((c) => c.setOnCardClick(() => {})) };
    const card: CardClickHandlers = {
      onCardClick: () => {},
      onCardClickDefault: jest.fn(),
      setOnCardClick(fn) {
        this.onCardClick = fn;
      },
    };
    wireFamilyChartCardClickForEdit(editTree, card);
    expect(hasFamilyChartCardClickGuard(card)).toBe(true);
    expect((card as Record<string, unknown>)[FAMILY_CHART_CARD_CLICK_GUARD_KEY]).toBe(true);
  });
});

describe('wireFamilyChartCardClickForRelativeAdd', () => {
  it('opens external handler for _new_rel_data cards without calling editTree.open', () => {
    let onCardClick: (e: Event, d: unknown) => void = () => {};
    const card = {
      onCardClick,
      onCardClickDefault: jest.fn(),
      setOnCardClick(fn: (e: Event, d: unknown) => void) {
        onCardClick = fn;
        this.onCardClick = fn;
      },
    };
    const onNewRelativeCardClick = jest.fn();
    const editTree = {
      setCardClickOpen: jest.fn(),
      isAddingRelative: () => true,
      addRelativeInstance: { onCancel: jest.fn() },
    };
    wireFamilyChartCardClickForRelativeAdd(editTree, card, { onNewRelativeCardClick });

    const inner = document.createElement('div');
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.appendChild(inner);
    const clickOnInner = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickOnInner, 'target', { value: inner });

    onCardClick(clickOnInner, { data: { id: 'x', _new_rel_data: { rel_type: 'father' } } });
    expect(onNewRelativeCardClick).toHaveBeenCalled();
    expect(editTree.setCardClickOpen).not.toHaveBeenCalled();
  });
});

describe('bindFamilyChartAuxiliaryClickIsolation', () => {
  it('stops propagation and rebuilds without reaching the card listener', () => {
    const card = document.createElement('div');
    card.className = 'card';
    const mini = document.createElement('div');
    mini.className = 'mini-tree';
    card.appendChild(mini);

    let cardListenerFired = false;
    card.addEventListener('click', () => {
      cardListenerFired = true;
    });

    const rebuild = jest.fn();
    bindFamilyChartAuxiliaryClickIsolation(card, rebuild);
    mini.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(cardListenerFired).toBe(false);
  });
});
