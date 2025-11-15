# AWS Flow Logs Visualization Dashboard

A beautiful, full-screen dashboard for analyzing AWS VPC Flow Logs with 12 customizable visualization windows.

## Features

### 🎯 12-Window Grid Layout
- **Filter Composer** (top-left): Build complex queries with intuitive controls
- **11 Visualizations**: Real-time insights into your network traffic

### 📊 Visualizations

1. **Network Flow Diagram** - Interactive graph showing host-to-host traffic flows
2. **Top Source IPs** - Most active source IPs with DNS resolution
3. **Top Destination IPs** - Most contacted destinations with DNS names
4. **Top Talkers** - Largest conversations (source → destination pairs)
5. **Protocol Distribution** - TCP/UDP/ICMP breakdown (pie chart)
6. **Traffic Timeline** - Bytes transferred over time (line chart)
7. **Top Source Ports** - With well-known port names (e.g., "443 - HTTPS")
8. **Top Destination Ports** - Application-level traffic analysis
9. **Accept vs Reject** - Security group action distribution
10. **Rejected Connections** - Security analysis of blocked traffic
11. **Traffic by Application** - Port-to-application mapping

### ⛶ Fullscreen Mode
- Every visualization has a fullscreen expand button
- Exit with button or ESC key
- Perfect for detailed analysis and presentations

### 🔍 Advanced Features
- **Automatic DNS Lookups** - Resolve IPs to hostnames
- **Port Name Resolution** - 100+ well-known ports (SSH, HTTPS, MySQL, etc.)
- **Interactive Charts** - Zoom, pan, hover for details
- **Real-time Filtering** - Date range, IPs, ports, protocols, VPCs
- **Responsive Design** - Works on desktop, tablet, and mobile

## Quick Start

### 1. Deploy AWS Infrastructure

```bash
cd ../terraform
terraform init
terraform apply
terraform output config_json  # Save this!
```

### 2. Configure Application

Edit `src/config/aws.ts` with your terraform outputs.

### 3. Set AWS Credentials

```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Complete Setup Guide

See [SETUP.md](./SETUP.md) for detailed instructions, troubleshooting, and cost optimization.

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Visualizations**: Plotly.js + ReactFlow
- **Backend**: AWS Athena (serverless SQL queries)
- **Storage**: S3 (Parquet format with Hive partitioning)
- **Infrastructure**: Terraform

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## License

MIT License

---

Built with ❤️ using React, TypeScript, AWS, and Terraform
