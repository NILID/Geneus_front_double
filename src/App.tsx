import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { FamilyChartEditor } from './components/FamilyChartEditor';
import { fetchFamilyChart, FAMILY_CHART_URL, type FamilyChartData } from './familyChartApi';

function App() {
  const [treeData, setTreeData] = useState<FamilyChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  /** Bump after a successful load so the editor remounts with server data. */
  const [chartGeneration, setChartGeneration] = useState(0);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} — ${line}`, ...prev].slice(0, 40));
  }, []);

  const handlePersistedData = useCallback((next: FamilyChartData) => {
    setTreeData(next);
    setChartGeneration((g) => g + 1);
    appendLog(`saveSuccess (${next.length} people synced from server)`);
  }, [appendLog]);

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
          setError(e instanceof Error ? e.message : 'Failed to load family chart');
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
    <div className="App">
      <header className="app-header">
        <h1>Family Chart (editable)</h1>
        <p className="chart-source">
          Data: <code>{FAMILY_CHART_URL}</code>
        </p>
        <p className="chart-hint">
          Click a person to edit. Submitting the person form auto-saves to Rails with{' '}
          <code>nodes</code> and <code>removed_ids</code>.
        </p>
      </header>

      {loading && <p className="chart-status">Loading…</p>}
      {error && (
        <p className="chart-status chart-error" role="alert">
          {error}
        </p>
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
        <section className="event-log" aria-label="Edit event log">
          <h2>Recent interactions</h2>
          <ol>
            {eventLog.map((line, i) => (
              <li key={`${i}-${line}`}>
                <code>{line}</code>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export default App;
