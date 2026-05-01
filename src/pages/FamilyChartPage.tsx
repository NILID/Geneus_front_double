import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';
import { FamilyChartEditor } from '../components/FamilyChartEditor';
import { SessionLoading } from '../components/SessionLoading';
import { fetchFamilyChart, type FamilyChartData } from '../familyChartApi';

export function FamilyChartPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }
  const [treeData, setTreeData] = useState<FamilyChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartGeneration, setChartGeneration] = useState(0);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} — ${line}`, ...prev].slice(0, 40));
  }, []);

  const handlePersistedData = useCallback(
    (next: FamilyChartData) => {
      setTreeData(next);
      setChartGeneration((g) => g + 1);
      appendLog(`saveSuccess (${next.length} people synced from server)`);
    },
    [appendLog],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFamilyChart()
      .then((payload) => {
        if (!cancelled) {
          setTreeData(payload);
          setChartGeneration((g) => g + 1);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить данные древа');
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
  }, []);

  return (
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Stack spacing={2}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Stack
            spacing={2}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button component={RouterLink} to="/media" variant="text" size="small" color="inherit">
                Медиа
              </Button>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Stack>
            <Button variant="outlined" color="inherit" size="small" onClick={() => void handleLogout()}>
              Выйти
            </Button>
          </Stack>
          <Typography variant="h1" component="h1" align="center" gutterBottom>
            Семейное древо
          </Typography>

          {treeData && treeData.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {treeData.map((node) => {
                  const label =
                    [node.data?.['first name'], node.data?.['last name']]
                      .filter((x): x is string => typeof x === 'string' && x.trim() !== '')
                      .join(' ')
                      .trim() || node.id;
                  return (
                    <Chip
                      key={node.id}
                      component={RouterLink}
                      to={`/person/${encodeURIComponent(String(node.person_id ?? node.id))}`}
                      label={label}
                      clickable
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </Paper>

        {loading && <SessionLoading message="Загружаем древо…" />}
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}

        {treeData && (
          <FamilyChartEditor
            data={treeData}
            remountKey={chartGeneration}
            onDataChange={setTreeData}
            onPersistedData={handlePersistedData}
            onUpdate={(data) => appendLog(`onUpdate (${data.length} people)`)}
            onAdd={(data, ids) =>
              appendLog(`onAdd [${ids.join(', ')}] → ${data.length} people total`)
            }
            onRemove={(data, ids) =>
              appendLog(`onRemove [${ids.join(', ')}] → ${data.length} people total`)
            }
          />
        )}

        {eventLog.length > 0 && (
          <Paper elevation={1} sx={{ p: 2 }} aria-label="Edit event log">
            <Typography variant="h2" component="h2" gutterBottom>
              Recent interactions
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <List dense sx={{ py: 0, maxHeight: 320, overflow: 'auto' }}>
              {eventLog.map((line, i) => (
                <ListItem key={`${i}-${line}`} sx={{ py: 0.25, display: 'block' }}>
                  <Typography variant="caption" component="code" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {line}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
