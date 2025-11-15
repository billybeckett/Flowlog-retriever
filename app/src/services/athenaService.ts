import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  QueryExecutionState,
} from '@aws-sdk/client-athena';
import { awsConfig } from '../config/aws';
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
import PortMappingService from './portMapping';

export class AthenaService {
  private client: AthenaClient;

  constructor() {
    this.client = new AthenaClient({
      region: awsConfig.region,
      // Credentials will be auto-detected from environment
    });
  }

  /**
   * Execute an Athena query and wait for results
   */
  private async executeQuery(query: string): Promise<any[]> {
    // Start query execution
    const startCommand = new StartQueryExecutionCommand({
      QueryString: query,
      QueryExecutionContext: {
        Database: awsConfig.athenaDatabase,
      },
      WorkGroup: awsConfig.athenaWorkgroup,
      ResultConfiguration: {
        OutputLocation: `s3://${awsConfig.athenaResultsBucket}/query-results/`,
      },
    });

    const startResponse = await this.client.send(startCommand);
    const queryExecutionId = startResponse.QueryExecutionId!;

    // Poll for query completion
    let state: QueryExecutionState = 'QUEUED';
    const startTime = Date.now();

    while (
      state === 'QUEUED' ||
      state === 'RUNNING'
    ) {
      if (Date.now() - startTime > awsConfig.queryTimeout) {
        throw new Error('Query timeout exceeded');
      }

      await new Promise((resolve) => setTimeout(resolve, awsConfig.pollInterval));

      const getCommand = new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId });
      const getResponse = await this.client.send(getCommand);
      state = getResponse.QueryExecution?.Status?.State as QueryExecutionState;

