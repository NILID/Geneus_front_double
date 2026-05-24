import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import type { HomeStats } from '../api/homeApi';

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box
          aria-hidden
          sx={{
            color: 'primary.light',
            display: 'flex',
            '& .MuiSvgIcon-root': { fontSize: 20 },
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h4"
          component="span"
          sx={{ fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}
        >
          {value.toLocaleString('ru-RU')}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ pl: 3.5 }}>
        {label}
      </Typography>
    </Stack>
  );
}

export function HomeStatsCard({
  stats,
  loading,
}: {
  stats: HomeStats | null;
  loading: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2 },
        width: '100%',
        maxWidth: 240,
        bgcolor: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(144, 202, 249, 0.22)',
        backdropFilter: 'blur(10px)',
        color: 'common.white',
      }}
    >
      <Typography variant="overline" sx={{ color: 'primary.light', letterSpacing: '0.08em', mb: 2, display: 'block' }}>
        В цифрах
      </Typography>

      {loading || !stats ? (
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={48} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Skeleton variant="rounded" height={48} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          <StatItem
            icon={<GroupsOutlinedIcon />}
            value={stats.people_count}
            label="персон в древе"
          />
          <StatItem
            icon={<PhotoLibraryOutlinedIcon />}
            value={stats.gallery_photos_count}
            label="фото в галерее"
          />
        </Stack>
      )}
    </Paper>
  );
}
