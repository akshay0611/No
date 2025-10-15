import mongoose from 'mongoose';
import wsManager from '../websocket';
import whatsappService from '../whatsappService';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: ServiceHealth;
    websocket: ServiceHealth;
    whatsapp: ServiceHealth;
  };
  metrics: {
    uptime: number; // in seconds
    memoryUsage: {
      heapUsed: number; // in MB
      heapTotal: number; // in MB
      external: number; // in MB
      rss: number; // in MB
    };
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  responseTime?: number; // in milliseconds
  lastChecked: Date;
}

class HealthCheckService {
  /**
   * Check database connectivity
   */
  async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Check if mongoose is connected
      if (mongoose.connection.readyState !== 1) {
        return {
          status: 'down',
          message: 'Database connection is not established',
          lastChecked: new Date()
        };
      }

      // Perform a simple query to verify database is responsive
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      } else {
        throw new Error('Database connection not available');
      }
      
      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        message: 'Database is connected and responsive',
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Database check failed',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Check WebSocket server status
   */
  async checkWebSocket(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Check if WebSocket manager is initialized
      if (!wsManager) {
        return {
          status: 'down',
          message: 'WebSocket manager is not initialized',
          lastChecked: new Date()
        };
      }

      // Get connection count
      const connectionCount = wsManager.getConnectionCount();
      
      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        message: `WebSocket server is running with ${connectionCount} active connections`,
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'WebSocket check failed',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Check Twilio/WhatsApp API connectivity
   */
  async checkWhatsApp(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Check if WhatsApp service is configured
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

      if (!accountSid || !authToken || !whatsappNumber) {
        return {
          status: 'degraded',
          message: 'WhatsApp/Twilio credentials are not fully configured',
          lastChecked: new Date()
        };
      }

      // We can't easily test Twilio without making an actual API call
      // So we'll just verify the service is available
      if (!whatsappService) {
        return {
          status: 'down',
          message: 'WhatsApp service is not initialized',
          lastChecked: new Date()
        };
      }

      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        message: 'WhatsApp/Twilio service is configured and available',
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: error instanceof Error ? error.message : 'WhatsApp check failed',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Get memory usage metrics
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100 // MB
    };
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      // Check all services in parallel
      const [database, websocket, whatsapp] = await Promise.all([
        this.checkDatabase(),
        this.checkWebSocket(),
        this.checkWhatsApp()
      ]);

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (database.status === 'down' || websocket.status === 'down') {
        overallStatus = 'unhealthy';
      } else if (
        database.status === 'degraded' || 
        websocket.status === 'degraded' || 
        whatsapp.status === 'degraded' ||
        whatsapp.status === 'down'
      ) {
        overallStatus = 'degraded';
      }

      return {
        status: overallStatus,
        timestamp: new Date(),
        services: {
          database,
          websocket,
          whatsapp
        },
        metrics: {
          uptime: process.uptime(),
          memoryUsage: this.getMemoryUsage()
        }
      };
    } catch (error) {
      console.error('Error getting health status:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        services: {
          database: {
            status: 'down',
            message: 'Health check failed',
            lastChecked: new Date()
          },
          websocket: {
            status: 'down',
            message: 'Health check failed',
            lastChecked: new Date()
          },
          whatsapp: {
            status: 'down',
            message: 'Health check failed',
            lastChecked: new Date()
          }
        },
        metrics: {
          uptime: process.uptime(),
          memoryUsage: this.getMemoryUsage()
        }
      };
    }
  }

  /**
   * Get simple health check (for load balancers)
   */
  async getSimpleHealth(): Promise<{ status: 'ok' | 'error' }> {
    try {
      const health = await this.getHealthStatus();
      return {
        status: health.status === 'unhealthy' ? 'error' : 'ok'
      };
    } catch (error) {
      return { status: 'error' };
    }
  }
}

export default new HealthCheckService();
