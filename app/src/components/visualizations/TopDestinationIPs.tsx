import { useEffect, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { FlowLogFilter } from '../../types/flowlog';
import dataService from '../../services/dataService';
import dnsService from '../../services/dnsService';
import { VisualizationWindow } from '../VisualizationWindow';
import { formatBytes } from '../../utils/formatters';

interface TopDestinationIPsProps {
  filter: FlowLogFilter;
  refreshKey: number;
}

const TopDestinationIPs: React.FC<TopDestinationIPsProps> = ({ filter, refreshKey }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await dataService.getTopDestinationIPs(filter, 20);

      // Perform DNS lookups
      const ips = results.map((r) => r.ipaddr);
      const dnsResults = await dnsService.batchLookup(ips);

      // Prepare chart data
      const labels = results.map((r) => {
        const hostname = dnsResults.get(r.ipaddr);
        return hostname ? `${hostname}<br>(${r.ipaddr})` : r.ipaddr;
      });

      const bytes = results.map((r) => r.total_bytes);
      const hoverText = results.map(
        (r) => `${formatBytes(r.total_bytes)}<br>${r.unique_connections} connections`
      );

      setData({
        x: bytes,
        y: labels,
        type: 'bar',
        orientation: 'h',
        marker: {
          color: '#10b981',
          line: { color: '#059669', width: 1 },
        },
        text: hoverText,
        hovertemplate: '%{y}<br>%{text}<extra></extra>',
      });
    } catch (err) {
      console.error('Error loading top destination IPs:', err);
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
      return (
        <div className="viz-error">
          <div>Error: {error}</div>
        </div>
      );
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
          margin: { l: 200, r: 40, t: 20, b: 50 },
          xaxis: {
            title: 'Bytes Transferred',
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
    <VisualizationWindow title="Top Destination IPs" fullscreenChildren={renderContent(700)}>
      {renderContent()}
    </VisualizationWindow>
  );
};

export default TopDestinationIPs;
