import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { saveFamilyTree, type FamilyChartData, type FamilyChartPerson } from '../familyChartApi';
import { diffPersonIds } from '../familyChartEdit/diffTree';
import { RUSSIAN_EDIT_FIELDS, observeRussianFamilyChartUi } from '../familyChartEdit/familyChartRussianUi';
import { formatFamilyChartPersonNameLine, formatFamilyChartYearLine } from '../lib/genealogyDateFormat';

export type FamilyChartEditCallbacks = {
  /** Fires after any edit/add/remove that updates the library store (full snapshot). */
  onUpdate?: (data: FamilyChartData) => void;
  /** Derived by diffing `id`s between exports when new people appear. */
  onAdd?: (data: FamilyChartData, addedPersonIds: string[]) => void;
  /** Derived by diffing `id`s when people are removed. */
  onRemove?: (data: FamilyChartData, removedPersonIds: string[]) => void;
};

export type FamilyChartEditorProps = {
  /** Current tree; updates from the chart are sent via `onDataChange`. */
  data: FamilyChartData | null;
  onDataChange: (next: FamilyChartData) => void;
  /** Called after the server returns canonical nodes so the parent can remount if ids changed. */
  onPersistedData?: (next: FamilyChartData) => void;
  cardDisplay?: CardDisplayConfig;
  /** Поля формы: строки = id и label; или `{ id, label, type }` при русских подписях. */
  editFields?: Array<string | { type: string; id: string; label: string }>;
  /** Bump to destroy and recreate the chart (e.g. after a server refetch). */
  remountKey?: string | number;
  /**
   * When set, each person card gets a full-width bottom bar (family-chart `setOnCardUpdate`).
   * Clicks use SPA navigation; modifier-clicks keep default browser behavior.
   */
  onOpenPersonPage?: (personId: string) => void;
  /** Chart node `id` passed to {@link https://github.com/donatso/family-chart `updateMainId`} (корень древа). */
  mainNodeId: string;
} & FamilyChartEditCallbacks;

/** Matches `family-chart` `setCardDisplay`: field groups, field names, or formatters. */
type CardDisplayConfig = Array<string[] | string | ((d: { data: Record<string, unknown> }) => string)>;

const DEFAULT_CARD_DISPLAY: CardDisplayConfig = [
  (d) => formatFamilyChartPersonNameLine(d),
  (d) => formatFamilyChartYearLine(d.data as Record<string, unknown>),
];
const DEFAULT_EDIT_FIELDS = RUSSIAN_EDIT_FIELDS;

function newExternalChartNodeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type FamilyChartEmptyFirstPersonProps = {
  onCreated: (nodes: FamilyChartData) => void;
};

/**
 * `family-chart` не вызывает отрисовку при пустом `data` (`updateTree` выходит сразу).
 * Первую персону создаём через тот же `saveFamilyTree`, что и правки в графе.
 */
function FamilyChartEmptyFirstPerson({ onCreated }: FamilyChartEmptyFirstPersonProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn && !ln) {
      setError('Укажите имя или фамилию.');
      return;
    }

    const node: FamilyChartPerson = {
      id: newExternalChartNodeId(),
      data: {
        gender,
        'first name': fn || 'Unknown',
        ...(ln ? { 'last name': ln } : {}),
      },
      rels: { parents: [], spouses: [], children: [] },
    };

    setSubmitting(true);
    try {
      const saved = await saveFamilyTree({ nodes: [node], removed_ids: [] });
      onCreated(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      component="form"
      elevation={2}
      onSubmit={(e) => void handleSubmit(e)}
      data-testid="family-chart-empty-first-person"
      sx={{ p: { xs: 2, sm: 3 }, maxWidth: 480, mx: 'auto' }}
    >
      <Stack spacing={2}>
        <Typography variant="h2" component="h2" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Древо пусто
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Добавьте первого человека — после сохранения откроется интерактивное древо, как при редактировании
          родственников на карточках.
        </Typography>
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}
        <TextField
          label="Имя"
          value={firstName}
          onChange={(ev) => setFirstName(ev.target.value)}
          fullWidth
          autoComplete="given-name"
        />
        <TextField
          label="Фамилия"
          value={lastName}
          onChange={(ev) => setLastName(ev.target.value)}
          fullWidth
          autoComplete="family-name"
        />
        <FormControl>
          <FormLabel>Пол</FormLabel>
          <RadioGroup row value={gender} onChange={(_, v) => setGender(v as 'M' | 'F')}>
            <FormControlLabel value="M" control={<Radio />} label="Мужской" />
            <FormControlLabel value="F" control={<Radio />} label="Женский" />
          </RadioGroup>
        </FormControl>
        <Button type="submit" variant="contained" disabled={submitting} size="large">
          {submitting ? 'Сохранение…' : 'Создать и открыть древо'}
        </Button>
      </Stack>
    </Paper>
  );
}

