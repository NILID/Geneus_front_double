import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AccountSettingsForm } from './AccountSettingsForm';
import { useAuth } from '../auth/AuthContext';
import { canAccessAudit, canManageUsers } from '../auth/roles';

type NavItem = {
  to: string;
  label: string;
  active: boolean;
};

export function MainAppBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { to: '/tree', label: 'Древо', active: pathname === '/tree' },
      { to: '/media', label: 'Медиа', active: pathname === '/media' },
      { to: '/map', label: 'Карта', active: pathname === '/map' },
      { to: '/ideas', label: 'Идеи', active: pathname === '/ideas' },
    ];
    if (canManageUsers(user?.role)) {
      items.push({
        to: '/admin/users',
        label: 'Пользователи',
        active: pathname === '/admin/users',
      });
    }
    if (canAccessAudit(user?.role)) {
      items.push({ to: '/audit', label: 'Аудит', active: pathname === '/audit' });
    }
    return items;
  }, [pathname, user?.role]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const email = user?.email ?? '';

  function openAccount() {
    setMobileNavOpen(false);
    setAccountOpen(true);
  }

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
      <Toolbar variant="dense" sx={{ gap: 1, py: 1, flexWrap: 'nowrap' }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 700,
            mr: { xs: 0, sm: 1 },
            flexShrink: 0,
          }}
        >
          Родословная
        </Typography>
        {isDesktop ? (
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                color="inherit"
                size="small"
                sx={{
                  fontWeight: item.active ? 600 : 400,
                  ...(item.active && { bgcolor: 'action.selected' }),
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        ) : null}
        <Box sx={{ flexGrow: 1 }} />
        {email && isDesktop ? (
          <Box
            component="button"
            type="button"
            onClick={() => setAccountOpen(true)}
            sx={{
              cursor: 'pointer',
              maxWidth: 280,
              textAlign: 'right',
              border: 'none',
              background: 'none',
              padding: 0,
              font: 'inherit',
              color: 'inherit',
              flexShrink: 1,
              minWidth: 0,
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
        {!isDesktop ? (
          <IconButton
            color="inherit"
            aria-label="Открыть меню"
            edge="end"
            onClick={() => setMobileNavOpen(true)}
          >
            <MenuIcon />
          </IconButton>
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
        {isDesktop ? (
          <Button variant="outlined" color="inherit" size="small" onClick={() => void handleLogout()}>
            Выйти
          </Button>
        ) : null}
      </Toolbar>

      <Drawer
        anchor="right"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ width: 280, pt: 1 }} role="navigation" aria-label="Главное меню">
          <List disablePadding>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                selected={item.active}
                onClick={() => setMobileNavOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
          {email ? (
            <>
              <Divider />
              <List disablePadding>
                <ListItemButton onClick={openAccount}>
                  <ListItemText
                    primary="Учётная запись"
                    secondary={email}
                    slotProps={{ secondary: { noWrap: true } }}
                  />
                </ListItemButton>
              </List>
            </>
          ) : null}
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button variant="outlined" color="inherit" fullWidth onClick={() => void handleLogout()}>
              Выйти
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
