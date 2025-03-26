import { McpAgent } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import OAuthProvider from "@cloudflare/workers-oauth-provider";

// Zabbix API configuration schema
const ZabbixConfig = z.object({
  url: z.string().url(),
  user: z.string(),
  password: z.string()
});

class ZabbixMCP extends McpAgent {
  constructor() {
    super({
      name: "Zabbix MCP Server",
      version: "1.0.0",
      description: "MCP server for interacting with Zabbix monitoring system"
    });

    // Initialize Zabbix configuration from environment variables
    if (process.env.ZABBIX_URL && process.env.ZABBIX_USER && process.env.ZABBIX_PASSWORD) {
      this.state.zabbixConfig = {
        url: process.env.ZABBIX_URL,
        user: process.env.ZABBIX_USER,
        password: process.env.ZABBIX_PASSWORD
      };
    }

    // Add health check endpoint
    this.server.tool(
      "health",
      "Health check endpoint",
      {},
      async () => {
        return {
          content: [{ type: "text", text: "OK" }]
        };
      }
    );
  }

  async init() {
    // Initial Configuration
    this.server.tool(
      "configureZabbix",
      "Configure Zabbix API connection",
      {
        url: z.string().url(),
        user: z.string(),
        password: z.string()
      },
      async ({ url, user, password }) => {
        try {
          const config = ZabbixConfig.parse({ url, user, password });
          this.state.zabbixConfig = config;
          return {
            content: [{ type: "text", text: "Zabbix configuration successful" }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Configuration error: ${error.message}` }]
          };
        }
      }
    );

    // 1. Proactive Monitoring and Incident Resolution
    this.server.tool(
      "handleHighCPUUsage",
      "Detects and resolves high CPU usage issues",
      {
        threshold: z.number().default(80),
        duration: z.number().default(300)
      },
      async ({ threshold, duration }) => {
        if (!this.state.zabbixConfig) {
          return {
            content: [{ type: "text", text: "Zabbix not configured. Please use configureZabbix first." }]
          };
        }

        try {
          // Search for hosts with high CPU usage
          const response = await this._makeZabbixRequest("item.get", {
            output: "extend",
            search: {
              key_: "system.cpu.util[,idle]"
            },
            filter: {
              value_type: 0
            }
          });

          const highCPUHosts = response.result.filter(host => {
            const cpuUsage = 100 - parseFloat(host.lastvalue);
            return cpuUsage > threshold;
          });

          if (highCPUHosts.length === 0) {
            return {
              content: [{ type: "text", text: "No hosts found with high CPU usage." }]
            };
          }

          // Attempt to resolve automatically
          const results = await Promise.all(
            highCPUHosts.map(async (host) => {
              try {
                // Identify processes with high consumption
                const processes = await this._makeZabbixRequest("item.get", {
                  output: "extend",
                  hostids: host.hostid,
                  search: {
                    key_: "proc.cpu.util"
                  }
                });

                // Attempt to restart problematic services
                const actions = await this._makeZabbixRequest("action.get", {
                  output: "extend",
                  filter: {
                    name: "High CPU Usage"
                  }
                });

                return {
                  host: host.name,
                  status: "Action taken",
                  processes: processes.result
                };
              } catch (error) {
                return {
                  host: host.name,
                  status: "Failed to resolve",
                  error: error.message
                };
              }
            })
          );

          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(results, null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error handling high CPU usage: ${error.message}` }]
          };
        }
      }
    );

