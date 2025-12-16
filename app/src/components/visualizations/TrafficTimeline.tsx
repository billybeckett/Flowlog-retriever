import { useEffect, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { FlowLogFilter } from '../../types/flowlog';
import dataService from '../../services/dataService';
import { VisualizationWindow } from '../VisualizationWindow';
import { formatBytes } from '../../utils/formatters';

interface TrafficTimelineProps {
  filter: FlowLogFilter;
  refreshKey: number;
}

const TrafficTimeline: React.FC<TrafficTimelineProps> = ({ filter, refreshKey }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await dataService.getTrafficTimeline(filter);

      const timestamps = results.map((r) => r.timestamp);
      const bytes = results.map((r) => r.bytes);
      const hoverText = results.map((r) => `${formatBytes(r.bytes)}<br>${r.connections} connections`);

      setData({
        x: timestamps,
        y: bytes,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#3b82f6', width: 2 },
        marker: { color: '#3b82f6', size: 6 },
        fill: 'tozeroy',
        fillcolor: 'rgba(59, 130, 246, 0.2)',
        text: hoverText,
        hovertemplate: '%{x}<br>%{text}<extra></extra>',
      });
    } catch (err) {
      console.error('Error loading traffic timeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filter, refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderContent = (height: number = 350) => {
    if (loading) {
      return (
        <div className="viz-loading">
          <div className="loading-spinner"></div>
        </div>
      );
    }

    if (error) {
      return <div className="viz-error"><div>Error: {error}</div></div>;
    }

    if (!data) {
      return <div className="viz-empty">No data available</div>;
    }

    return (
      <Plot
        data={[data]}
        layout={{
          autosize: true,
          height,
          paper_bgcolor: '#1a1a1a',
          plot_bgcolor: '#1a1a1a',
          font: { color: '#e5e7eb', size: 11 },
          margin: { l: 80, r: 40, t: 30, b: 60 },
          xaxis: {
            title: { text: 'Time' },
            gridcolor: '#333',
          },
          yaxis: {
            title: { text: 'Bytes Transferred' },
            gridcolor: '#333',
            tickformat: '.2s',
          },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    );
  };

  return (
    <VisualizationWindow title="Traffic Over Time" fullscreenChildren={renderContent(600)}>
      {renderContent()}
    </VisualizationWindow>
  );
};

export default TrafficTimeline;
