import React from 'react';
import { sampleDataInfo } from '../data/sampleFlowLogs';
import './DataSourceSelector.css';

export type DataSource = 'sample' | 'live';

interface DataSourceSelectorProps {
  dataSource: DataSource;
  onDataSourceChange: (source: DataSource) => void;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  dataSource,
  onDataSourceChange,
}) => {
  return (
    <div className="data-source-selector">
      <div className="data-source-header">
        <h3>Data Source</h3>
        <div className="data-source-badge">
          {dataSource === 'sample' ? '📊 Demo Mode' : '☁️ Live AWS'}
        </div>
      </div>

      <div className="data-source-options">
        <button
          className={`data-source-option ${dataSource === 'sample' ? 'active' : ''}`}
          onClick={() => onDataSourceChange('sample')}
        >
          <div className="option-icon">📊</div>
          <div className="option-content">
            <div className="option-title">Sample Data</div>
            <div className="option-description">
              Pre-loaded demo data
              <br />
              No AWS required
            </div>
          </div>
        </button>

        <button
          className={`data-source-option ${dataSource === 'live' ? 'active' : ''}`}
          onClick={() => onDataSourceChange('live')}
        >
          <div className="option-icon">☁️</div>
          <div className="option-content">
            <div className="option-title">Live AWS Data</div>
            <div className="option-description">
              Real VPC Flow Logs
              <br />
              Requires AWS setup
            </div>
          </div>
        </button>
      </div>

      {dataSource === 'sample' && (
        <div className="data-source-info">
          <div className="info-header">Sample Dataset Info</div>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Total Records</div>
              <div className="info-value">{sampleDataInfo.totalRecords.toLocaleString()}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Time Range</div>
              <div className="info-value">{sampleDataInfo.timeRange}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Unique Source IPs</div>
              <div className="info-value">{sampleDataInfo.uniqueSourceIPs}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Unique Dest IPs</div>
              <div className="info-value">{sampleDataInfo.uniqueDestIPs}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Accepted Flows</div>
              <div className="info-value success">{sampleDataInfo.acceptedFlows.toLocaleString()}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Rejected Flows</div>
              <div className="info-value error">{sampleDataInfo.rejectedFlows.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {dataSource === 'live' && (
        <div className="data-source-info">
          <div className="info-header">AWS Configuration</div>
          <div className="info-text">
            Querying live VPC Flow Logs from AWS Athena. Ensure your AWS credentials are configured
            and the Terraform infrastructure is deployed.
          </div>
          <div className="info-text warning">
            ⚠️ Live queries may incur AWS costs (Athena charges $5 per TB scanned).
          </div>
        </div>
      )}
    </div>
  );
};
