import React, { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export type FamilyChartAddPersonDialogProps = {
  open: boolean;
  relLabel: string;
  onClose: () => void;
  onSubmit: (values: { firstName: string; lastName: string }) => void;
  submitting?: boolean;
  error?: string | null;
};

export function FamilyChartAddPersonDialog({
  open,
  relLabel,
  onClose,
  onSubmit,
  submitting = false,
  error = null,
}: FamilyChartAddPersonDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFirstName('');
    setLastName('');
    setValidationError(null);
  }, [open, relLabel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn && !ln) {
      setValidationError('Укажите имя или фамилию.');
      return;
    }
    setValidationError(null);
    onSubmit({ firstName: fn, lastName: ln });
  };

  const displayError = validationError ?? error;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="family-chart-add-person-title"
      data-testid="family-chart-add-person-dialog"
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        <DialogTitle id="family-chart-add-person-title">Новая персона</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Родство: <strong>{relLabel}</strong>
            </Typography>
            {displayError && (
              <Alert severity="error" role="alert">
                {displayError}
              </Alert>
            )}
            <TextField
              label="Имя"
              value={firstName}
              onChange={(ev) => setFirstName(ev.target.value)}
              fullWidth
              autoFocus
              autoComplete="given-name"
              disabled={submitting}
            />
            <TextField
              label="Фамилия"
              value={lastName}
              onChange={(ev) => setLastName(ev.target.value)}
              fullWidth
              autoComplete="family-name"
              disabled={submitting}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
