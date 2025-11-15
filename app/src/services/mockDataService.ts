/**
 * Mock Data Service
 *
 * Provides the same interface as AthenaService but uses sample data
 * instead of querying AWS. Perfect for demos, testing, and development.
 */

import { sampleFlowLogs } from '../data/sampleFlowLogs';
import type {
  FlowLogRecord,
  FlowLogFilter,
  TopTalker,
  TopIP,
  PortTraffic,
  ProtocolStats,
  TrafficTimeSeries,
  RejectedConnection,
  NetworkGraph,
} from '../types/flowlog';
import PortMappingService from './portMapping';

class MockDataService {
  /**
   * Simulate network delay (make it feel more realistic)
   */
  private async delay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Filter records based on filter criteria
   */
  private filterRecords(filter: FlowLogFilter): FlowLogRecord[] {
    let filtered = [...sampleFlowLogs];

    // Date range
    if (filter.startDate) {
      const startTime = Math.floor(filter.startDate.getTime() / 1000);
      filtered = filtered.filter((r) => r.start >= startTime);
    }
    if (filter.endDate) {
      const endTime = Math.floor(filter.endDate.getTime() / 1000);
      filtered = filtered.filter((r) => r.end <= endTime);
    }

    // IP addresses
    if (filter.srcaddr) {
      filtered = filtered.filter((r) => r.srcaddr === filter.srcaddr);
    }
    if (filter.dstaddr) {
      filtered = filtered.filter((r) => r.dstaddr === filter.dstaddr);
    }

    // Ports
    if (filter.srcport) {
      filtered = filtered.filter((r) => r.srcport === filter.srcport);
    }
    if (filter.dstport) {
      filtered = filtered.filter((r) => r.dstport === filter.dstport);
    }

    // Protocol
    if (filter.protocol) {
      filtered = filtered.filter((r) => r.protocol === filter.protocol);
    }

    // Action
    if (filter.action && filter.action !== 'ALL') {
      filtered = filtered.filter((r) => r.action === filter.action);
    }

    // VPC
    if (filter.vpc_id) {
      filtered = filtered.filter((r) => r.vpc_id === filter.vpc_id);
    }

    // Instance
    if (filter.instance_id) {
      filtered = filtered.filter((r) => r.instance_id === filter.instance_id);
    }

    // Bytes range
    if (filter.minBytes) {
      filtered = filtered.filter((r) => r.bytes >= filter.minBytes!);
    }
    if (filter.maxBytes) {
      filtered = filtered.filter((r) => r.bytes <= filter.maxBytes!);
    }

    return filtered;
  }

  /**
   * Get top talkers (src -> dst pairs by bytes)
   */
  async getTopTalkers(filter: FlowLogFilter, limit = 100): Promise<TopTalker[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter);
    const talkerMap = new Map<string, TopTalker>();

    filtered.forEach((record) => {
      const key = `${record.srcaddr}→${record.dstaddr}`;
      const existing = talkerMap.get(key) || {
        srcaddr: record.srcaddr,
        dstaddr: record.dstaddr,
        total_bytes: 0,
        total_packets: 0,
        connection_count: 0,
      };

      existing.total_bytes += record.bytes;
      existing.total_packets += record.packets;
      existing.connection_count += 1;
      talkerMap.set(key, existing);
    });

