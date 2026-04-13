import React, { useEffect, useRef, useState } from 'react';
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';
import './App.css';
import { fetchFamilyChart, FAMILY_CHART_URL } from './familyChartApi';

function App() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchFamilyChart>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFamilyChart()
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
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

  useEffect(() => {
    if (!data || !chartRef.current) {
      return;
    }
    const el = chartRef.current;
    el.innerHTML = '';
    const chart = f3.createChart(el, data);
    chart.setCardHtml().setCardDisplay([['first name', 'last name'], ['birthday']]);
    chart.updateTree({ initial: true });
    return () => {
      el.innerHTML = '';
    };
  }, [data]);

  return (
    <div className="App">
      <h1>Family Chart</h1>
      <p className="chart-source">
        Data: <code>{FAMILY_CHART_URL}</code>
      </p>
      {loading && <p className="chart-status">Loading…</p>}
      {error && (
        <p className="chart-status chart-error" role="alert">
          {error}
        </p>
      )}
      <div
        className="f3 chart-container"
        id="FamilyChart"
        ref={chartRef}
        data-testid="family-chart-root"
        aria-busy={loading}
      />
    </div>
  );
}

export default App;
