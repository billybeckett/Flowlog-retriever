/**
 * Sample VPC Flow Logs Data
 *
 * This file contains realistic sample data for testing and demonstration
 * without requiring AWS infrastructure or incurring costs.
 */

import type { FlowLogRecord } from '../types/flowlog';

// Generate realistic sample data
const generateSampleData = (): FlowLogRecord[] => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Sample IPs representing different types of hosts
  const webServers = ['10.0.1.100', '10.0.1.101', '10.0.1.102'];
  const appServers = ['10.0.2.50', '10.0.2.51', '10.0.2.52'];
  const databases = ['10.0.3.10', '10.0.3.11'];
  const loadBalancers = ['10.0.0.10'];
  const external = ['8.8.8.8', '1.1.1.1', '52.94.236.248', '54.239.28.85', '203.0.113.5'];
  const clients = Array.from({ length: 20 }, (_, i) => `192.168.1.${i + 10}`);

  const allInternalIPs = [...webServers, ...appServers, ...databases, ...loadBalancers];

  const records: FlowLogRecord[] = [];

  // Helper function to generate a record
  const createRecord = (
    srcaddr: string,
    dstaddr: string,
    srcport: number,
    dstport: number,
    protocol: number,
    bytes: number,
    packets: number,
    action: 'ACCEPT' | 'REJECT',
    timestamp: number
  ): FlowLogRecord => ({
    version: 5,
    account_id: '123456789012',
    interface_id: `eni-${Math.random().toString(36).substring(7)}`,
    srcaddr,
    dstaddr,
    srcport,
    dstport,
    protocol,
    packets,
    bytes,
    start: Math.floor(timestamp / 1000),
    end: Math.floor((timestamp + 60000) / 1000),
    action,
    log_status: 'OK',
    vpc_id: 'vpc-sample123',
    subnet_id: `subnet-${Math.random().toString(36).substring(7)}`,
    instance_id: `i-${Math.random().toString(36).substring(7)}`,
    date: new Date(timestamp).toISOString().split('T')[0],
  });

  // Generate time series data (24 hours, every 5 minutes)
  for (let t = oneDayAgo; t < now; t += 5 * 60 * 1000) {

    // 1. Web traffic (HTTP/HTTPS) - high volume
    clients.slice(0, 10).forEach(client => {
      // HTTPS traffic to web servers
      webServers.forEach(webServer => {
        records.push(createRecord(
          client,
          webServer,
          Math.floor(Math.random() * 60000) + 1024,
          443,
          6, // TCP
          Math.floor(Math.random() * 500000) + 10000,
          Math.floor(Math.random() * 500) + 10,
          'ACCEPT',
          t
        ));
      });

      // HTTP traffic (less common)
      if (Math.random() > 0.7) {
        records.push(createRecord(
          client,
          webServers[0],
          Math.floor(Math.random() * 60000) + 1024,
          80,
          6,
          Math.floor(Math.random() * 300000) + 5000,
          Math.floor(Math.random() * 300) + 5,
          'ACCEPT',
          t
        ));
      }
    });

    // 2. Load balancer to web servers
    webServers.forEach(webServer => {
      records.push(createRecord(
        loadBalancers[0],
        webServer,
        Math.floor(Math.random() * 60000) + 1024,
        8080,
        6,
        Math.floor(Math.random() * 800000) + 50000,
        Math.floor(Math.random() * 800) + 50,
        'ACCEPT',
        t
      ));
    });

    // 3. Web servers to app servers
    webServers.forEach(webServer => {
      appServers.forEach(appServer => {
        if (Math.random() > 0.3) {
          records.push(createRecord(
            webServer,
            appServer,
            Math.floor(Math.random() * 60000) + 1024,
            3000, // Node.js app
            6,
            Math.floor(Math.random() * 200000) + 10000,
            Math.floor(Math.random() * 200) + 10,
            'ACCEPT',
            t
          ));
        }
      });
    });

    // 4. App servers to databases
    appServers.forEach(appServer => {
      databases.forEach(database => {
        // MySQL traffic
        records.push(createRecord(
          appServer,
          database,
          Math.floor(Math.random() * 60000) + 1024,
          3306,
          6,
          Math.floor(Math.random() * 150000) + 5000,
          Math.floor(Math.random() * 150) + 5,
          'ACCEPT',
          t
        ));

        // Redis traffic
        if (Math.random() > 0.5) {
          records.push(createRecord(
            appServer,
            database,
            Math.floor(Math.random() * 60000) + 1024,
            6379,
            6,
            Math.floor(Math.random() * 50000) + 1000,
            Math.floor(Math.random() * 50) + 1,
            'ACCEPT',
            t
          ));
        }
      });
    });

    // 5. DNS queries (UDP)
    if (Math.random() > 0.3) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      records.push(createRecord(
        randomClient,
        '8.8.8.8',
        Math.floor(Math.random() * 60000) + 1024,
        53,
        17, // UDP
        Math.floor(Math.random() * 500) + 100,
        Math.floor(Math.random() * 5) + 1,
        'ACCEPT',
        t
      ));
    }

    // 6. SSH connections (admin access)
    if (Math.random() > 0.9) {
      const adminIP = '192.168.1.5';
      const randomServer = allInternalIPs[Math.floor(Math.random() * allInternalIPs.length)];
      records.push(createRecord(
        adminIP,
        randomServer,
        Math.floor(Math.random() * 60000) + 1024,
        22,
        6,
        Math.floor(Math.random() * 10000) + 1000,
        Math.floor(Math.random() * 100) + 10,
        'ACCEPT',
        t
      ));
    }

    // 7. External API calls
    if (Math.random() > 0.6) {
      appServers.forEach(appServer => {
        records.push(createRecord(
          appServer,
          external[Math.floor(Math.random() * external.length)],
          Math.floor(Math.random() * 60000) + 1024,
          443,
          6,
          Math.floor(Math.random() * 100000) + 5000,
          Math.floor(Math.random() * 100) + 5,
          'ACCEPT',
          t
        ));
      });
    }

    // 8. ICMP (ping) traffic
    if (Math.random() > 0.7) {
      const src = allInternalIPs[Math.floor(Math.random() * allInternalIPs.length)];
      const dst = allInternalIPs[Math.floor(Math.random() * allInternalIPs.length)];
      if (src !== dst) {
        records.push(createRecord(
          src,
          dst,
          0,
          0,
          1, // ICMP
          Math.floor(Math.random() * 200) + 50,
          Math.floor(Math.random() * 5) + 1,
          'ACCEPT',
          t
        ));
      }
    }

    // 9. Rejected connections (security groups blocking)
    if (Math.random() > 0.8) {
      // Random external IP trying to access internal services
      const attacker = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const target = allInternalIPs[Math.floor(Math.random() * allInternalIPs.length)];
      const suspiciousPorts = [23, 21, 445, 3389, 1433, 5432];
      const port = suspiciousPorts[Math.floor(Math.random() * suspiciousPorts.length)];

      records.push(createRecord(
        attacker,
        target,
        Math.floor(Math.random() * 60000) + 1024,
        port,
        6,
        Math.floor(Math.random() * 100) + 10,
        Math.floor(Math.random() * 3) + 1,
        'REJECT',
        t
      ));
    }

    // 10. Port scanning attempts (multiple rejects)
    if (Math.random() > 0.95) {
      const scanner = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const target = webServers[0];

      for (let port = 20; port < 100; port += 10) {
        records.push(createRecord(
          scanner,
          target,
          Math.floor(Math.random() * 60000) + 1024,
          port,
          6,
          60,
          1,
          'REJECT',
          t
        ));
      }
    }
  }

  return records;
};

// Generate the sample data once
export const sampleFlowLogs = generateSampleData();

// Export count for reference
export const sampleDataInfo = {
  totalRecords: sampleFlowLogs.length,
  timeRange: '24 hours',
  uniqueSourceIPs: new Set(sampleFlowLogs.map(r => r.srcaddr)).size,
  uniqueDestIPs: new Set(sampleFlowLogs.map(r => r.dstaddr)).size,
  acceptedFlows: sampleFlowLogs.filter(r => r.action === 'ACCEPT').length,
  rejectedFlows: sampleFlowLogs.filter(r => r.action === 'REJECT').length,
};

console.log('Sample Flow Logs loaded:', sampleDataInfo);
