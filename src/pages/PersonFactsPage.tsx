import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { fetchPerson, personDisplayName, type PersonDetail } from '../api/personApi';
import { fetchPersonFacts, type PersonFact } from '../api/personFactsApi';
import { AddPersonFactForm, PersonFactsList } from '../components/PersonFactsWidgets';
import { PersonProfileShell } from '../components/PersonProfileShell';
import { SessionLoading } from '../components/SessionLoading';

export function PersonFactsPage() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [facts, setFacts] = useState<PersonFact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadAll = useCallback(async () => {
    if (!id) {
      return;
    }
    const [p, list] = await Promise.all([fetchPerson(id), fetchPersonFacts(id)]);
    setPerson(p);
    setFacts(list);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError('Не указана персона');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchPerson(id), fetchPersonFacts(id)])
      .then(([p, list]) => {
        if (!cancelled) {
          setPerson(p);
          setFacts(list);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setPerson(null);
          setFacts([]);
          setError(e instanceof Error ? e.message : 'Ошибка загрузки');
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
  }, [id]);

  if (loading) {
    return <SessionLoading message="Загружаем факты…" />;
  }

  if (error || !person || !id) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error ?? 'Не найдено'}
        </Alert>
        <Button component={RouterLink} to="/" variant="contained">
          Назад к древу
        </Button>
      </Container>
    );
  }

  const breadcrumbs = (
    <Breadcrumbs sx={{ '& li': { typography: 'body2' } }}>
      <Link component={RouterLink} to="/" underline="hover" color="inherit">
        Семейное древо
      </Link>
      <Link component={RouterLink} to={`/person/${encodeURIComponent(id)}`} underline="hover" color="inherit">
        {personDisplayName(person)}
      </Link>
      <Typography color="text.primary">Факты</Typography>
    </Breadcrumbs>
  );

  return (
    <PersonProfileShell person={person} personId={id} activeTab="facts" breadcrumbs={breadcrumbs}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Typography variant="h6" component="h2" sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', fontWeight: 700 }}>
          Все факты
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pt: 2, pb: 0 }}>
          Любой зарегистрированный пользователь может добавить факт. Список отсортирован от новых к старым.
        </Typography>
        <Typography component="div" sx={{ p: 2 }}>
          <AddPersonFactForm personId={id} onAdded={reloadAll} />
          <PersonFactsList facts={facts} />
        </Typography>
      </Paper>
    </PersonProfileShell>
  );
}
