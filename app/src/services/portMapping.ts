// IANA Well-Known Ports and Service Mapping
// https://www.iana.org/assignments/service-names-port-numbers/

const WELL_KNOWN_PORTS: Record<number, string> = {
  // Common services
  20: 'FTP-DATA',
  21: 'FTP',
  22: 'SSH',
  23: 'TELNET',
  25: 'SMTP',
  53: 'DNS',
  67: 'DHCP-SERVER',
  68: 'DHCP-CLIENT',
  69: 'TFTP',
  80: 'HTTP',
  110: 'POP3',
  123: 'NTP',
  135: 'MS-RPC',
  137: 'NETBIOS-NS',
  138: 'NETBIOS-DGM',
  139: 'NETBIOS-SSN',
  143: 'IMAP',
  161: 'SNMP',
  162: 'SNMP-TRAP',
  389: 'LDAP',
  443: 'HTTPS',
  445: 'SMB',
  465: 'SMTPS',
  514: 'SYSLOG',
  515: 'LPD',
  587: 'SMTP-SUBMISSION',
  636: 'LDAPS',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MS-SQL',
  1521: 'ORACLE',
  1723: 'PPTP',
  3306: 'MYSQL',
  3389: 'RDP',
  5432: 'POSTGRESQL',
  5900: 'VNC',
  5985: 'WINRM-HTTP',
  5986: 'WINRM-HTTPS',
  6379: 'REDIS',
  8080: 'HTTP-ALT',
  8443: 'HTTPS-ALT',
  9200: 'ELASTICSEARCH',
  9300: 'ELASTICSEARCH-TRANSPORT',
  27017: 'MONGODB',

  // AWS Services
  2049: 'NFS',
  2379: 'ETCD-CLIENT',
  2380: 'ETCD-PEER',
  4789: 'VXLAN',
  6443: 'KUBERNETES-API',
  8001: 'KUBERNETES-API-PROXY',
  9090: 'PROMETHEUS',
  9093: 'ALERTMANAGER',
  9094: 'ALERTMANAGER-CLUSTER',
  10250: 'KUBELET',
  10251: 'KUBE-SCHEDULER',
  10252: 'KUBE-CONTROLLER',
  10255: 'KUBELET-READONLY',

  // Container/Docker
  2375: 'DOCKER-REST',
  2376: 'DOCKER-REST-TLS',
  2377: 'DOCKER-SWARM',
  7946: 'DOCKER-SWARM-COMM',
  4789: 'DOCKER-OVERLAY',

  // Database
  1521: 'ORACLE',
  1830: 'ORACLE-ONS',
  3306: 'MYSQL',
  5432: 'POSTGRESQL',
  5984: 'COUCHDB',
  6379: 'REDIS',
  7000: 'CASSANDRA',
  7001: 'CASSANDRA-SSL',
  7199: 'CASSANDRA-JMX',
  8086: 'INFLUXDB',
  9042: 'CASSANDRA-CQL',
  9160: 'CASSANDRA-THRIFT',
  27017: 'MONGODB',
  27018: 'MONGODB-SHARD',
  27019: 'MONGODB-CONFIG',
  28017: 'MONGODB-WEB',

  // Message Queues
  4369: 'EPMD',
  5671: 'AMQP-TLS',
  5672: 'AMQP',
  6650: 'PULSAR',
  6651: 'PULSAR-TLS',
  9092: 'KAFKA',
  9093: 'KAFKA-SSL',
  15672: 'RABBITMQ-MGMT',
  25672: 'RABBITMQ-DIST',
  61613: 'STOMP',
  61614: 'STOMP-SSL',
  61616: 'ACTIVEMQ',

  // Web/Application
  3000: 'NODEJS-DEV',
  4200: 'ANGULAR-DEV',
  5000: 'FLASK-DEV',
  5001: 'SYNOLOGY-DSM',
  8000: 'HTTP-ALT',
  8008: 'HTTP-ALT',
  8080: 'HTTP-PROXY',
  8081: 'HTTP-ALT',
  8088: 'HTTP-ALT',
  8443: 'HTTPS-ALT',
  8888: 'HTTP-ALT',
  9000: 'SONARQUBE',

  // Monitoring/Logging
  2003: 'GRAPHITE',
  2004: 'GRAPHITE-PICKLE',
  3000: 'GRAFANA',
  4317: 'OTLP-GRPC',
  4318: 'OTLP-HTTP',
  5044: 'LOGSTASH',
  9090: 'PROMETHEUS',
  9091: 'PROMETHEUS-PUSHGATEWAY',
  9093: 'ALERTMANAGER',
  9100: 'NODE-EXPORTER',
  9187: 'POSTGRES-EXPORTER',
  24224: 'FLUENTD',

  // VPN/Security
  500: 'ISAKMP',
  1194: 'OPENVPN',
  1701: 'L2TP',
  1723: 'PPTP',
  4500: 'IPSEC-NAT-T',

  // Gaming (common ports)
  25565: 'MINECRAFT',
  27015: 'SOURCE-ENGINE',

  // Other
  111: 'PORTMAPPER',
  179: 'BGP',
  873: 'RSYNC',
  1080: 'SOCKS',
  3128: 'SQUID-PROXY',
  5353: 'MDNS',
  8200: 'VAULT',
  9418: 'GIT',
  11211: 'MEMCACHED',
  50000: 'SAP',
};

// Protocol number to name mapping
export const PROTOCOL_NAMES: Record<number, string> = {
  1: 'ICMP',
  6: 'TCP',
  17: 'UDP',
  41: 'IPv6',
  47: 'GRE',
  50: 'ESP',
  51: 'AH',
  58: 'ICMPv6',
  89: 'OSPF',
  132: 'SCTP',
};

export class PortMappingService {
  /**
   * Get the service name for a port number
   */
  static getServiceName(port: number): string {
    return WELL_KNOWN_PORTS[port] || 'UNKNOWN';
  }

  /**
   * Get formatted port display (e.g., "443 - HTTPS")
   */
  static getPortDisplay(port: number): string {
    const serviceName = this.getServiceName(port);
    if (serviceName === 'UNKNOWN') {
      return `${port}`;
    }
    return `${port} - ${serviceName}`;
  }

  /**
   * Get protocol name from protocol number
   */
  static getProtocolName(protocol: number): string {
    return PROTOCOL_NAMES[protocol] || `PROTOCOL-${protocol}`;
  }

  /**
   * Check if a port is well-known
   */
  static isWellKnownPort(port: number): boolean {
    return port in WELL_KNOWN_PORTS;
  }

  /**
   * Get all well-known ports
   */
  static getAllWellKnownPorts(): Record<number, string> {
    return { ...WELL_KNOWN_PORTS };
  }

  /**
   * Search for ports by service name
   */
  static searchByServiceName(query: string): Array<{ port: number; service: string }> {
    const lowerQuery = query.toLowerCase();
    return Object.entries(WELL_KNOWN_PORTS)
      .filter(([_, service]) => service.toLowerCase().includes(lowerQuery))
      .map(([port, service]) => ({
        port: parseInt(port),
        service,
      }))
      .sort((a, b) => a.port - b.port);
  }

  /**
   * Get application category for a port
   */
  static getPortCategory(port: number): string {
    if (port >= 1 && port <= 1023) return 'Well-Known';
    if (port >= 1024 && port <= 49151) return 'Registered';
    if (port >= 49152 && port <= 65535) return 'Dynamic/Private';
    return 'Unknown';
  }
}

export default PortMappingService;
