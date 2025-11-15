import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { FlowLogFilter } from '../../types/flowlog';
import dataService from '../../services/dataService';
import dnsService from '../../services/dnsService';
import { VisualizationWindow } from '../VisualizationWindow';
import { formatBytes } from '../../utils/formatters';
import './NetworkFlowDiagram.css';

interface NetworkFlowDiagramProps {
  filter: FlowLogFilter;
  refreshKey: number;
}

const NetworkFlowDiagram: React.FC<NetworkFlowDiagramProps> = ({ filter, refreshKey }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await dataService.getNetworkGraph(filter, 100000); // Min 100KB

      // Perform DNS lookups for all IPs
      const allIPs = [...data.nodes.map((n) => n.ip)];
      const dnsResults = await dnsService.batchLookup(allIPs);

      // Calculate layout positions in a force-directed style
      const nodePositions = calculateLayout(data.nodes.length);

      // Create nodes with DNS names
      const flowNodes: Node[] = data.nodes.map((node, index) => {
        const hostname = dnsResults.get(node.ip);
        const size = Math.min(Math.max(node.total_bytes / 10000000, 40), 150);

        return {
          id: node.id,
          type: 'default',
          position: nodePositions[index],
          data: {
            label: (
              <div className="node-label">
                <div className="node-ip">{node.ip}</div>
                {hostname && <div className="node-hostname">{hostname}</div>}
                <div className="node-stats">{formatBytes(node.total_bytes)}</div>
              </div>
            ),
          },
          style: {
            width: size,
            height: size,
            background: '#3b82f6',
            border: '2px solid #2563eb',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '10px',
            padding: '8px',
          },
        };
      });

      // Create edges with traffic volume
      const maxBytes = Math.max(...data.edges.map((e) => e.bytes));
      const flowEdges: Edge[] = data.edges.map((edge, index) => {
        const width = Math.min(Math.max((edge.bytes / maxBytes) * 10, 1), 10);

        return {
          id: `${edge.source}-${edge.target}-${index}`,
          source: edge.source,
          target: edge.target,
          animated: edge.bytes > maxBytes * 0.5,
          style: {
            stroke: '#8b5cf6',
            strokeWidth: width,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8b5cf6',
          },
          label: formatBytes(edge.bytes),
          labelStyle: {
            fill: '#fff',
            fontSize: 10,
          },
          labelBgStyle: {
            fill: '#1e1e1e',
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      console.error('Error loading network graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to load network graph');
    } finally {
      setLoading(false);
    }
  }, [filter, refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Simple circular layout
  const calculateLayout = (count: number): Array<{ x: number; y: number }> => {
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(250, 150 + count * 5);

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="viz-loading">
          <div className="loading-spinner"></div>
          <div>Loading network graph...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="viz-error">
          <div>Error loading data</div>
          <div style={{ fontSize: '0.85rem' }}>{error}</div>
        </div>
      );
    }

    if (nodes.length === 0) {
      return (
        <div className="viz-empty">
          No network traffic found for the selected filter
        </div>
      );
    }

    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#333" gap={16} />
        <Controls />
      </ReactFlow>
    );
  };

  return (
    <VisualizationWindow
      title="Network Flow Diagram"
      fullscreenChildren={
        <div style={{ width: '100%', height: '85vh' }}>{renderContent()}</div>
      }
    >
      <div style={{ width: '100%', height: '450px' }}>{renderContent()}</div>
    </VisualizationWindow>
  );
};

export default NetworkFlowDiagram;
