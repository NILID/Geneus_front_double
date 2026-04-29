import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';
import Box from '@mui/material/Box';
import { saveFamilyTree, type FamilyChartData } from '../familyChartApi';
import { diffPersonIds } from '../familyChartEdit/diffTree';

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
  cardDisplay?: string[][];
  /** Form + schema fields; include `gender` so new relatives validate. */
  editFields?: string[];
  /** Bump to destroy and recreate the chart (e.g. after a server refetch). */
  remountKey?: string | number;
} & FamilyChartEditCallbacks;

const DEFAULT_CARD_DISPLAY: string[][] = [['first name', 'last name'], ['birthday']];
const DEFAULT_EDIT_FIELDS = ['first name', 'last name', 'birthday', 'gender'];

/**
 * Interactive tree using `family-chart` EditTree (same flow as docs example “17-edit-tree”):
 * {@link https://donatso.github.io/family-chart-doc/examples/v2/17-edit-tree}
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
}: FamilyChartEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<
    | {
        updateData: (d: FamilyChartData) => unknown;
        updateTree: (p: { initial?: boolean; tree_position?: string }) => unknown;
      }
    | undefined
  >(undefined);
  const editTreeRef = useRef<{ exportData: () => unknown; destroy: () => unknown } | null>(null);
  const lastExportRef = useRef<FamilyChartData | null>(null);
  const removedIdsRef = useRef<Set<string>>(new Set());
  /** True when the next `data` prop update came from our own `onDataChange`, not from the parent. */
  const internalChangeRef = useRef(false);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const callbacksRef = useRef({ onDataChange, onPersistedData, onUpdate, onAdd, onRemove });
  callbacksRef.current = { onDataChange, onPersistedData, onUpdate, onAdd, onRemove };

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
      console.log('Древо семьи сохранено из формы редактирования.')
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

  useEffect(() => {
    if (!data || !containerRef.current) {
      return;
    }
    if (chartRef.current && createdForKeyRef.current === remountKey) {
      return;
    }

    const el = containerRef.current;
    el.innerHTML = '';

    const chart = f3.createChart(el, data);
    const card = chart.setCardHtml();
    card.setCardDisplay(cardDisplay);

    const editTree = chart
      .editTree()
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

    chart.updateTree({ initial: true });
    internalChangeRef.current = true;

    return () => {
      editTree.destroy();
      el.innerHTML = '';
      chartRef.current = undefined;
      editTreeRef.current = null;
      lastExportRef.current = null;
      removedIdsRef.current = new Set();
      pendingSaveRef.current = false;
      createdForKeyRef.current = null;
    };
  }, [data, remountKey, cardDisplay, editFields, persistLatestTree]);

  useEffect(() => {
    if (!data || !chartRef.current) {
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

  return (
    <Box
      className="f3 chart-container"
      id="FamilyChart"
      ref={containerRef}
      data-testid="family-chart-root"
      aria-busy={isSaving}
      sx={{
        width: '100%',
        height: { xs: 560, sm: 720, md: 900 },
        maxWidth: '100%',
        mx: 'auto',
      }}
    />
  );
}
