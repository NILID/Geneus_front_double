import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { AccountSettingsForm } from './AccountSettingsForm';
import { useAuth } from '../auth/AuthContext';

export function MainAppBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const treeActive = pathname === '/tree';
  const mediaActive = pathname === '/media';
  const mapActive = pathname === '/map';
  const ideasActive = pathname === '/ideas';

  const email = user?.email ?? '';

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar variant="dense" sx={{ gap: 1, flexWrap: 'wrap', py: 1 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 700,
            mr: { xs: 0, sm: 1 },
          }}
        >
          Родословная
        </Typography>
        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            component={RouterLink}
            to="/tree"
            color="inherit"
            size="small"
            sx={{
              fontWeight: treeActive ? 600 : 400,
              ...(treeActive && { bgcolor: 'action.selected' }),
            }}
          >
            Древо
          </Button>
          <Button
            component={RouterLink}
            to="/media"
            color="inherit"
            size="small"
            sx={{
              fontWeight: mediaActive ? 600 : 400,
              ...(mediaActive && { bgcolor: 'action.selected' }),
            }}
          >
            Медиа
          </Button>
          <Button
            component={RouterLink}
            to="/map"
            color="inherit"
            size="small"
            sx={{
              fontWeight: mapActive ? 600 : 400,
              ...(mapActive && { bgcolor: 'action.selected' }),
            }}
          >
            Карта
          </Button>
          <Button
            component={RouterLink}
            to="/ideas"
            color="inherit"
            size="small"
            sx={{
              fontWeight: ideasActive ? 600 : 400,
              ...(ideasActive && { bgcolor: 'action.selected' }),
            }}
          >
            Идеи
          </Button>
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        {email ? (
          <Box
            component="button"
            type="button"
            onClick={() => setAccountOpen(true)}
            sx={{
              cursor: 'pointer',
              maxWidth: { xs: 160, sm: 280 },
              textAlign: 'right',
              border: 'none',
              background: 'none',
              padding: 0,
              font: 'inherit',
              color: 'inherit',
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              title={email}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': { color: 'text.primary' },
              }}
            >
              {email}
            </Typography>
          </Box>
        ) : null}
        <Dialog
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="account-dialog-title"
        >
          <DialogTitle id="account-dialog-title">Учётная запись: {email}</DialogTitle>
          <DialogContent dividers>
            <AccountSettingsForm
              fieldIdPrefix="account-navbar"
              showIntro
              onSaved={() => setAccountOpen(false)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAccountOpen(false)}>Закрыть</Button>
          </DialogActions>
        </Dialog>
        <Button variant="outlined" color="inherit" size="small" onClick={() => void handleLogout()}>
          Выйти
        </Button>
      </Toolbar>
    </AppBar>
  );
}
