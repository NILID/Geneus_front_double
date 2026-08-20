import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
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
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AccountSettingsForm } from './AccountSettingsForm';
import { NavSectionIcon } from './NavSectionIcon';
import { useAuth } from '../auth/AuthContext';
import { canAccessAudit, canManageUsers, canSendAdminDigest } from '../auth/roles';
import { ADMIN_MENU_ICON, MAIN_NAV_SECTIONS } from '../navigation/mainNavSections';

type AdminNavItem = {
  to: string;
  label: string;
};

export function MainAppBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);

  const mainNavItems = useMemo(
    () =>
      MAIN_NAV_SECTIONS.map((section) => ({
        ...section,
        active: pathname === section.to,
      })),
    [pathname],
  );

  const adminNavItems = useMemo((): AdminNavItem[] => {
    const items: AdminNavItem[] = [];
    if (canManageUsers(user?.role)) {
      items.push({ to: '/admin/users', label: 'Пользователи' });
    }
    if (canSendAdminDigest(user?.role)) {
      items.push({ to: '/admin/digest', label: 'Дайджест' });
    }
    if (canAccessAudit(user?.role)) {
      items.push({ to: '/audit', label: 'Аудит' });
    }
    return items;
  }, [user?.role]);

  const showAdminMenu = adminNavItems.length > 0;
  const adminMenuActive = adminNavItems.some((item) => pathname === item.to);
  const adminMenuOpen = Boolean(adminMenuAnchor);

  useEffect(() => {
    setMobileNavOpen(false);
    setAdminMenuAnchor(null);
  }, [pathname]);

  function openAdminMenu(event: React.MouseEvent<HTMLElement>) {
    setAdminMenuAnchor(event.currentTarget);
  }

  function closeAdminMenu() {
    setAdminMenuAnchor(null);
  }

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
        <Box
          component={RouterLink}
          to="/"
          aria-label="Родословная — на главную"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            color: 'inherit',
            textDecoration: 'none',
            mr: { xs: 0, sm: 1 },
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={`${process.env.PUBLIC_URL}/logo192.png`}
            alt=""
            sx={{ width: 32, height: 32, display: 'block' }}
          />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Родословная
          </Typography>
        </Box>
        {isDesktop ? (
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ alignItems: 'center' }}>
            {mainNavItems.map((item) => {
              const Icon = item.Icon;
              return (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  color="inherit"
                  size="small"
                  sx={{
                    px: 1,
                    fontWeight: item.active ? 600 : 400,
                    ...(item.active && { bgcolor: 'action.selected' }),
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <NavSectionIcon>
                      <Icon />
                    </NavSectionIcon>
                    {item.label}
                  </Stack>
                </Button>
              );
            })}
            {showAdminMenu ? (
              <Button
                color="inherit"
                size="small"
                onClick={openAdminMenu}
                aria-haspopup="true"
                aria-expanded={adminMenuOpen ? 'true' : undefined}
                aria-controls={adminMenuOpen ? 'admin-nav-menu' : undefined}
                sx={{
                  px: 1,
                  fontWeight: adminMenuActive ? 600 : 400,
                  ...(adminMenuActive && { bgcolor: 'action.selected' }),
                }}
              >
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <NavSectionIcon>
                    <ADMIN_MENU_ICON />
                  </NavSectionIcon>
                  Админ
                  <ArrowDropDownIcon sx={{ fontSize: 20, opacity: 0.7 }} />
                </Stack>
              </Button>
            ) : null}
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
            {mainNavItems.map((item) => {
              const Icon = item.Icon;
              return (
                <ListItemButton
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  selected={item.active}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <NavSectionIcon>
                      <Icon />
                    </NavSectionIcon>
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
            {showAdminMenu ? (
              <ListItemButton
                selected={adminMenuActive}
                onClick={openAdminMenu}
                aria-haspopup="true"
                aria-expanded={adminMenuOpen ? 'true' : undefined}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <NavSectionIcon>
                    <ADMIN_MENU_ICON />
                  </NavSectionIcon>
                </ListItemIcon>
                <ListItemText primary="Админ" />
                <ArrowDropDownIcon fontSize="small" color="action" />
              </ListItemButton>
            ) : null}
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

      {showAdminMenu ? (
        <Menu
          id="admin-nav-menu"
          anchorEl={adminMenuAnchor}
          open={adminMenuOpen}
          onClose={closeAdminMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          {adminNavItems.map((item) => (
            <MenuItem
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={pathname === item.to}
              onClick={() => {
                closeAdminMenu();
                setMobileNavOpen(false);
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      ) : null}
    </AppBar>
  );
}
