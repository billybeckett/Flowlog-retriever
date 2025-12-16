import { useEffect, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { FlowLogFilter } from '../../types/flowlog';
import dataService from '../../services/dataService';
import PortMappingService from '../../services/portMapping';
import { VisualizationWindow } from '../VisualizationWindow';
import { formatBytes } from '../../utils/formatters';

interface TopDestinationPortsProps {
  filter: FlowLogFilter;
  refreshKey: number;
}

const TopDestinationPorts: React.FC<TopDestinationPortsProps> = ({ filter, refreshKey }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await dataService.getTopDestinationPorts(filter, 20);

      // Format labels with port names
      const labels = results.map((r) => PortMappingService.getPortDisplay(r.port));

      const bytes = results.map((r) => r.total_bytes);
      const hoverText = results.map((r) => `${formatBytes(r.total_bytes)}<br>${r.connection_count} connections`);

      setData({
        x: bytes,
        y: labels,
        type: 'bar',
        orientation: 'h',
        marker: {
          color: '#f59e0b',
          line: { color: '#d97706', width: 1 },
        },
        text: hoverText,
        hovertemplate: '%{y}<br>%{text}<extra></extra>',
      });
    } catch (err) {
      console.error('Error loading top destination ports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filter, refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderContent = (height: number = 400) => {
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
          margin: { l: 150, r: 40, t: 20, b: 50 },
          xaxis: {
            title: { text: 'Bytes Transferred' },
            gridcolor: '#333',
            tickformat: '.2s',
          },
          yaxis: {
            gridcolor: '#333',
            automargin: true,
          },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    );
  };

  return (
    <VisualizationWindow title="Top Destination Ports" fullscreenChildren={renderContent(700)}>
      {renderContent()}
    </VisualizationWindow>
  );
};

export default TopDestinationPorts;
