import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fetchPerson, type PersonDetail, type PersonSummary } from '../api/personApi';
import { SessionLoading } from '../components/SessionLoading';

function RelatedList({ title, people }: { title: string; people: PersonSummary[] }) {
  if (people.length === 0) {
    return null;
  }
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h2" component="h2" gutterBottom>
        {title}
      </Typography>
      <List dense disablePadding>
        {people.map((p) => (
          <ListItem key={p.id} disablePadding sx={{ py: 0.25 }}>
            <ListItemButton
              component={RouterLink}
              to={`/person/${encodeURIComponent(p.chart_external_id)}`}
            >
              <ListItemText primary={p.name} secondary={`id ${p.id}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack spacing={1} sx={{ flexDirection: { xs: 'column', sm: 'row' }, py: 0.75 }}>
      <Typography component="dt" variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography component="dd" variant="body1" sx={{ m: 0 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function PersonPage() {
  const { personId } = useParams<{ personId: string }>();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId) {
      setError('Missing person id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPerson(personId)
      .then((p) => {
        if (!cancelled) {
          setPerson(p);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setPerson(null);
          setError(e instanceof Error ? e.message : 'Failed to load person');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [personId]);

  if (loading) {
    return <SessionLoading message="Loading person…" />;
  }

  if (error || !person) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error ?? 'Not found'}
        </Alert>
        <Button component={RouterLink} to="/" variant="contained">
          Back to chart
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Family chart
        </Link>
        <Typography color="text.primary">{person.name}</Typography>
      </Breadcrumbs>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h1" component="h1" gutterBottom>
          {person.name}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Chart id:
          </Typography>
          <Chip size="small" label={person.chart_external_id} variant="outlined" />
          {person.chart_id && person.chart_id !== person.chart_external_id && (
            <>
              <Typography variant="body2" color="text.secondary">
                stored
              </Typography>
              <Chip size="small" label={person.chart_id} variant="outlined" />
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box component="dl" sx={{ m: 0 }}>
          <FactRow label="Gender" value={person.gender} />
          {person.date_of_birth && <FactRow label="Born" value={person.date_of_birth} />}
          {person.date_of_death && <FactRow label="Died" value={person.date_of_death} />}
          {person.location_of_birth && (
            <FactRow label="Birth place" value={person.location_of_birth} />
          )}
          {person.location_of_death && (
            <FactRow label="Death place" value={person.location_of_death} />
          )}
          {person.bio && <FactRow label="Bio" value={person.bio} />}
        </Box>

        <RelatedList title="Parents" people={person.parents} />
        <RelatedList title="Partners" people={person.partners} />
        <RelatedList title="Children" people={person.children} />
      </Paper>
    </Container>
  );
}
