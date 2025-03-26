# Zabbix MCP Server

This is an MCP (Model Context Protocol) server that enables AI agents to interact with Zabbix through a secure and authenticated interface. The server provides a bridge between AI agents and the Zabbix monitoring system, enabling intelligent automation of monitoring, maintenance, and analysis tasks.

## Overview

The Zabbix MCP Server enables AI agents to:
- Proactively monitor and resolve issues
- Automate maintenance based on usage patterns
- Analyze and optimize resources
- Conduct security audits
- Monitor deployments and DevOps integrations

## Prerequisites

- Node.js 18 or higher
- Cloudflare account
- Zabbix instance with API enabled
- Zabbix API access with appropriate permissions

## Installation

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-username/zabbix-mcp.git
cd zabbix-mcp

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### 2. Cloudflare Setup

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Configure the project
wrangler config
```

### 3. Zabbix Setup

1. Enable the Zabbix API on your server
2. Create a dedicated API user with appropriate permissions
3. Configure credentials in the `.env` file:
```env
ZABBIX_URL=https://your-zabbix.com
ZABBIX_USER=api_user
ZABBIX_PASSWORD=api_password
```

## Deployment

### Local Development

```bash
# Start the server in development mode
npm run dev

# Server will be available at http://localhost:8787
```

### Production

```bash
# Deploy to Cloudflare
wrangler deploy
```

## Available Tools

### 1. Proactive Monitoring and Incident Resolution

#### handleHighCPUUsage
**Scope**: Automatic monitoring and resolution of high CPU usage issues
- Detects hosts with CPU usage above threshold
- Identifies problematic processes
- Executes automatic resolution actions
- Generates incident reports

**Parameters**:
```javascript
{
  "threshold": 80,    // CPU threshold percentage
  "duration": 300     // Monitoring duration in seconds
}
```

#### monitorCriticalServices
**Scope**: Continuous monitoring of critical services
- Monitors status of specific services
- Performs periodic checks
- Notifies on state changes
- Records availability history

**Parameters**:
```javascript
{
  "services": ["nginx", "mysql", "redis"],  // List of services
  "checkInterval": 60                       // Check interval in seconds
}
```

### 2. Maintenance Automation

#### scheduleSmartMaintenance
**Scope**: Intelligent maintenance scheduling
- Analyzes usage patterns
- Identifies ideal windows
- Schedules maintenance
- Notifies stakeholders

**Parameters**:
```javascript
{
  "hostGroup": "production-servers",        // Host group
  "preferredTime": "2024-03-26T02:00:00Z", // Preferred time
  "maxDuration": 3600                       // Maximum duration in seconds
}
```

### 3. Performance Analysis and Optimization

#### optimizeResources
**Scope**: Resource analysis and optimization
- Collects usage metrics
- Identifies bottlenecks
- Generates recommendations
- Monitors trends

**Parameters**:
```javascript
{
  "resourceType": "memory",     // Resource type
  "timeRange": "now-24h"       // Analysis period
}
```

### 4. Security and Compliance

#### securityAudit
**Scope**: Security and compliance auditing
- Verifies security configurations
- Analyzes access logs
- Identifies vulnerabilities
- Generates compliance reports

**Parameters**:
```javascript
{
  "scope": "critical",                    // Audit scope
  "checks": ["access_control", "firewall"] // Specific checks
}
```

### 5. DevOps Integration

#### monitorDeployment
**Scope**: Deployment and integration monitoring
- Monitors post-deploy health
- Analyzes performance metrics
- Detects regressions
- Generates deployment reports

**Parameters**:
```javascript
{
  "application": "web-app",                    // Application name
  "version": "1.2.3",                         // Deployment version
  "metrics": ["response_time", "error_rate"]   // Metrics to monitor
}
```

## Use Cases

### 1. Proactive Monitoring
```javascript
// Example of handleHighCPUUsage
{
  "threshold": 85,
  "duration": 600
}
```

### 2. Smart Maintenance
```javascript
// Example of scheduleSmartMaintenance
{
  "hostGroup": "production-servers",
  "preferredTime": "2024-03-26T02:00:00Z",
  "maxDuration": 3600
}
```

### 3. Resource Optimization
```javascript
// Example of optimizeResources
{
  "resourceType": "memory",
  "timeRange": "now-24h"
}
```

### 4. Security Audit
```javascript
// Example of securityAudit
{
  "scope": "critical",
  "checks": ["access_control", "firewall_rules"]
}
```

### 5. Deployment Monitoring
```javascript
// Example of monitorDeployment
{
  "application": "web-app",
  "version": "1.2.3",
  "metrics": ["response_time", "error_rate", "cpu_usage"]
}
```

## Security

- All credentials are securely stored in Cloudflare
- OAuth 2.1 authentication for tool access
- Limited scope access tokens
- Encrypted communication between client and server
- Audit logging of all operations

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify Zabbix credentials
   - Confirm API is enabled
   - Check user permissions

2. **Connection Error**
   - Verify Zabbix URL
   - Confirm server accessibility
   - Check firewall settings

3. **Permission Error**
   - Verify Zabbix user permissions
   - Confirm OAuth scopes
   - Check access policies

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support:
- Open an issue on GitHub
- Contact via email: support@example.com
- Check complete documentation at: docs.example.com

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 