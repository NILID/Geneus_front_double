import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Link as RouterLink } from 'react-router-dom';
import {
  fetchAuditFilterOptions,
  fetchAudits,
  type AuditFilterOptions,
  type AuditRow,
  type AuditsMeta,
} from '../api/auditApi';
import { SessionLoading } from '../components/SessionLoading';
import { useAuth } from '../auth/AuthContext';

const AUDITABLE_LABELS: Record<string, string> = {
  Person: 'Персона',
  User: 'Пользователь',
  GalleryPhoto: 'Фото',
  Idea: 'Идея',
  Comment: 'Комментарий',
  PersonFact: 'Факт о персоне',
  Partnership: 'Партнёрство',
  Parentship: 'Родство',
  GalleryPhotoPersonTag: 'Отметка на фото',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Создание',
  update: 'Изменение',
  destroy: 'Удаление',
};

function formatWhen(iso: string): string {
  if (!iso) {
    return '';
  }
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function auditableLabel(type: string): string {
  return AUDITABLE_LABELS[type] ?? type;
}

function actionChip(action: string) {
  const label = ACTION_LABELS[action] ?? action;
  const color =
    action === 'create' ? 'success' : action === 'destroy' ? 'error' : action === 'update' ? 'info' : 'default';
  return <Chip size="small" label={label} color={color} variant={color === 'default' ? 'outlined' : 'filled'} />;
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) {
    return '—';
  }
  if (typeof v === 'boolean') {
    return v ? 'да' : 'нет';
  }
  if (typeof v === 'string' || typeof v === 'number') {
    return String(v);
  }
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function describeChange(val: unknown): string {
  if (Array.isArray(val) && val.length === 2) {
    return `${formatScalar(val[0])} → ${formatScalar(val[1])}`;
  }
  return formatScalar(val);
}

function ChangesBody({ row }: { row: AuditRow }) {
  const entries = Object.entries(row.audited_changes);
  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Нет сохранённых атрибутов для этого события.
      </Typography>
    );
  }
  return (
    <Stack spacing={1.25} sx={{ pt: 1 }}>
      {entries.map(([key, val]) => (
        <Paper key={key} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="primary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            {key}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {describeChange(val)}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}

function AuditableLink({ row }: { row: AuditRow }) {
  if (row.auditable_type === 'Person') {
    return (
      <Link component={RouterLink} to={`/person/${row.auditable_id}`} underline="hover">
        {row.auditable_id}
      </Link>
    );
  }
  return <Typography component="span">{row.auditable_id}</Typography>;
}

type FilterFields = {
  actionType: string;
  userId: string;
  auditableType: string;
  auditableId: string;
  q: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: FilterFields = {
  actionType: '',
  userId: '',
  auditableType: '',
  auditableId: '',
  q: '',
  from: '',
  to: '',
};

export function AuditLogPage() {
  const { loading: authLoading } = useAuth();
  const [options, setOptions] = useState<AuditFilterOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [rows, setRows] = useState<AuditRow[]>([]);
  const [meta, setMeta] = useState<AuditsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [draft, setDraft] = useState<FilterFields>({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<FilterFields>({ ...EMPTY_FILTERS });
  const [page, setPage] = useState(1);

  const [detailRow, setDetailRow] = useState<AuditRow | null>(null);

  const loadOptions = useCallback(() => {
    setOptionsError(null);
    return fetchAuditFilterOptions()
      .then(setOptions)
      .catch((e: unknown) => {
        setOptionsError(e instanceof Error ? e.message : 'Не удалось загрузить фильтры');
      });
  }, []);

  const queryParams = useMemo(
    () => ({
      page,
      perPage: 25,
      actionType: applied.actionType || undefined,
      userId: applied.userId ? Number(applied.userId) : undefined,
      auditableType: applied.auditableType || undefined,
      auditableId: applied.auditableId ? Number(applied.auditableId) : undefined,
      q: applied.q || undefined,
      from: applied.from || undefined,
      to: applied.to || undefined,
    }),
    [applied, page],
  );

  const loadAudits = useCallback(() => {
    setListError(null);
    return fetchAudits(queryParams)
      .then((res) => {
        setRows(res.audits);
        setMeta(res.meta);
      })
      .catch((e: unknown) => {
        setListError(e instanceof Error ? e.message : 'Не удалось загрузить журнал');
      });
  }, [queryParams]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadAudits().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, loadAudits]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setApplied({ ...draft });
    setPage(1);
  }

  function handleReset() {
    setDraft({ ...EMPTY_FILTERS });
    setApplied({ ...EMPTY_FILTERS });
    setPage(1);
  }

  function handlePageChange(_: React.ChangeEvent<unknown>, value: number) {
    setPage(value);
  }

  const handleActionChange = (ev: SelectChangeEvent<string>) =>
    setDraft((d) => ({ ...d, actionType: ev.target.value }));
  const handleUserChange = (ev: SelectChangeEvent<string>) =>
    setDraft((d) => ({ ...d, userId: ev.target.value }));
  const handleTypeChange = (ev: SelectChangeEvent<string>) =>
    setDraft((d) => ({ ...d, auditableType: ev.target.value }));

  if (authLoading) {
    return <SessionLoading />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h1" sx={{ mb: 0.5 }}>
            Журнал аудита
          </Typography>
          <Typography variant="body2" color="text.secondary">
            История изменений в родословной: кто и что менял. Данные собираются автоматически при работе через API.
            Укажите условия и нажмите «Применить».
          </Typography>
        </Box>

        <Paper
          component="form"
          onSubmit={handleApplyFilters}
          elevation={0}
          sx={{
            p: 2,
            border: 1,
            borderColor: 'divider',
            background: (theme) =>
              `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover}22 100%)`,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Фильтры
          </Typography>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              useFlexGap
              sx={{ flexWrap: 'wrap', alignItems: { md: 'flex-end' } }}
            >
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="audit-action-label">Событие</InputLabel>
                <Select
                  labelId="audit-action-label"
                  label="Событие"
                  value={draft.actionType}
                  onChange={handleActionChange}
                >
                  <MenuItem value="">Все</MenuItem>
                  {(options?.actions ?? ['create', 'update', 'destroy']).map((a) => (
                    <MenuItem key={a} value={a}>
                      {ACTION_LABELS[a] ?? a}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="audit-user-label">Пользователь</InputLabel>
                <Select labelId="audit-user-label" label="Пользователь" value={draft.userId} onChange={handleUserChange}>
                  <MenuItem value="">Все</MenuItem>
                  {(options?.users ?? []).map((u) => (
                    <MenuItem key={u.id} value={String(u.id)}>
                      {u.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="audit-type-label">Тип объекта</InputLabel>
                <Select
                  labelId="audit-type-label"
                  label="Тип объекта"
                  value={draft.auditableType}
                  onChange={handleTypeChange}
                >
                  <MenuItem value="">Все</MenuItem>
                  {(options?.auditable_types ?? []).map((t) => (
                    <MenuItem key={t} value={t}>
                      {auditableLabel(t)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="ID объекта"
                type="number"
                value={draft.auditableId}
                onChange={(e) => setDraft((d) => ({ ...d, auditableId: e.target.value }))}
                sx={{ width: { xs: '100%', sm: 130 } }}
                slotProps={{ htmlInput: { min: 1 } }}
              />

              <TextField
                size="small"
                label="Комментарий к записи"
                value={draft.q}
                onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                placeholder="Поиск по тексту комментария"
                sx={{ flex: { md: '1 1 220px' }, minWidth: { md: 220 } }}
              />

              <TextField
                size="small"
                label="С даты"
                type="datetime-local"
                value={draft.from}
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 220 } }}
              />

              <TextField
                size="small"
                label="По дату"
                type="datetime-local"
                value={draft.to}
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 220 } }}
              />
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button type="submit" variant="contained" disabled={loading}>
                Применить
              </Button>
              <Button type="button" variant="outlined" onClick={handleReset} disabled={loading}>
                Сбросить
              </Button>
            </Stack>
          </Stack>
          {optionsError ? (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              {optionsError}
            </Typography>
          ) : null}
        </Paper>

        {listError ? (
          <Typography color="error" variant="body2">
            {listError}
          </Typography>
        ) : null}

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            maxHeight: { xs: '70vh', md: 'none' },
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Когда</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Событие</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Объект</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Пользователь</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Комментарий</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Детали
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      Загрузка…
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      Записей не найдено. Попробуйте изменить фильтры или выполните действия в приложении — они появятся
                      здесь.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatWhen(row.created_at)}</TableCell>
                    <TableCell>{actionChip(row.action)}</TableCell>
                    <TableCell>{auditableLabel(row.auditable_type)}</TableCell>
                    <TableCell>
                      <AuditableLink row={row} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap title={row.user_email ?? ''}>
                        {row.user_email ?? (row.user_id != null ? `#${row.user_id}` : '—')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" noWrap title={row.comment ?? ''}>
                        {row.comment ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Просмотр изменений">
                        <IconButton
                          size="small"
                          aria-label="Подробности изменений"
                          onClick={() => setDetailRow(row)}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {meta && meta.total_pages > 1 ? (
          <Stack sx={{ py: 1, alignItems: 'center' }}>
            <Pagination
              color="primary"
              page={meta.page}
              count={Math.max(1, meta.total_pages)}
              onChange={handlePageChange}
              showFirstButton
              showLastButton
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Всего записей: {meta.total_count}
            </Typography>
          </Stack>
        ) : meta && meta.total_count > 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
            Всего записей: {meta.total_count}
          </Typography>
        ) : null}
      </Stack>

      <Dialog open={detailRow != null} onClose={() => setDetailRow(null)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>Подробности записи</DialogTitle>
        <DialogContent>
          {detailRow ? (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {formatWhen(detailRow.created_at)} · {auditableLabel(detailRow.auditable_type)} #{detailRow.auditable_id}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {actionChip(detailRow.action)}
                {detailRow.remote_address ? (
                  <Chip size="small" variant="outlined" label={`IP: ${detailRow.remote_address}`} />
                ) : null}
              </Box>
              <ChangesBody row={detailRow} />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailRow(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
