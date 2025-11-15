// VPC Flow Log data types

export interface FlowLogRecord {
  version: number;
  account_id: string;
  interface_id: string;
  srcaddr: string;
  dstaddr: string;
  srcport: number;
  dstport: number;
  protocol: number;
  packets: number;
  bytes: number;
  start: number;
  end: number;
  action: 'ACCEPT' | 'REJECT';
  log_status: string;
  vpc_id?: string;
  subnet_id?: string;
  instance_id?: string;
  tcp_flags?: number;
  type?: string;
  pkt_srcaddr?: string;
  pkt_dstaddr?: string;
  region?: string;
  az_id?: string;
  sublocation_type?: string;
  sublocation_id?: string;
  pkt_src_aws_service?: string;
  pkt_dst_aws_service?: string;
  flow_direction?: string;
  traffic_path?: number;
  date?: string;
}

export interface FlowLogFilter {
  startDate?: Date;
  endDate?: Date;
  srcaddr?: string;
  dstaddr?: string;
  srcport?: number;
  dstport?: number;
  protocol?: number;
  action?: 'ACCEPT' | 'REJECT' | 'ALL';
  vpc_id?: string;
  instance_id?: string;
  minBytes?: number;
  maxBytes?: number;
}

export interface TopTalker {
  srcaddr: string;
  dstaddr: string;
  total_bytes: number;
  total_packets: number;
  connection_count: number;
  srcaddr_dns?: string;
  dstaddr_dns?: string;
}

export interface TopIP {
  ipaddr: string;
  total_bytes: number;
  total_packets: number;
  unique_connections: number;
  dns_name?: string;
}

export interface PortTraffic {
  port: number;
  port_name: string;
  total_bytes: number;
  connection_count: number;
  unique_sources: number;
}

export interface ProtocolStats {
  protocol: number;
  protocol_name: string;
  total_bytes: number;
  total_packets: number;
  flow_count: number;
}

export interface TrafficTimeSeries {
  timestamp: string;
  bytes: number;
  packets: number;
  connections: number;
}

export interface RejectedConnection {
  srcaddr: string;
  dstaddr: string;
  dstport: number;
  port_name: string;
  protocol: number;
  protocol_name: string;
  reject_count: number;
  srcaddr_dns?: string;
  dstaddr_dns?: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  dns_name?: string;
  total_bytes: number;
  connection_count: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  bytes: number;
  packets: number;
  connections: number;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export type VisualizationType =
  | 'network-flow-diagram'
  | 'top-source-ips'
  | 'top-destination-ips'
  | 'top-talkers'
  | 'protocol-distribution'
  | 'traffic-timeline'
  | 'top-source-ports'
  | 'top-destination-ports'
  | 'accept-reject'
  | 'rejected-connections'
  | 'traffic-by-application';

export interface VisualizationConfig {
  id: string;
  type: VisualizationType;
  title: string;
  description: string;
}
