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
import {
  AddPersonFactForm,
  PersonFactsList,
} from '../components/PersonFactsWidgets';
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

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Семейное древо
        </Link>
        <Link
          component={RouterLink}
          to={`/person/${encodeURIComponent(id)}`}
          underline="hover"
          color="inherit"
        >
          {personDisplayName(person)}
        </Link>
        <Typography color="text.primary">Факты</Typography>
      </Breadcrumbs>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Факты: {personDisplayName(person)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Любой зарегистрированный пользователь может добавить факт. Факты сортируются от новых к старым.
        </Typography>

        <AddPersonFactForm personId={id} onAdded={reloadAll} />
        <PersonFactsList facts={facts} />
      </Paper>
    </Container>
  );
}
