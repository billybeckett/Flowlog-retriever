/**
 * Unified Data Service
 *
 * Provides a single interface that switches between mock data (sample)
 * and live AWS Athena data based on user selection.
 */

import type { DataSource } from '../components/DataSourceSelector';
import athenaService from './athenaService';
import mockDataService from './mockDataService';
import type {
  FlowLogFilter,
  TopTalker,
  TopIP,
  PortTraffic,
  ProtocolStats,
  TrafficTimeSeries,
  RejectedConnection,
  NetworkGraph,
} from '../types/flowlog';

class DataService {
  private currentSource: DataSource = 'sample'; // Default to sample data

  /**
   * Set the data source
   */
  setDataSource(source: DataSource): void {
    this.currentSource = source;
    console.log(`Data source switched to: ${source}`);
  }

  /**
   * Get current data source
   */
  getDataSource(): DataSource {
    return this.currentSource;
  }

  /**
   * Get the appropriate service based on current source
   */
  private getService() {
    return this.currentSource === 'sample' ? mockDataService : athenaService;
  }

  /**
   * Get top talkers (src -> dst pairs by bytes)
   */
  async getTopTalkers(filter: FlowLogFilter, limit = 100): Promise<TopTalker[]> {
    return this.getService().getTopTalkers(filter, limit);
  }

  /**
   * Get top source IPs
   */
  async getTopSourceIPs(filter: FlowLogFilter, limit = 50): Promise<TopIP[]> {
    return this.getService().getTopSourceIPs(filter, limit);
  }

  /**
   * Get top destination IPs
   */
  async getTopDestinationIPs(filter: FlowLogFilter, limit = 50): Promise<TopIP[]> {
    return this.getService().getTopDestinationIPs(filter, limit);
  }

  /**
   * Get protocol distribution
   */
  async getProtocolDistribution(filter: FlowLogFilter): Promise<ProtocolStats[]> {
    return this.getService().getProtocolDistribution(filter);
  }

  /**
   * Get traffic timeline (time series data)
   */
  async getTrafficTimeline(filter: FlowLogFilter): Promise<TrafficTimeSeries[]> {
    return this.getService().getTrafficTimeline(filter);
  }

  /**
   * Get top source ports
   */
  async getTopSourcePorts(filter: FlowLogFilter, limit = 50): Promise<PortTraffic[]> {
    return this.getService().getTopSourcePorts(filter, limit);
  }

  /**
   * Get top destination ports
   */
  async getTopDestinationPorts(filter: FlowLogFilter, limit = 50): Promise<PortTraffic[]> {
    return this.getService().getTopDestinationPorts(filter, limit);
  }

  /**
   * Get accept vs reject stats
   */
  async getAcceptRejectStats(
    filter: FlowLogFilter
  ): Promise<{ action: string; count: number; bytes: number }[]> {
    return this.getService().getAcceptRejectStats(filter);
  }

  /**
   * Get rejected connections
   */
  async getRejectedConnections(filter: FlowLogFilter, limit = 100): Promise<RejectedConnection[]> {
    return this.getService().getRejectedConnections(filter, limit);
  }

  /**
   * Get network graph data for flow diagram
   */
  async getNetworkGraph(filter: FlowLogFilter, minBytes = 100000): Promise<NetworkGraph> {
    return this.getService().getNetworkGraph(filter, minBytes);
  }
}

// Export singleton instance
export default new DataService();
