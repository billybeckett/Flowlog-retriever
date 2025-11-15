/**
 * Utility functions for formatting data
 */

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Format timestamp to readable date
 */
export const formatTimestamp = (timestamp: string | number): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleString();
};

/**
 * Format duration in seconds to readable string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours}h ${minutes}m ${secs}s`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(2)}%`;
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
};

/**
 * Get color for traffic volume (green to red scale)
 */
export const getTrafficColor = (bytes: number, maxBytes: number): string => {
  const ratio = bytes / maxBytes;

  if (ratio < 0.33) return '#10b981'; // green
  if (ratio < 0.66) return '#f59e0b'; // yellow/orange
  return '#ef4444'; // red
};

/**
 * Get color for protocol
 */
export const getProtocolColor = (protocol: number): string => {
  const colors: Record<number, string> = {
    1: '#3b82f6', // ICMP - blue
    6: '#10b981', // TCP - green
    17: '#f59e0b', // UDP - orange
  };

  return colors[protocol] || '#6b7280'; // gray for unknown
};

/**
 * Get color for action
 */
export const getActionColor = (action: string): string => {
  return action === 'ACCEPT' ? '#10b981' : '#ef4444';
};