    return Array.from(talkerMap.values())
      .sort((a, b) => b.total_bytes - a.total_bytes)
      .slice(0, limit);
  }

  /**
   * Get top source IPs
   */
  async getTopSourceIPs(filter: FlowLogFilter, limit = 50): Promise<TopIP[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter);
    const ipMap = new Map<string, {
      ipaddr: string;
      total_bytes: number;
      total_packets: number;
      unique_connections: Set<string>;
    }>();

    filtered.forEach((record) => {
      const existing = ipMap.get(record.srcaddr) || {
        ipaddr: record.srcaddr,
        total_bytes: 0,
        total_packets: 0,
        unique_connections: new Set<string>(),
      };

      existing.total_bytes += record.bytes;
      existing.total_packets += record.packets;
      existing.unique_connections.add(record.dstaddr);
      ipMap.set(record.srcaddr, existing);
    });

    return Array.from(ipMap.values())
      .map((ip) => ({
        ipaddr: ip.ipaddr,
        total_bytes: ip.total_bytes,
        total_packets: ip.total_packets,
        unique_connections: ip.unique_connections.size,
      }))
      .sort((a, b) => b.total_bytes - a.total_bytes)
      .slice(0, limit);
  }

  /**
   * Get top destination IPs
   */
  async getTopDestinationIPs(filter: FlowLogFilter, limit = 50): Promise<TopIP[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter);
    const ipMap = new Map<string, {
      ipaddr: string;
      total_bytes: number;
      total_packets: number;
      unique_connections: Set<string>;
    }>();

    filtered.forEach((record) => {
      const existing = ipMap.get(record.dstaddr) || {
        ipaddr: record.dstaddr,
        total_bytes: 0,
        total_packets: 0,
        unique_connections: new Set<string>(),
      };

      existing.total_bytes += record.bytes;
      existing.total_packets += record.packets;
      existing.unique_connections.add(record.srcaddr);
      ipMap.set(record.dstaddr, existing);
    });

    return Array.from(ipMap.values())
      .map((ip) => ({
        ipaddr: ip.ipaddr,
        total_bytes: ip.total_bytes,
        total_packets: ip.total_packets,
        unique_connections: ip.unique_connections.size,
      }))
      .sort((a, b) => b.total_bytes - a.total_bytes)
      .slice(0, limit);
  }

  /**
   * Get protocol distribution
   */
  async getProtocolDistribution(filter: FlowLogFilter): Promise<ProtocolStats[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter);
    const protocolMap = new Map<number, ProtocolStats>();

    filtered.forEach((record) => {
      const existing = protocolMap.get(record.protocol) || {
        protocol: record.protocol,
        protocol_name: PortMappingService.getProtocolName(record.protocol),
        total_bytes: 0,
        total_packets: 0,
        flow_count: 0,
      };

      existing.total_bytes += record.bytes;
      existing.total_packets += record.packets;
      existing.flow_count += 1;
      protocolMap.set(record.protocol, existing);
    });

    return Array.from(protocolMap.values()).sort((a, b) => b.total_bytes - a.total_bytes);
  }

  /**
   * Get traffic timeline (time series data)
   */
  async getTrafficTimeline(filter: FlowLogFilter): Promise<TrafficTimeSeries[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter);
    const timeMap = new Map<string, TrafficTimeSeries>();

    filtered.forEach((record) => {
      // Round to nearest 5 minutes
      const timestamp = new Date(record.start * 1000);
      timestamp.setMinutes(Math.floor(timestamp.getMinutes() / 5) * 5, 0, 0);
      const key = timestamp.toISOString().slice(0, 16).replace('T', ' ');

      const existing = timeMap.get(key) || {
        timestamp: key,
        bytes: 0,
        packets: 0,
        connections: 0,
      };

      existing.bytes += record.bytes;
      existing.packets += record.packets;
      existing.connections += 1;
      timeMap.set(key, existing);
    });

    return Array.from(timeMap.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Get top source ports
   */
  async getTopSourcePorts(filter: FlowLogFilter, limit = 50): Promise<PortTraffic[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter).filter((r) => r.srcport > 0);
    const portMap = new Map<number, {
      port: number;
      port_name: string;
      total_bytes: number;
      connection_count: number;
      unique_sources: Set<string>;
    }>();

    filtered.forEach((record) => {
      const existing = portMap.get(record.srcport) || {
        port: record.srcport,
        port_name: PortMappingService.getServiceName(record.srcport),
        total_bytes: 0,
        connection_count: 0,
        unique_sources: new Set<string>(),
      };

      existing.total_bytes += record.bytes;
      existing.connection_count += 1;
      existing.unique_sources.add(record.dstaddr);
      portMap.set(record.srcport, existing);
    });

    return Array.from(portMap.values())
      .map((port) => ({
        port: port.port,
        port_name: port.port_name,
        total_bytes: port.total_bytes,
        connection_count: port.connection_count,
        unique_sources: port.unique_sources.size,
      }))
      .sort((a, b) => b.total_bytes - a.total_bytes)
      .slice(0, limit);
  }

  /**
   * Get top destination ports
   */
  async getTopDestinationPorts(filter: FlowLogFilter, limit = 50): Promise<PortTraffic[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter).filter((r) => r.dstport > 0);
    const portMap = new Map<number, {
      port: number;
      port_name: string;
      total_bytes: number;
      connection_count: number;
      unique_sources: Set<string>;
    }>();

    filtered.forEach((record) => {
      const existing = portMap.get(record.dstport) || {
        port: record.dstport,
        port_name: PortMappingService.getServiceName(record.dstport),
        total_bytes: 0,
        connection_count: 0,
        unique_sources: new Set<string>(),
      };

      existing.total_bytes += record.bytes;
      existing.connection_count += 1;
      existing.unique_sources.add(record.srcaddr);
      portMap.set(record.dstport, existing);
    });

    return Array.from(portMap.values())
      .map((port) => ({
        port: port.port,
        port_name: port.port_name,
        total_bytes: port.total_bytes,
        connection_count: port.connection_count,
        unique_sources: port.unique_sources.size,
      }))
      .sort((a, b) => b.total_bytes - a.total_bytes)
      .slice(0, limit);
  }

  /**
   * Get accept vs reject stats
   */
  async getAcceptRejectStats(
    filter: FlowLogFilter
  ): Promise<{ action: string; count: number; bytes: number }[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter);
    const actionMap = new Map<string, { action: string; count: number; bytes: number }>();

    filtered.forEach((record) => {
      const existing = actionMap.get(record.action) || {
        action: record.action,
        count: 0,
        bytes: 0,
      };

      existing.count += 1;
      existing.bytes += record.bytes;
      actionMap.set(record.action, existing);
    });

    return Array.from(actionMap.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Get rejected connections
   */
  async getRejectedConnections(filter: FlowLogFilter, limit = 100): Promise<RejectedConnection[]> {
    await this.delay(300);

    const filtered = this.filterRecords(filter).filter((r) => r.action === 'REJECT');
    const rejectMap = new Map<string, RejectedConnection>();

    filtered.forEach((record) => {
      const key = `${record.srcaddr}→${record.dstaddr}:${record.dstport}:${record.protocol}`;
      const existing = rejectMap.get(key) || {
        srcaddr: record.srcaddr,
        dstaddr: record.dstaddr,
        dstport: record.dstport,
        port_name: PortMappingService.getServiceName(record.dstport),
        protocol: record.protocol,
        protocol_name: PortMappingService.getProtocolName(record.protocol),
        reject_count: 0,
      };

      existing.reject_count += 1;
      rejectMap.set(key, existing);
    });

    return Array.from(rejectMap.values())
      .sort((a, b) => b.reject_count - a.reject_count)
      .slice(0, limit);
  }

  /**
   * Get network graph data for flow diagram
   */
  async getNetworkGraph(filter: FlowLogFilter, minBytes = 100000): Promise<NetworkGraph> {
    await this.delay(500);

    const filtered = this.filterRecords(filter);
    const edgeMap = new Map<string, { bytes: number; packets: number; connections: number }>();
    const nodeMap = new Map<string, { total_bytes: number; connection_count: number }>();

    filtered.forEach((record) => {
      const edgeKey = `${record.srcaddr}→${record.dstaddr}`;
      const edgeData = edgeMap.get(edgeKey) || { bytes: 0, packets: 0, connections: 0 };
      edgeData.bytes += record.bytes;
      edgeData.packets += record.packets;
      edgeData.connections += 1;
      edgeMap.set(edgeKey, edgeData);

      // Update node data
      for (const ip of [record.srcaddr, record.dstaddr]) {
        const nodeData = nodeMap.get(ip) || { total_bytes: 0, connection_count: 0 };
        nodeData.total_bytes += record.bytes;
        nodeData.connection_count += 1;
        nodeMap.set(ip, nodeData);
      }
    });

    // Filter edges by minimum bytes
    const edges = Array.from(edgeMap.entries())
      .filter(([_, data]) => data.bytes >= minBytes)
      .sort((a, b) => b[1].bytes - a[1].bytes)
      .slice(0, 200)
      .map(([key, data]) => {
        const [source, target] = key.split('→');
        return {
          source,
          target,
          bytes: data.bytes,
          packets: data.packets,
          connections: data.connections,
        };
      });

    // Get unique IPs from edges
    const uniqueIPs = new Set<string>();
    edges.forEach((edge) => {
      uniqueIPs.add(edge.source);
      uniqueIPs.add(edge.target);
    });

    // Create nodes
    const nodes = Array.from(uniqueIPs).map((ip) => {
      const nodeData = nodeMap.get(ip) || { total_bytes: 0, connection_count: 0 };
      return {
        id: ip,
        label: ip,
        ip,
        total_bytes: nodeData.total_bytes,
        connection_count: nodeData.connection_count,
      };
    });

    return { nodes, edges };
  }
}

export default new MockDataService();
