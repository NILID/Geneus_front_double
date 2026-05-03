import React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';

export function MainAppBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const treeActive = pathname === '/';
  const mediaActive = pathname === '/media';
  const mapActive = pathname === '/map';
  const ideasActive = pathname === '/ideas';

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
            to="/"
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
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: { xs: 140, sm: 280 }, display: { xs: 'none', sm: 'block' } }}>
          {user?.email}
        </Typography>
        <Button variant="outlined" color="inherit" size="small" onClick={() => void handleLogout()}>
          Выйти
        </Button>
      </Toolbar>
    </AppBar>
  );
}
