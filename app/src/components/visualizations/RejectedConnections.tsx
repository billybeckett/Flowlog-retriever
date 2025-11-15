import { useEffect, useState, useCallback } from 'react';
import type { FlowLogFilter } from '../../types/flowlog';
import dataService from '../../services/dataService';
import dnsService from '../../services/dnsService';
import { VisualizationWindow } from '../VisualizationWindow';
import { formatNumber } from '../../utils/formatters';
import '../visualizations/TopTalkers.css';

interface RejectedConnectionsProps {
  filter: FlowLogFilter;
  refreshKey: number;
}

const RejectedConnections: React.FC<RejectedConnectionsProps> = ({ filter, refreshKey }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await dataService.getRejectedConnections(filter, 50);

      // Perform DNS lookups
      const allIPs = [...new Set([...results.map((r) => r.srcaddr), ...results.map((r) => r.dstaddr)])];
      const dnsResults = await dnsService.batchLookup(allIPs);

      // Add DNS names
      const enrichedResults = results.map((r) => ({
        ...r,
        srcaddr_dns: dnsResults.get(r.srcaddr),
        dstaddr_dns: dnsResults.get(r.dstaddr),
      }));

      setData(enrichedResults);
    } catch (err) {
      console.error('Error loading rejected connections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filter, refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderContent = () => {
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

    if (data.length === 0) {
      return <div className="viz-empty">No rejected connections</div>;
    }

    return (
      <div className="top-talkers-table-wrapper">
        <table className="top-talkers-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Port</th>
              <th>Protocol</th>
              <th>Rejects</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <div className="ip-cell">
                    <div className="ip-addr">{row.srcaddr}</div>
                    {row.srcaddr_dns && <div className="ip-dns">{row.srcaddr_dns}</div>}
                  </div>
                </td>
                <td>
                  <div className="ip-cell">
                    <div className="ip-addr">{row.dstaddr}</div>
                    {row.dstaddr_dns && <div className="ip-dns">{row.dstaddr_dns}</div>}
                  </div>
                </td>
                <td>{row.port_name}</td>
                <td>{row.protocol_name}</td>
                <td>{formatNumber(row.reject_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <VisualizationWindow title="Rejected Connections">
      {renderContent()}
    </VisualizationWindow>
  );
};

export default RejectedConnections;
