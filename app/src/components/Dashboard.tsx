import { useState } from 'react';
import type { FlowLogFilter } from '../types/flowlog';
import FilterComposer from './FilterComposer';
import { DataSourceSelector, type DataSource } from './DataSourceSelector';
import dataService from '../services/dataService';
import NetworkFlowDiagram from './visualizations/NetworkFlowDiagram';
import TopSourceIPs from './visualizations/TopSourceIPs';
import TopDestinationIPs from './visualizations/TopDestinationIPs';
import TopTalkers from './visualizations/TopTalkers';
import ProtocolDistribution from './visualizations/ProtocolDistribution';
import TrafficTimeline from './visualizations/TrafficTimeline';
import TopSourcePorts from './visualizations/TopSourcePorts';
import TopDestinationPorts from './visualizations/TopDestinationPorts';
import AcceptReject from './visualizations/AcceptReject';
import RejectedConnections from './visualizations/RejectedConnections';
import TrafficByApplication from './visualizations/TrafficByApplication';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataSource>('sample');
  const [filter, setFilter] = useState<FlowLogFilter>({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    endDate: new Date(),
    action: 'ALL',
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const handleFilterChange = (newFilter: FlowLogFilter) => {
    setFilter(newFilter);
    setRefreshKey((prev) => prev + 1); // Trigger refresh of all visualizations
  };

  const handleDataSourceChange = (source: DataSource) => {
    setDataSource(source);
    dataService.setDataSource(source);
    setRefreshKey((prev) => prev + 1); // Trigger refresh with new data source
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-title">
          <h1>AWS VPC Flow Logs Dashboard</h1>
          <div className="dashboard-subtitle">
            Real-time network traffic analysis and visualization
          </div>
        </div>
        <DataSourceSelector dataSource={dataSource} onDataSourceChange={handleDataSourceChange} />
      </header>

      <div className="dashboard-grid">
        {/* Window 1: Filter Composer */}
        <div className="grid-item">
          <FilterComposer onFilterChange={handleFilterChange} initialFilter={filter} />
        </div>

        {/* Window 2: Network Flow Diagram */}
        <div className="grid-item">
          <NetworkFlowDiagram filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 3: Top Source IPs */}
        <div className="grid-item">
          <TopSourceIPs filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 4: Top Destination IPs */}
        <div className="grid-item">
          <TopDestinationIPs filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 5: Top Talkers */}
        <div className="grid-item">
          <TopTalkers filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 6: Protocol Distribution */}
        <div className="grid-item">
          <ProtocolDistribution filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 7: Traffic Timeline */}
        <div className="grid-item">
          <TrafficTimeline filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 8: Top Source Ports */}
        <div className="grid-item">
          <TopSourcePorts filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 9: Top Destination Ports */}
        <div className="grid-item">
          <TopDestinationPorts filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 10: Accept vs Reject */}
        <div className="grid-item">
          <AcceptReject filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 11: Rejected Connections */}
        <div className="grid-item">
          <RejectedConnections filter={filter} refreshKey={refreshKey} />
        </div>

        {/* Window 12: Traffic by Application */}
        <div className="grid-item">
          <TrafficByApplication filter={filter} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
