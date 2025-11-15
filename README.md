# AWS Flow Logs Visualization Dashboard

A beautiful full-screen dashboard for visualizing AWS VPC Flow Logs with 12 customizable windows.

## Features

- **📊 Demo Mode with Sample Data**: Try the dashboard instantly without AWS setup!
- **12-Window Grid Layout**: Full-screen interface with customizable visualizations
- **Flow Log Filter Builder**: Top-left window provides intuitive filter composition
- **11 Default Visualizations**: Pre-configured views for common analysis tasks
- **DNS Lookups**: Automatic reverse DNS resolution for IP addresses
- **Top Talkers**: Identify most active hosts and applications
- **Interactive Charts**: Built with Plotly for zoom, pan, and detailed exploration
- **☁️ Live AWS Integration**: Connect to real VPC Flow Logs via Athena
- **Toggle Data Source**: Switch between sample and live data with one click

## Architecture

```
┌─────────────────────────────────────────┐
│           React Frontend                │
│  (12-window grid, Plotly charts)       │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      AWS Athena API (via SDK)          │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│   S3 Bucket (Parquet Flow Logs)        │
│   Partitioned by date                   │
└─────────────────────────────────────────┘
```

## Quick Start

### Option A: Try Sample Data (No AWS Required!) ⚡

**Start exploring immediately with realistic sample data:**

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173 - The dashboard starts in **📊 Demo Mode** by default!

**Includes:**
- ~5,000+ realistic flow log records
- 24 hours of simulated network traffic
- Web servers, databases, load balancers, external APIs
- Security events (rejected connections, port scans)
- No AWS credentials needed
- Zero costs

**Perfect for:**
- Testing the dashboard
- Learning VPC Flow Logs
- Demos and presentations
- Development

---

### Option B: Connect to Live AWS Data ☁️

#### 1. AWS Setup (First Time Only)

Deploy the infrastructure using Terraform:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This will:
- Create S3 buckets for Flow Logs and Athena results
- Enable VPC Flow Logs on all VPCs in us-west-1 (Parquet format)
- Configure Athena database, workgroup, and saved queries
- Set up lifecycle policies for cost optimization

#### 2. Install and Run

```bash
cd app
npm install
npm run dev
```

#### 3. Switch to Live Data

In the dashboard, click the **Data Source** selector and choose **☁️ Live AWS Data**

## AWS Setup Details

See [terraform/README.md](terraform/README.md) for detailed Terraform configuration and troubleshooting.

## Visualizations

The dashboard includes 11 default visualizations (customizable per window):

1. TBD - awaiting user specification
2. TBD
3. TBD
4. TBD
5. TBD
6. TBD
7. TBD
8. TBD
9. TBD
10. TBD
11. TBD

## Technology Stack

- **Frontend**: React
- **Charting**: Plotly.js
- **Backend**: AWS Athena
- **Storage**: S3 (Parquet format)
- **AWS SDK**: @aws-sdk/client-athena, @aws-sdk/client-s3
- **Infrastructure**: Terraform
