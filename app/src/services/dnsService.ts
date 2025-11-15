/**
 * DNS Lookup Service
 *
 * Note: Browser JavaScript cannot perform DNS lookups directly due to security restrictions.
 * This service provides a structure for DNS lookups that should be implemented via:
 *
 * 1. Backend API (recommended for production)
 * 2. AWS Lambda function
 * 3. Third-party DNS API service
 *
 * For development, we'll use a cache-based approach with mock data.
 */

export interface DNSCacheEntry {
  ip: string;
  hostname: string | null;
  timestamp: number;
  ttl: number;
}

class DNSService {
  private cache: Map<string, DNSCacheEntry> = new Map();
  private readonly defaultTTL = 3600000; // 1 hour in milliseconds
  private readonly backendUrl = '/api/dns/lookup'; // Configure your backend API URL

  /**
   * Lookup hostname for an IP address
   * Returns cached result if available and not expired
   */
  async lookup(ip: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.hostname;
    }

    try {
      // Try backend API lookup
      const hostname = await this.performLookup(ip);

      // Cache the result
      this.cache.set(ip, {
        ip,
        hostname,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
      });

      return hostname;
    } catch (error) {
      console.error(`DNS lookup failed for ${ip}:`, error);

      // Cache negative result to avoid repeated failures
      this.cache.set(ip, {
        ip,
        hostname: null,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
      });

      return null;
    }
  }

  /**
   * Batch lookup multiple IPs
   */
  async batchLookup(ips: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    // Lookup all IPs in parallel
    const promises = ips.map(async (ip) => {
      const hostname = await this.lookup(ip);
      results.set(ip, hostname);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Perform actual DNS lookup
   * This method should be implemented based on your backend API
   */
  private async performLookup(ip: string): Promise<string | null> {
    // For development/demo: return known AWS service IPs or common patterns
    const knownHosts = this.getKnownHost(ip);
    if (knownHosts) {
      return knownHosts;
    }

    // In production, call your backend API:
    try {
      const response = await fetch(`${this.backendUrl}?ip=${encodeURIComponent(ip)}`);
      if (response.ok) {
        const data = await response.json();
        return data.hostname || null;
      }
    } catch (error) {
      // Backend not available, fall back to no resolution
    }

    return null;
  }

  /**
   * Get known hostnames for common IPs (for demo/development)
   * In production, this would be handled by the backend
   */
  private getKnownHost(ip: string): string | null {
    // AWS service endpoints (common patterns)
    if (ip.match(/^(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\./)) {
      return null; // Private IP, typically no public DNS
    }

    // Example known hosts (for demo purposes)
    const knownHosts: Record<string, string> = {
      '8.8.8.8': 'dns.google',
      '8.8.4.4': 'dns.google',
      '1.1.1.1': 'one.one.one.one',
      '1.0.0.1': 'one.one.one.one',
    };

    return knownHosts[ip] || null;
  }

  /**
   * Get display name for an IP (hostname if available, otherwise IP)
   */
  getDisplayName(ip: string, hostname: string | null | undefined): string {
    if (hostname) {
      return `${hostname} (${ip})`;
    }
    return ip;
  }

  /**
   * Clear DNS cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: DNSCacheEntry[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()),
    };
  }

  /**
   * Preload cache with known entries (useful for testing)
   */
  preloadCache(entries: Array<{ ip: string; hostname: string }>): void {
    entries.forEach(({ ip, hostname }) => {
      this.cache.set(ip, {
        ip,
        hostname,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
      });
    });
  }
}

export default new DNSService();
