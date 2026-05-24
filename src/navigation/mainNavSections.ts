import type { SvgIconComponent } from '@mui/icons-material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';

export type MainNavSection = {
  to: string;
  label: string;
  Icon: SvgIconComponent;
};

export const ADMIN_MENU_ICON = AdminPanelSettingsOutlinedIcon;

export const MAIN_NAV_SECTIONS: MainNavSection[] = [
  { to: '/tree', label: 'Древо', Icon: AccountTreeIcon },
  { to: '/media', label: 'Медиа', Icon: PhotoLibraryOutlinedIcon },
  { to: '/map', label: 'Карта', Icon: MapOutlinedIcon },
  { to: '/ideas', label: 'Идеи', Icon: EditNoteOutlinedIcon },
];
