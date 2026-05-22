import { Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import { alpha } from '@mui/material/styles';
import { resolveRailsBlobUrl } from '../api/assetUrls';
import { personDisplayName, type PersonBirthdayRow } from '../api/personApi';
import { ruDaysAfter, ruYears } from '../lib/ruPlural';

function birthdayDayLabel(daysOffset: number): string {
  if (daysOffset === -2) {
    return 'Позавчера';
  }
  if (daysOffset === -1) {
    return 'Вчера';
  }
  if (daysOffset === 0) {
    return 'Сегодня';
  }
  if (daysOffset === 1) {
    return 'Завтра';
  }
  if (daysOffset === 2) {
    return 'Послезавтра';
  }
  return `через ${ruDaysAfter(daysOffset)}`;
}

function ageLine(age: number, deceased: boolean, daysOffset: number): string {
  const years = ruYears(age);
  const past = daysOffset <= 0;
  if (deceased) {
    return past ? `исполнилось бы ${years}` : `могло бы исполниться ${years}`;
  }
  return past ? `исполнилось ${years}` : `исполнится ${years}`;
}

function groupByOffset(rows: PersonBirthdayRow[]): Map<number, PersonBirthdayRow[]> {
  const map = new Map<number, PersonBirthdayRow[]>();
  for (const row of rows) {
    const list = map.get(row.days_offset) ?? [];
    list.push(row);
    map.set(row.days_offset, list);
  }
  return map;
}

export function HomeBirthdaysBlock({ birthdays }: { birthdays: PersonBirthdayRow[] }) {
  if (birthdays.length === 0) {
    return null;
  }

  const grouped = groupByOffset(birthdays);
  const offsets = Array.from(grouped.keys()).sort((a, b) => a - b);

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        background: `linear-gradient(145deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 55%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
      })}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 2,
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          aria-hidden
          sx={(theme) => ({
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(theme.palette.warning.main, 0.18),
            color: 'warning.dark',
          })}
        >
          <CakeOutlinedIcon />
        </Box>
        <Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Дни рождения
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={0} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
        {offsets.map((offset) => {
          const people = grouped.get(offset) ?? [];
          return (
            <Box key={offset} sx={{ py: 1 }}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  px: 1,
                  mb: 0.75,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: offset === 0 ? 'warning.dark' : 'text.secondary',
                }}
              >
                {birthdayDayLabel(offset)}
              </Typography>
              <Stack spacing={0.75}>
                {people.map((p) => (
                  <Paper
                    key={`${p.id}-${offset}`}
                    component={RouterLink}
                    to={`/person/${encodeURIComponent(p.chart_external_id)}`}
                    elevation={0}
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'block',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                      '&:hover': {
                        boxShadow: 2,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar
                        src={resolveRailsBlobUrl(p.avatar_url)}
                        alt={personDisplayName(p)}
                        sx={{
                          width: 48,
                          height: 48,
                          border: 2,
                          borderColor: offset === 0 ? 'warning.light' : 'transparent',
                        }}
                      >
                        {p.first_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                          {personDisplayName(p)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={p.deceased ? 'text.secondary' : 'text.primary'}
                          sx={{ fontStyle: p.deceased ? 'italic' : 'normal' }}
                        >
                          {ageLine(p.age, p.deceased, offset)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
