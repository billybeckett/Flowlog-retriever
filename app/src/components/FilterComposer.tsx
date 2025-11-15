import { useState } from 'react';
import type { FlowLogFilter } from '../types/flowlog';
import { VisualizationWindow } from './VisualizationWindow';
import './FilterComposer.css';

interface FilterComposerProps {
  onFilterChange: (filter: FlowLogFilter) => void;
  initialFilter: FlowLogFilter;
}

const FilterComposer: React.FC<FilterComposerProps> = ({ onFilterChange, initialFilter }) => {
  const [filter, setFilter] = useState<FlowLogFilter>(initialFilter);

  const handleChange = (key: keyof FlowLogFilter, value: any) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
  };

  const handleApply = () => {
    onFilterChange(filter);
  };

  const handleReset = () => {
    const resetFilter: FlowLogFilter = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(),
      action: 'ALL',
    };
    setFilter(resetFilter);
    onFilterChange(resetFilter);
  };

  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <VisualizationWindow title="Filter Composer">
      <div className="filter-composer">
        <div className="filter-section">
          <label className="filter-label">
            Start Date
            <input
              type="datetime-local"
              className="filter-input"
              value={formatDateForInput(filter.startDate)}
              onChange={(e) =>
                handleChange('startDate', e.target.value ? new Date(e.target.value) : undefined)
              }
            />
          </label>

          <label className="filter-label">
            End Date
            <input
              type="datetime-local"
              className="filter-input"
              value={formatDateForInput(filter.endDate)}
              onChange={(e) =>
                handleChange('endDate', e.target.value ? new Date(e.target.value) : undefined)
              }
            />
          </label>
        </div>

        <div className="filter-section">
          <label className="filter-label">
            Source IP
            <input
              type="text"
              className="filter-input"
              placeholder="e.g., 10.0.1.5"
              value={filter.srcaddr || ''}
              onChange={(e) => handleChange('srcaddr', e.target.value || undefined)}
            />
          </label>

          <label className="filter-label">
            Destination IP
            <input
              type="text"
              className="filter-input"
              placeholder="e.g., 10.0.2.10"
              value={filter.dstaddr || ''}
              onChange={(e) => handleChange('dstaddr', e.target.value || undefined)}
            />
          </label>
        </div>

        <div className="filter-section">
          <label className="filter-label">
            Source Port
            <input
              type="number"
              className="filter-input"
              placeholder="e.g., 443"
              value={filter.srcport || ''}
              onChange={(e) =>
                handleChange('srcport', e.target.value ? parseInt(e.target.value) : undefined)
              }
            />
          </label>

          <label className="filter-label">
            Destination Port
            <input
              type="number"
              className="filter-input"
              placeholder="e.g., 80"
              value={filter.dstport || ''}
              onChange={(e) =>
                handleChange('dstport', e.target.value ? parseInt(e.target.value) : undefined)
              }
            />
          </label>
        </div>

        <div className="filter-section">
          <label className="filter-label">
            Protocol
            <select
              className="filter-input"
              value={filter.protocol || ''}
              onChange={(e) =>
                handleChange('protocol', e.target.value ? parseInt(e.target.value) : undefined)
              }
            >
              <option value="">All Protocols</option>
              <option value="1">ICMP (1)</option>
              <option value="6">TCP (6)</option>
              <option value="17">UDP (17)</option>
            </select>
          </label>

          <label className="filter-label">
            Action
            <select
              className="filter-input"
              value={filter.action || 'ALL'}
              onChange={(e) => handleChange('action', e.target.value as any)}
            >
              <option value="ALL">All Actions</option>
              <option value="ACCEPT">Accept</option>
              <option value="REJECT">Reject</option>
            </select>
          </label>
        </div>

        <div className="filter-section">
          <label className="filter-label">
            VPC ID
            <input
              type="text"
              className="filter-input"
              placeholder="e.g., vpc-12345678"
              value={filter.vpc_id || ''}
              onChange={(e) => handleChange('vpc_id', e.target.value || undefined)}
            />
          </label>

          <label className="filter-label">
            Instance ID
            <input
              type="text"
              className="filter-input"
              placeholder="e.g., i-12345678"
              value={filter.instance_id || ''}
              onChange={(e) => handleChange('instance_id', e.target.value || undefined)}
            />
          </label>
        </div>

        <div className="filter-actions">
          <button className="filter-btn filter-btn-primary" onClick={handleApply}>
            Apply Filter
          </button>
          <button className="filter-btn filter-btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </VisualizationWindow>
  );
};

export default FilterComposer;