      if (state === 'FAILED') {
        throw new Error(
          `Query failed: ${getResponse.QueryExecution?.Status?.StateChangeReason}`
        );
      }
      if (state === 'CANCELLED') {
        throw new Error('Query was cancelled');
      }
    }

    // Get query results
    const resultsCommand = new GetQueryResultsCommand({
      QueryExecutionId: queryExecutionId,
      MaxResults: awsConfig.maxResults,
    });

    const resultsResponse = await this.client.send(resultsCommand);
    const rows = resultsResponse.ResultSet?.Rows || [];

    if (rows.length === 0) {
      return [];
    }

    // Extract column names from first row
    const headers = rows[0].Data?.map((col) => col.VarCharValue || '') || [];

    // Parse data rows (skip header row)
    return rows.slice(1).map((row) => {
      const obj: any = {};
      row.Data?.forEach((col, index) => {
        const value = col.VarCharValue;
        const header = headers[index];

        // Try to parse as number
        if (value && !isNaN(Number(value))) {
          obj[header] = Number(value);
        } else {
          obj[header] = value || null;
        }
      });
      return obj;
    });
  }

  /**
   * Build WHERE clause from filter
   */
  private buildWhereClause(filter: FlowLogFilter): string {
    const conditions: string[] = [];

    // Date range (required)
    const startDate = filter.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // default: 24h ago
    const endDate = filter.endDate || new Date(); // default: now

    conditions.push(
      `date >= DATE '${startDate.toISOString().split('T')[0]}'`,
      `date <= DATE '${endDate.toISOString().split('T')[0]}'`
    );

    // IP addresses
    if (filter.srcaddr) {
      conditions.push(`srcaddr = '${filter.srcaddr}'`);
    }
    if (filter.dstaddr) {
      conditions.push(`dstaddr = '${filter.dstaddr}'`);
    }

    // Ports
    if (filter.srcport) {
      conditions.push(`srcport = ${filter.srcport}`);
    }
    if (filter.dstport) {
      conditions.push(`dstport = ${filter.dstport}`);
    }

    // Protocol
    if (filter.protocol) {
      conditions.push(`protocol = ${filter.protocol}`);
    }

    // Action
    if (filter.action && filter.action !== 'ALL') {
      conditions.push(`action = '${filter.action}'`);
    }

    // VPC
    if (filter.vpc_id) {
      conditions.push(`vpc_id = '${filter.vpc_id}'`);
    }

    // Instance
    if (filter.instance_id) {
      conditions.push(`instance_id = '${filter.instance_id}'`);
    }

    // Bytes range
    if (filter.minBytes) {
      conditions.push(`bytes >= ${filter.minBytes}`);
    }
    if (filter.maxBytes) {
      conditions.push(`bytes <= ${filter.maxBytes}`);
    }

    return conditions.join(' AND ');
  }

  /**
   * Get top talkers (src -> dst pairs by bytes)
   */
  async getTopTalkers(filter: FlowLogFilter, limit = 100): Promise<TopTalker[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        srcaddr,
        dstaddr,
        SUM(bytes) as total_bytes,
        SUM(packets) as total_packets,
        COUNT(*) as connection_count
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause}
      GROUP BY srcaddr, dstaddr
      ORDER BY total_bytes DESC
      LIMIT ${limit}
    `;

    return this.executeQuery(query);
  }

  /**
   * Get top source IPs
   */
  async getTopSourceIPs(filter: FlowLogFilter, limit = 50): Promise<TopIP[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        srcaddr as ipaddr,
        SUM(bytes) as total_bytes,
        SUM(packets) as total_packets,
        COUNT(DISTINCT dstaddr) as unique_connections
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause}
      GROUP BY srcaddr
      ORDER BY total_bytes DESC
      LIMIT ${limit}
    `;

    return this.executeQuery(query);
  }

  /**
   * Get top destination IPs
   */
  async getTopDestinationIPs(filter: FlowLogFilter, limit = 50): Promise<TopIP[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        dstaddr as ipaddr,
        SUM(bytes) as total_bytes,
        SUM(packets) as total_packets,
        COUNT(DISTINCT srcaddr) as unique_connections
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause}
      GROUP BY dstaddr
      ORDER BY total_bytes DESC
      LIMIT ${limit}
    `;

    return this.executeQuery(query);
  }

  /**
   * Get protocol distribution
   */
  async getProtocolDistribution(filter: FlowLogFilter): Promise<ProtocolStats[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        protocol,
        SUM(bytes) as total_bytes,
        SUM(packets) as total_packets,
        COUNT(*) as flow_count
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause}
      GROUP BY protocol
      ORDER BY total_bytes DESC
    `;

    const results = await this.executeQuery(query);

    return results.map((row) => ({
      ...row,
      protocol_name: PortMappingService.getProtocolName(row.protocol),
    }));
  }

  /**
   * Get traffic timeline (time series data)
   */
  async getTrafficTimeline(filter: FlowLogFilter): Promise<TrafficTimeSeries[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        DATE_FORMAT(FROM_UNIXTIME(start), '%Y-%m-%d %H:%i:00') as timestamp,
        SUM(bytes) as bytes,
        SUM(packets) as packets,
        COUNT(*) as connections
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause}
      GROUP BY DATE_FORMAT(FROM_UNIXTIME(start), '%Y-%m-%d %H:%i:00')
      ORDER BY timestamp ASC
    `;

    return this.executeQuery(query);
  }

  /**
   * Get top source ports
   */
  async getTopSourcePorts(filter: FlowLogFilter, limit = 50): Promise<PortTraffic[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        srcport as port,
        SUM(bytes) as total_bytes,
        COUNT(*) as connection_count,
        COUNT(DISTINCT dstaddr) as unique_sources
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause} AND srcport > 0
      GROUP BY srcport
      ORDER BY total_bytes DESC
      LIMIT ${limit}
    `;

    const results = await this.executeQuery(query);

    return results.map((row) => ({
      ...row,
      port_name: PortMappingService.getServiceName(row.port),
    }));
  }

  /**
   * Get top destination ports
   */
  async getTopDestinationPorts(filter: FlowLogFilter, limit = 50): Promise<PortTraffic[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        dstport as port,
        SUM(bytes) as total_bytes,
        COUNT(*) as connection_count,
        COUNT(DISTINCT srcaddr) as unique_sources
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause} AND dstport > 0
      GROUP BY dstport
      ORDER BY total_bytes DESC
      LIMIT ${limit}
    `;

    const results = await this.executeQuery(query);

    return results.map((row) => ({
      ...row,
      port_name: PortMappingService.getServiceName(row.port),
    }));
  }

  /**
   * Get accept vs reject stats
   */
  async getAcceptRejectStats(filter: FlowLogFilter): Promise<{ action: string; count: number; bytes: number }[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        action,
        COUNT(*) as count,
        SUM(bytes) as bytes
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause}
      GROUP BY action
      ORDER BY count DESC
    `;

    return this.executeQuery(query);
  }

  /**
   * Get rejected connections
   */
  async getRejectedConnections(filter: FlowLogFilter, limit = 100): Promise<RejectedConnection[]> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        srcaddr,
        dstaddr,
        dstport,
        protocol,
        COUNT(*) as reject_count
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause} AND action = 'REJECT'
      GROUP BY srcaddr, dstaddr, dstport, protocol
      ORDER BY reject_count DESC
      LIMIT ${limit}
    `;

    const results = await this.executeQuery(query);

    return results.map((row) => ({
      ...row,
      port_name: PortMappingService.getServiceName(row.dstport),
      protocol_name: PortMappingService.getProtocolName(row.protocol),
    }));
  }

  /**
   * Get network graph data for flow diagram
   */
  async getNetworkGraph(filter: FlowLogFilter, minBytes = 1000000): Promise<NetworkGraph> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      SELECT
        srcaddr,
        dstaddr,
        SUM(bytes) as bytes,
        SUM(packets) as packets,
        COUNT(*) as connections
      FROM ${awsConfig.athenaDatabase}.${awsConfig.athenaTable}
      WHERE ${whereClause}
      GROUP BY srcaddr, dstaddr
      HAVING SUM(bytes) >= ${minBytes}
      ORDER BY bytes DESC
      LIMIT 200
    `;

    const results = await this.executeQuery(query);

    // Build nodes and edges
    const nodeMap = new Map<string, { total_bytes: number; connection_count: number }>();

    results.forEach((row) => {
      // Add source node
      const srcData = nodeMap.get(row.srcaddr) || { total_bytes: 0, connection_count: 0 };
      srcData.total_bytes += row.bytes;
      srcData.connection_count += row.connections;
      nodeMap.set(row.srcaddr, srcData);

      // Add destination node
      const dstData = nodeMap.get(row.dstaddr) || { total_bytes: 0, connection_count: 0 };
      dstData.total_bytes += row.bytes;
      dstData.connection_count += row.connections;
      nodeMap.set(row.dstaddr, dstData);
    });

    const nodes = Array.from(nodeMap.entries()).map(([ip, data]) => ({
      id: ip,
      label: ip,
      ip,
      total_bytes: data.total_bytes,
      connection_count: data.connection_count,
    }));

    const edges = results.map((row) => ({
      source: row.srcaddr,
      target: row.dstaddr,
      bytes: row.bytes,
      packets: row.packets,
      connections: row.connections,
    }));

    return { nodes, edges };
  }
}

export default new AthenaService();