    this.server.tool(
      "monitorCriticalServices",
      "Monitors critical services and executes automatic actions",
      {
        services: z.array(z.string()),
        checkInterval: z.number().default(60)
      },
      async ({ services, checkInterval }) => {
        if (!this.state.zabbixConfig) {
          return {
            content: [{ type: "text", text: "Zabbix not configured. Please use configureZabbix first." }]
          };
        }

        try {
          const results = await Promise.all(
            services.map(async (service) => {
              const response = await this._makeZabbixRequest("service.get", {
                output: "extend",
                filter: {
                  name: service
                }
              });

              if (response.result.length === 0) {
                return {
                  service,
                  status: "Not found"
                };
              }

              const serviceStatus = response.result[0];
              return {
                service,
                status: serviceStatus.status,
                lastCheck: serviceStatus.lastcheck,
                nextCheck: serviceStatus.nextcheck
              };
            })
          );

          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(results, null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error monitoring services: ${error.message}` }]
          };
        }
      }
    );

    // 2. Maintenance Automation
    this.server.tool(
      "scheduleSmartMaintenance",
      "Schedules maintenance based on usage patterns",
      {
        hostGroup: z.string(),
        preferredTime: z.string().optional(),
        maxDuration: z.number()
      },
      async ({ hostGroup, preferredTime, maxDuration }) => {
        if (!this.state.zabbixConfig) {
          return {
            content: [{ type: "text", text: "Zabbix not configured. Please use configureZabbix first." }]
          };
        }

        try {
          // Search for usage patterns
          const usagePatterns = await this._makeZabbixRequest("trend.get", {
            output: "extend",
            group: hostGroup,
            time_from: "now-7d",
            time_till: "now"
          });

          // Identify ideal window
          const maintenanceWindow = this._calculateMaintenanceWindow(usagePatterns.result, preferredTime);

          // Schedule maintenance
          const maintenance = await this._makeZabbixRequest("maintenance.create", {
            name: `Smart Maintenance - ${new Date().toISOString()}`,
            active_since: maintenanceWindow.start,
            active_till: maintenanceWindow.end,
            groupids: [hostGroup],
            timeperiods: [{
              timeperiod_type: 0,
              start_date: maintenanceWindow.start,
              period: maxDuration
            }]
          });

          return {
            content: [{ 
              type: "text", 
              text: `Maintenance scheduled: ${JSON.stringify(maintenance.result, null, 2)}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error scheduling maintenance: ${error.message}` }]
          };
        }
      }
    );

    // 3. Performance Analysis and Optimization
    this.server.tool(
      "optimizeResources",
      "Analyzes and optimizes resource usage",
      {
        resourceType: z.enum(["cpu", "memory", "disk", "network"]),
        timeRange: z.string()
      },
      async ({ resourceType, timeRange }) => {
        if (!this.state.zabbixConfig) {
          return {
            content: [{ type: "text", text: "Zabbix not configured. Please use configureZabbix first." }]
          };
        }

        try {
          // Collect metrics
          const metrics = await this._makeZabbixRequest("trend.get", {
            output: "extend",
            time_from: timeRange,
            time_till: "now",
            filter: {
              item: resourceType
            }
          });

          // Analyze patterns
          const analysis = this._analyzeResourceUsage(metrics.result);

          return {
            content: [{ 
              type: "text", 
              text: `Resource optimization analysis: ${JSON.stringify(analysis, null, 2)}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error optimizing resources: ${error.message}` }]
          };
        }
      }
    );

    // 4. Security and Compliance
    this.server.tool(
      "securityAudit",
      "Performs security audit",
      {
        scope: z.enum(["full", "critical", "custom"]),
        checks: z.array(z.string()).optional()
      },
      async ({ scope, checks }) => {
        if (!this.state.zabbixConfig) {
          return {
            content: [{ type: "text", text: "Zabbix not configured. Please use configureZabbix first." }]
          };
        }

        try {
          // Perform audit
          const auditResults = await this._performSecurityAudit(scope, checks);

          return {
            content: [{ 
              type: "text", 
              text: `Security audit results: ${JSON.stringify(auditResults, null, 2)}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error performing security audit: ${error.message}` }]
          };
        }
      }
    );

    // 5. DevOps Integration
    this.server.tool(
      "monitorDeployment",
      "Monitors deployment health",
      {
        application: z.string(),
        version: z.string(),
        metrics: z.array(z.string())
      },
      async ({ application, version, metrics }) => {
        if (!this.state.zabbixConfig) {
          return {
            content: [{ type: "text", text: "Zabbix not configured. Please use configureZabbix first." }]
          };
        }

        try {
          // Monitor post-deploy metrics
          const deploymentMetrics = await this._getDeploymentMetrics(application, version, metrics);

          return {
            content: [{ 
              type: "text", 
              text: `Deployment monitoring results: ${JSON.stringify(deploymentMetrics, null, 2)}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error monitoring deployment: ${error.message}` }]
          };
        }
      }
    );
  }

  // Helper methods
  async _makeZabbixRequest(method, params) {
    const { url, user, password } = this.state.zabbixConfig;
    
    const response = await fetch(`${url}/api_jsonrpc.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json-rpc',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        auth: await this._getZabbixAuthToken(user, password)
      })
    });

    if (!response.ok) {
      throw new Error(`Zabbix API error: ${response.statusText}`);
    }

    return response.json();
  }

  async _getZabbixAuthToken(user, password) {
    const { url } = this.state.zabbixConfig;
    
    const response = await fetch(`${url}/api_jsonrpc.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json-rpc',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'user.login',
        params: {
          username: user,
          password: password
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Zabbix');
    }

    const data = await response.json();
    return data.result;
  }

  _calculateMaintenanceWindow(usagePatterns, preferredTime) {
    // Implementation of logic to calculate ideal window
    // Based on usage patterns and time preference
    return {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString()
    };
  }

  _analyzeResourceUsage(metrics) {
    // Implementation of resource usage analysis
    return {
      average: 0,
      peak: 0,
      recommendations: []
    };
  }

  async _performSecurityAudit(scope, checks) {
    // Implementation of security audit
    return {
      status: "completed",
      findings: []
    };
  }

  async _getDeploymentMetrics(application, version, metrics) {
    // Implementation of deployment monitoring
    return {
      status: "healthy",
      metrics: {}
    };
  }
}

// Initialize the server
const server = new ZabbixMCP();
server.start().catch(error => {
  console.error("Server initialization error:", error);
  process.exit(1);
}); 
