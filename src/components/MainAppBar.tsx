import React, { useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { AccountSettingsForm } from './AccountSettingsForm';
import { useAuth } from '../auth/AuthContext';
import { canAccessAudit, canManageUsers } from '../auth/roles';

type NavItem = { to: string; label: string; active: boolean };

export function MainAppBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const treeActive = pathname === '/tree';
  const mediaActive = pathname === '/media';
  const mapActive = pathname === '/map';
  const ideasActive = pathname === '/ideas';
  const auditActive = pathname === '/audit';
  const adminUsersActive = pathname === '/admin/users';

  const navItems = useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { to: '/tree', label: 'Древо', active: treeActive },
      { to: '/media', label: 'Медиа', active: mediaActive },
      { to: '/map', label: 'Карта', active: mapActive },
      { to: '/ideas', label: 'Идеи', active: ideasActive },
    ];
    if (canManageUsers(user?.role)) {
      items.push({ to: '/admin/users', label: 'Пользователи', active: adminUsersActive });
    }
    if (canAccessAudit(user?.role)) {
      items.push({ to: '/audit', label: 'Аудит', active: auditActive });
    }
    return items;
  }, [
    user?.role,
    treeActive,
    mediaActive,
    mapActive,
    ideasActive,
    auditActive,
    adminUsersActive,
  ]);

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
      <Toolbar
        variant="dense"
        sx={{
          gap: 1,
          flexWrap: 'nowrap',
          py: 1,
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <IconButton
            color="inherit"
            aria-label="Открыть меню разделов"
            edge="start"
            onClick={() => setMobileNavOpen(true)}
            size="small"
            sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: -0.5 }}
          >
            <MenuIcon />
          </IconButton>
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
        </Box>
        <Stack
          direction="row"
          spacing={0.5}
          useFlexGap
          sx={{
            flexWrap: 'wrap',
            alignItems: 'center',
            display: { xs: 'none', md: 'flex' },
          }}
        >
          {navItems.map(({ to, label, active }) => (
            <Button
              key={to}
              component={RouterLink}
              to={to}
              color="inherit"
              size="small"
              sx={{
                fontWeight: active ? 600 : 400,
                ...(active && { bgcolor: 'action.selected' }),
              }}
            >
              {label}
            </Button>
          ))}
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
      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        <Box sx={{ pt: 2 }} role="presentation">
          <List component="nav" dense>
            {navItems.map(({ to, label, active }) => (
              <ListItemButton
                key={to}
                component={RouterLink}
                to={to}
                selected={active}
                onClick={() => setMobileNavOpen(false)}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
