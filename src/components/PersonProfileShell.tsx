import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import MuiAvatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { personDisplayName, type PersonDetail } from '../api/personApi';

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
  children,
}: {
  person: PersonDetail;
  personId: string;
  activeTab: PersonProfileTab;
  breadcrumbs: React.ReactNode;
  children: React.ReactNode;
}) {
  const base = `/person/${encodeURIComponent(personId)}`;

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
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 0, bgcolor: 'background.paper' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                alignItems: { xs: 'center', sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  alignItems: { xs: 'center', sm: 'center' },
                  flex: 1,
                  minWidth: 0,
                  width: '100%',
                }}
              >
                <MuiAvatar
                  src={person.avatar_url ?? undefined}
                  alt={personDisplayName(person)}
                  sx={{
                    width: { xs: 132, sm: 168 },
                    height: { xs: 132, sm: 168 },
                    flexShrink: 0,
                    border: (t) => `4px solid ${t.palette.background.paper}`,
                    boxShadow: 2,
                    fontSize: { xs: '2.5rem', sm: '3rem' },
                  }}
                >
                  {person.avatar_url ? null : personAvatarFallback(person)}
                </MuiAvatar>

                <Box
                  sx={{
                    textAlign: { xs: 'center', sm: 'left' },
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}
                  >
                    {personDisplayName(person)}
                  </Typography>
                  {person.chart_id && person.chart_id !== person.chart_external_id && (
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
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: { xs: 'center', sm: 'flex-end' },
                  flexShrink: 0,
                }}
              >
                <Button
                  component={RouterLink}
                  to={`${base}/edit`}
                  variant="contained"
                  size="medium"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Изменить
                </Button>
              </Stack>
            </Stack>

            <Tabs
              value={activeTab === 'edit' ? false : activeTab}
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
          </Box>
        </Paper>

        {children}
      </Box>
    </Box>
  );
}
