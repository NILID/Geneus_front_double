import React, { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { fetchAdminUsers, patchAdminUserRole, type AdminUserRow } from '../api/adminUsersApi';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../auth/roles';
import { SessionLoading } from '../components/SessionLoading';

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Пользователь',
  moderator: 'Модератор',
  admin: 'Администратор',
};

function formatLastSeen(iso: string | null): string {
  if (!iso) {
    return 'Никогда';
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

export function UsersAdminPage() {
  const { user, refreshUser } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<AdminUserRow | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole>('user');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return fetchAdminUsers()
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить список');
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  function openModal(u: AdminUserRow) {
    setModalUser(u);
    setPendingRole(u.role);
    setSaveError(null);
  }

  function closeModal() {
    if (saving) {
      return;
    }
    setModalUser(null);
  }

  async function saveRole() {
    if (!modalUser) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await patchAdminUserRole(modalUser.id, pendingRole);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (user?.id === updated.id) {
        await refreshUser();
      }
      setModalUser(null);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <SessionLoading message="Загружаем пользователей…" />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700 }}>
          Пользователи
        </Typography>
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button variant="outlined" size="small" onClick={() => void load()}>
            Обновить
          </Button>
        </Stack>
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Персона</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Был на сайте</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.person_id != null ? `#${row.person_id}` : '—'}</TableCell>
                  <TableCell>{ROLE_LABELS[row.role]}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatLastSeen(row.last_sign_in_at)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => openModal(row)}>
                      Изменить роль
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Dialog open={Boolean(modalUser)} onClose={() => !saving && closeModal()} fullWidth maxWidth="xs">
        <DialogTitle>Роль: {modalUser?.email}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="admin-user-role-label">Роль</InputLabel>
              <Select<UserRole>
                labelId="admin-user-role-label"
                label="Роль"
                value={pendingRole}
                onChange={(e: SelectChangeEvent<UserRole>) => setPendingRole(e.target.value as UserRole)}
                disabled={saving}
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <MenuItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {saveError ? (
              <Alert severity="error" role="alert">
                {saveError}
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} disabled={saving}>
            Отмена
          </Button>
          <Button variant="contained" onClick={() => void saveRole()} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
