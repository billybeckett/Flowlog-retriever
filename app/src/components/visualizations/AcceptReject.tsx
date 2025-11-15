import { useEffect, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { FlowLogFilter } from '../../types/flowlog';
import dataService from '../../services/dataService';
import { VisualizationWindow } from '../VisualizationWindow';
import { formatBytes, formatNumber } from '../../utils/formatters';

interface AcceptRejectProps {
  filter: FlowLogFilter;
  refreshKey: number;
}

const AcceptReject: React.FC<AcceptRejectProps> = ({ filter, refreshKey }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await dataService.getAcceptRejectStats(filter);

      const labels = results.map((r) => r.action);
      const values = results.map((r) => r.count);
      const hoverText = results.map((r) => `${formatBytes(r.bytes)}<br>${formatNumber(r.count)} flows`);

      setData({
        labels,
        values,
        type: 'pie',
        hole: 0.4,
        marker: {
          colors: labels.map((l) => (l === 'ACCEPT' ? '#10b981' : '#ef4444')),
        },
        text: hoverText,
        hovertemplate: '%{label}<br>%{text}<extra></extra>',
        textinfo: 'label+percent',
        textposition: 'outside',
      });
    } catch (err) {
      console.error('Error loading accept/reject stats:', err);
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
          margin: { l: 50, r: 50, t: 30, b: 30 },
          showlegend: false,
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    );
  };

  return (
    <VisualizationWindow title="Accept vs Reject" fullscreenChildren={renderContent(600)}>
      {renderContent()}
    </VisualizationWindow>
  );
};

export default AcceptReject;
