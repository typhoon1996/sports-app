import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  memoryUsage: NodeJS.MemoryUsage;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 requests

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageResponseTime(endpoint?: string): number {
    const filteredMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const totalTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return totalTime / filteredMetrics.length;
  }

  getSlowestEndpoints(limit = 10) {
    const endpointTimes = new Map<string, number[]>();
    
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointTimes.has(key)) {
        endpointTimes.set(key, []);
      }
      endpointTimes.get(key)!.push(metric.responseTime);
    });

    const averages = Array.from(endpointTimes.entries()).map(([endpoint, times]) => ({
      endpoint,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      callCount: times.length
    }));

    return averages
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length;
    return (errorCount / this.metrics.length) * 100;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Override res.end to capture the response
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]) {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    const endMemory = process.memoryUsage();

    const metric: PerformanceMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date(),
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };

    performanceMonitor.addMetric(metric);

    // Log slow requests in development
    if (process.env.NODE_ENV === 'development' && responseTime > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${responseTime.toFixed(2)}ms`);
    }

    // Log errors
    if (res.statusCode >= 400) {
      console.error(`❌ Error response: ${req.method} ${req.path} - ${res.statusCode}`);
    }

    return originalEnd.apply(this, args);
  };

  next();
};

// Health check endpoint data
export const getHealthMetrics = () => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024 * 100) / 100} MB`
    },
    performance: {
      averageResponseTime: `${performanceMonitor.getAverageResponseTime().toFixed(2)}ms`,
      errorRate: `${performanceMonitor.getErrorRate().toFixed(2)}%`,
      totalRequests: performanceMonitor.getMetrics().length,
      slowestEndpoints: performanceMonitor.getSlowestEndpoints(5)
    }
  };
};