/**
 * Interactive tree using `family-chart` EditTree (same flow as docs example “17-edit-tree”):
 * {@link https://donatso.github.io/family-chart-doc/examples/v2/17-edit-tree}
 *
 * “Mini tree” on cards (branch available / relatives not all on canvas) matches SVG cards example:
 * {@link https://donatso.github.io/family-chart-doc/examples/v2/7-svg-cards-edit}
 */
export function FamilyChartEditor({
  data,
  onDataChange,
  onPersistedData,
  onUpdate,
  onAdd,
  onRemove,
  cardDisplay = DEFAULT_CARD_DISPLAY,
  editFields = DEFAULT_EDIT_FIELDS,
  remountKey = 0,
  onOpenPersonPage,
  mainNodeId,
}: FamilyChartEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<
    | {
        updateData: (d: FamilyChartData) => unknown;
        updateTree: (p: { initial?: boolean; tree_position?: string }) => unknown;
        updateMainId: (id: string) => unknown;
      }
    | undefined
  >(undefined);
  const appliedMainNodeIdRef = useRef<string | null>(null);
  const editTreeRef = useRef<{ exportData: () => unknown; destroy: () => unknown } | null>(null);
  const lastExportRef = useRef<FamilyChartData | null>(null);
  const removedIdsRef = useRef<Set<string>>(new Set());
  /** True when the next `data` prop update came from our own `onDataChange`, not from the parent. */
  const internalChangeRef = useRef(false);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const callbacksRef = useRef({ onDataChange, onPersistedData, onUpdate, onAdd, onRemove });
  callbacksRef.current = { onDataChange, onPersistedData, onUpdate, onAdd, onRemove };
  const onOpenPersonPageRef = useRef(onOpenPersonPage);
  onOpenPersonPageRef.current = onOpenPersonPage;
  const mainNodeIdRef = useRef(mainNodeId);
  mainNodeIdRef.current = mainNodeId;

  const createdForKeyRef = useRef<string | number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const persistLatestTree = useCallback(async () => {
    const tree = editTreeRef.current;
    if (!tree) {
      return;
    }
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      const nodes = tree.exportData() as FamilyChartData;
      const savedNodes = await saveFamilyTree({
        nodes,
        removed_ids: Array.from(removedIdsRef.current),
      });

      removedIdsRef.current = new Set();
      lastExportRef.current = savedNodes;
      internalChangeRef.current = true;
      callbacksRef.current.onDataChange(savedNodes);
      callbacksRef.current.onPersistedData?.(savedNodes);
      console.log('Древо семьи сохранено из формы редактирования.');
    } catch (error) {
      console.error('Не удалось сохранить древо семьи:', error);
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void persistLatestTree();
      }
    }
  }, []);

  const handleFirstPersonCreated = useCallback((saved: FamilyChartData) => {
    removedIdsRef.current = new Set();
    lastExportRef.current = saved;
    internalChangeRef.current = true;
    const { added } = diffPersonIds(null, saved);
    callbacksRef.current.onDataChange(saved);
    callbacksRef.current.onPersistedData?.(saved);
    callbacksRef.current.onUpdate?.(saved);
    if (added.length) {
      callbacksRef.current.onAdd?.(saved, added);
    }
    console.log('Первая персона в древе создана и сохранена на сервере.');
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) {
      return;
    }
    if (chartRef.current && createdForKeyRef.current === remountKey) {
      return;
    }

    const el = containerRef.current;
    el.innerHTML = '';

    const chart = f3.createChart(el, data);
    chart.setSingleParentEmptyCard(true, { label: 'Добавить' });
    (chart.store.state as Record<string, unknown>).unknown_card_label = 'Неизвестно';
    const card = chart.setCardHtml();
    card.setCardDisplay(cardDisplay);
    /** HTML cards default `mini_tree: false`; enable like SVG example — icon when `!all_rels_displayed`. */
    card.setMiniTree(true);

    card.setOnCardUpdate(function (this: HTMLElement, d: { data: Record<string, unknown> & { id?: string; to_add?: unknown; unknown?: unknown; _new_rel_data?: unknown } }) {
      const cardEl = this.querySelector('.card');
      if (!cardEl) {
        return;
      }
      cardEl.querySelectorAll('.f3-person-profile-bar').forEach((n) => n.remove());

      const open = onOpenPersonPageRef.current;
      if (!open) {
        return;
      }

      const node = d.data;
      if (node.to_add || node.unknown || node._new_rel_data) {
        return;
      }

      const rawId = node.person_id ?? node.id;
      if (rawId === undefined || rawId === null || rawId === '') {
        return;
      }
      const personId = String(rawId);

      const a = document.createElement('a');
      a.className = 'f3-person-profile-bar';
      a.href = `/person/${encodeURIComponent(personId)}`;
      a.setAttribute('aria-label', 'Открыть страницу персоны');
      a.title = 'Страница персоны';
      a.innerHTML = '<span class="f3-person-profile-bar__label">Профиль</span>';
      a.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        onOpenPersonPageRef.current?.(personId);
      });
      cardEl.appendChild(a);
    });

    const editTree = chart
      .editTree()
      .setAddRelLabels(
        {
          father: 'Отец',
          mother: 'Мать',
          spouse: 'Супруг(а)',
          son: 'Сын',
          daughter: 'Дочь',
        }
      )
      .setFields(editFields)
      .setPostSubmit(() => {
        void persistLatestTree();
      })
      .setOnChange(() => {
        const et = editTreeRef.current;
        if (!et) return;
        const raw = et.exportData() as FamilyChartData;
        const prev = lastExportRef.current;
        lastExportRef.current = raw;
        const { added, removed } = diffPersonIds(prev, raw);
        removed.forEach((id) => removedIdsRef.current.add(id));

        internalChangeRef.current = true;
        callbacksRef.current.onDataChange(raw);
        callbacksRef.current.onUpdate?.(raw);
        if (added.length) {
          callbacksRef.current.onAdd?.(raw, added);
        }
        if (removed.length) {
          callbacksRef.current.onRemove?.(raw, removed);
        }
      })
      .setCardClickOpen(card);

    editTreeRef.current = editTree;
    chartRef.current = chart;
    createdForKeyRef.current = remountKey;
    lastExportRef.current = data;

    const stopRussianUi = observeRussianFamilyChartUi(el);

    // Корень древа: `mainNodeId` с родителя (например FamilyChartPage: URL ?main/?person → персона учётки → первый узел в JSON).
    chart.updateMainId(mainNodeIdRef.current).updateTree({ initial: true });
    appliedMainNodeIdRef.current = mainNodeIdRef.current;

    internalChangeRef.current = true;

    return () => {
      stopRussianUi();
      editTree.destroy();
      el.innerHTML = '';
      chartRef.current = undefined;
      editTreeRef.current = null;
      lastExportRef.current = null;
      removedIdsRef.current = new Set();
      pendingSaveRef.current = false;
      createdForKeyRef.current = null;
      appliedMainNodeIdRef.current = null;
    };
    // mainNodeIdRef всегда актуален; смена только корня без пересоздания графа — отдельный эффект ниже.
  }, [data, remountKey, cardDisplay, editFields, persistLatestTree]);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }
    if (appliedMainNodeIdRef.current === mainNodeId) {
      return;
    }
    appliedMainNodeIdRef.current = mainNodeId;
    chartRef.current.updateMainId(mainNodeId);
    chartRef.current.updateTree({ tree_position: 'main_to_middle' });
  }, [mainNodeId]);

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) {
      return;
    }
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }
    chartRef.current.updateData(data);
    chartRef.current.updateTree({ tree_position: 'inherit' });

    lastExportRef.current = data;
  }, [data]);

  if (!data) {
    return null;
  }

  const chartAreaSx = {
    width: '100%',
    height: { xs: 560, sm: 720, md: 900 },
    maxWidth: '100%',
    mx: 'auto' as const,
  };

  if (data.length === 0) {
    return (
      <Box
        className="f3 chart-container"
        id="FamilyChart"
        data-testid="family-chart-empty"
        aria-busy={false}
        sx={{
          ...chartAreaSx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <FamilyChartEmptyFirstPerson onCreated={handleFirstPersonCreated} />
      </Box>
    );
  }

  return (
    <Box
      className="f3 chart-container"
      id="FamilyChart"
      ref={containerRef}
      data-testid="family-chart-root"
      aria-busy={isSaving}
      sx={{
        ...chartAreaSx,
        // family-chart: скрыть «Удалить связь» в форме карточки (режим remove-relative путает и обходит явное сохранение).
        '& .f3-remove-relative-btn': { display: 'none' },
      }}
    />
  );
}
