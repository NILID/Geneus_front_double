import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AccountTree from '@mui/icons-material/AccountTree';
import MuiAvatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { resolveRailsBlobUrl } from '../api/assetUrls';
import { personDisplayName, type PersonDetail } from '../api/personApi';
import { ImageLightboxModal } from './ImageLightboxModal';

export type PersonProfileTab = 'overview' | 'facts' | 'edit';

function personAvatarFallback(p: PersonDetail): string {
  const fn = p.first_name.trim();
  const ln = p.last_name?.trim();
  if (fn && ln) {
    return (fn[0] + ln[0]).toUpperCase();
  }
  if (fn.length >= 2) {
    return fn.slice(0, 2).toUpperCase();
  }
  return fn.slice(0, 1).toUpperCase() || '?';
}

export function PersonProfileShell({
  person,
  personId,
  activeTab,
  breadcrumbs,
  familyTreeTo,
  showEditProfileButton = true,
  children,
}: {
  person: PersonDetail;
  personId: string;
  activeTab: PersonProfileTab;
  breadcrumbs: React.ReactNode;
  /** Ссылка на древо с корнем в этой персоне (`/tree?...`). */
  familyTreeTo?: string;
  /** Показывать кнопку «Изменить» (редактирование карточки персоны). */
  showEditProfileButton?: boolean;
  children: React.ReactNode;
}) {
  const base = `/person/${encodeURIComponent(personId)}`;
  const isEditMode = activeTab === 'edit';
  const avatarUrl = resolveRailsBlobUrl(person.avatar_url);
  const displayName = personDisplayName(person);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  const avatarSx = isEditMode
    ? {
        width: 40,
        height: 40,
        flexShrink: 0,
        fontSize: '0.875rem',
      }
    : {
        width: { xs: 132, sm: 168 },
        height: { xs: 132, sm: 168 },
        flexShrink: 0,
        border: 4,
        borderColor: 'background.paper',
        boxShadow: 2,
        fontSize: { xs: '2.5rem', sm: '3rem' },
      };

  const avatarNode = (
    <MuiAvatar src={avatarUrl ?? undefined} alt={displayName} sx={avatarSx}>
      {avatarUrl ? null : personAvatarFallback(person)}
    </MuiAvatar>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pb: 4 }}>
      <Box
        sx={{
          maxWidth: { xs: '100%', md: 980 },
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          pt: 2,
        }}
      >
        <Box sx={{ mb: 2 }}>{breadcrumbs}</Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: 1,
            borderColor: 'divider',
            mb: 2,
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: isEditMode ? { xs: 1.5, sm: 2 } : undefined,
              pt: isEditMode ? undefined : { xs: 2, sm: 2.5 },
              pb: isEditMode ? undefined : 0,
              bgcolor: 'background.paper',
            }}
          >
            <Stack
              direction={isEditMode ? 'row' : { xs: 'column', sm: 'row' }}
              spacing={isEditMode ? 1.5 : 2}
              sx={{
                alignItems: isEditMode ? 'center' : { xs: 'center', sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Stack
                direction={isEditMode ? 'row' : { xs: 'column', sm: 'row' }}
                spacing={isEditMode ? 1.5 : 2}
                sx={{
                  alignItems: isEditMode ? 'center' : { xs: 'center', sm: 'center' },
                  flex: 1,
                  minWidth: 0,
                  width: isEditMode ? undefined : { xs: '100%', sm: 'auto' },
                }}
              >
                {avatarUrl ? (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setAvatarViewerOpen(true)}
                    aria-label="Открыть фото"
                    sx={{
                      p: 0,
                      m: 0,
                      border: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      lineHeight: 0,
                      color: 'inherit',
                      font: 'inherit',
                      flexShrink: 0,
                      '&:hover': { opacity: 0.92 },
                    }}
                  >
                    {avatarNode}
                  </Box>
                ) : (
                  avatarNode
                )}

                <Box
                  sx={{
                    minWidth: 0,
                    textAlign: isEditMode ? 'left' : { xs: 'center', sm: 'left' },
                  }}
                >
                  <Typography
                    variant={isEditMode ? 'subtitle1' : 'h4'}
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                    }}
                  >
                    {personDisplayName(person)}
                  </Typography>
                  {!isEditMode &&
                    person.chart_id &&
                    person.chart_id !== person.chart_external_id && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        ID в древе: {person.chart_id}
                      </Typography>
                    )}
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  width: isEditMode ? 'auto' : { xs: '100%', sm: 'auto' },
                  justifyContent: isEditMode ? 'flex-end' : { xs: 'center', sm: 'flex-end' },
                  flexShrink: 0,
                  flexWrap: 'wrap',
                }}
              >
                {familyTreeTo ? (
                  <Button
                    component={RouterLink}
                    to={familyTreeTo}
                    variant="outlined"
                    size={isEditMode ? 'small' : 'medium'}
                    aria-label="К древу"
                    sx={{ textTransform: 'none', fontWeight: 600, minWidth: 40, px: 1 }}
                  >
                    <AccountTree fontSize="small" />
                  </Button>
                ) : null}
                {isEditMode ? (
                  <Button
                    component={RouterLink}
                    to={base}
                    variant="text"
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    К профилю
                  </Button>
                ) : showEditProfileButton ? (
                  <Button
                    component={RouterLink}
                    to={`${base}/edit`}
                    variant="contained"
                    size="medium"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Изменить
                  </Button>
                ) : null}
              </Stack>
            </Stack>

            {!isEditMode && (
              <Tabs
                value={activeTab}
                variant="fullWidth"
                sx={{
                  mt: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  minHeight: 48,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    minHeight: 48,
                  },
                }}
              >
                <Tab label="Обзор" value="overview" component={RouterLink} to={base} />
                <Tab label="Факты" value="facts" component={RouterLink} to={`${base}/facts`} />
              </Tabs>
            )}
          </Box>
        </Paper>

        {children}
      </Box>

      {avatarUrl ? (
        <ImageLightboxModal
          open={avatarViewerOpen}
          onClose={() => setAvatarViewerOpen(false)}
          imageUrl={avatarUrl}
          alt={displayName}
        />
      ) : null}
    </Box>
  );
}
