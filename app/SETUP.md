# AWS Flow Logs Dashboard - Setup Guide

Complete setup guide for the AWS VPC Flow Logs Visualization Dashboard.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or later) - [Download](https://nodejs.org/)
2. **AWS CLI** configured with credentials - [Setup Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
3. **Terraform** (v1.0+) - [Download](https://www.terraform.io/downloads)
4. **AWS Account** with permissions for:
   - VPC Flow Logs
   - S3
   - Athena
   - IAM (read-only for account ID)

## Step 1: Deploy AWS Infrastructure

### 1.1 Navigate to Terraform Directory

```bash
cd ../terraform
```

### 1.2 Initialize Terraform

```bash
terraform init
```

### 1.3 Review the Plan

```bash
terraform plan
```

This will show you all resources that will be created:
- 2 S3 buckets (Flow Logs storage + Athena results)
- VPC Flow Logs enabled on all VPCs in us-west-1
- Athena database and workgroup
- Lifecycle policies for cost optimization

### 1.4 Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. This will take 2-3 minutes.

### 1.5 Get Configuration Values

After deployment completes, run:

```bash
terraform output config_json
```

**Save this output!** You'll need it to configure the application.

Example output:
```json
{
  "region": "us-west-1",
  "flowLogsBucket": "flowlog-retriever-flow-logs-us-west-1-123456789012",
  "athenaDatabase": "vpc_flow_logs",
  "athenaWorkgroup": "flowlog-retriever-workgroup",
  "athenaResultsBucket": "flowlog-retriever-athena-results-us-west-1-123456789012"
}
```

## Step 2: Create Athena Table

The Flow Logs table needs to be created manually (one-time setup).

### Option A: Using AWS Console

1. Go to [Athena Console](https://console.aws.amazon.com/athena/)
2. Select the `flowlog-retriever-workgroup` workgroup
3. Find the "Saved queries" tab
4. Run the query named `create-flow-logs-table`

### Option B: Using AWS CLI

```bash
# Get the create table query
QUERY_ID=$(aws athena list-named-queries --region us-west-1 --query 'NamedQueryIds[0]' --output text)

# Execute the query
aws athena start-query-execution \
  --region us-west-1 \
  --query-string "$(aws athena get-named-query --named-query-id $QUERY_ID --query 'NamedQuery.QueryString' --output text)" \
  --query-execution-context Database=vpc_flow_logs \
  --work-group flowlog-retriever-workgroup
```

## Step 3: Configure the Application

### 3.1 Update AWS Configuration

Edit `src/config/aws.ts` and replace the placeholder values with your terraform output:

```typescript
export const awsConfig = {
  region: 'us-west-1',
  flowLogsBucket: 'YOUR_FLOW_LOGS_BUCKET_NAME',
  athenaDatabase: 'vpc_flow_logs',
  athenaTable: 'flow_logs',
  athenaWorkgroup: 'flowlog-retriever-workgroup',
  athenaResultsBucket: 'YOUR_ATHENA_RESULTS_BUCKET_NAME',

  maxResults: 1000,
  queryTimeout: 300000,
  pollInterval: 1000,
};
```

### 3.2 Configure AWS Credentials

The application uses AWS SDK which will automatically look for credentials in this order:

1. **Environment Variables** (recommended for development):
   ```bash
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   export AWS_REGION="us-west-1"
   ```

2. **AWS Credentials File** (`~/.aws/credentials`):
   ```ini
   [default]
   aws_access_key_id = your-access-key
   aws_secret_access_key = your-secret-key
   ```

3. **IAM Role** (if running on EC2/ECS)

## Step 4: Install Dependencies

```bash
npm install
```

This will install all required packages:
- React and TypeScript
- AWS SDK (Athena client)
- Plotly.js (for visualizations)
- ReactFlow (for network diagrams)

## Step 5: Run the Application

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Step 6: Wait for Flow Logs Data

**Important:** VPC Flow Logs take 5-10 minutes to start publishing data after being enabled.

1. Wait 5-10 minutes after running `terraform apply`
2. Verify logs are being written to S3:
   ```bash
   aws s3 ls s3://YOUR_FLOW_LOGS_BUCKET/flow-logs/ --recursive | head -20
   ```
3. Refresh the dashboard - data should now appear!

## Verification

### Test Athena Connectivity

Run a test query in Athena console:

```sql
SELECT COUNT(*) as total_flows
FROM vpc_flow_logs.flow_logs
WHERE date >= current_date - interval '1' day
LIMIT 10;
```

If this returns results, your setup is working correctly!

### Check Dashboard

1. Open the dashboard at `http://localhost:5173`
2. Verify the filter shows default values (last 24 hours)
3. Click "Apply Filter"
4. All 11 visualizations should start loading
5. Try the fullscreen expand button (⛶) on any visualization

## Troubleshooting

### No Data Appearing

**Problem:** Dashboard shows "No data available" in all windows

**Solutions:**
1. Wait 10-15 minutes for Flow Logs to start publishing
2. Verify Flow Logs are enabled:
   ```bash
   aws ec2 describe-flow-logs --region us-west-1
   ```
3. Check S3 bucket for files:
   ```bash
   aws s3 ls s3://YOUR_BUCKET/flow-logs/ --recursive
   ```
4. Verify Athena table was created:
   ```bash
   aws athena list-table-metadata --catalog-name AwsDataCatalog --database-name vpc_flow_logs --region us-west-1
   ```

### AWS Credentials Error

**Problem:** "Missing credentials" or "Access Denied"

**Solutions:**
1. Verify AWS CLI works:
   ```bash
   aws sts get-caller-identity
   ```
2. Check credentials file: `cat ~/.aws/credentials`
3. Ensure credentials have necessary permissions:
   - `athena:StartQueryExecution`
   - `athena:GetQueryExecution`
   - `athena:GetQueryResults`
   - `s3:GetObject` on both buckets
   - `s3:ListBucket` on both buckets

### Athena Query Timeout

**Problem:** Queries taking too long or timing out

**Solutions:**
1. Reduce date range in filter (try last 1 hour instead of 24 hours)
2. Increase timeout in `src/config/aws.ts`:
   ```typescript
   queryTimeout: 600000, // 10 minutes
   ```
3. Check if you have large amount of data - consider partitioning

### Application Won't Start

**Problem:** `npm run dev` fails

**Solutions:**
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Clear Vite cache:
   ```bash
   rm -rf .vite
   ```
3. Check Node.js version: `node --version` (should be 18+)

### DNS Lookups Not Working

**Note:** DNS lookups are currently mocked for development. To enable real DNS lookups:

1. Create a backend API endpoint at `/api/dns/lookup`
2. Implement reverse DNS lookup server-side
3. Update `src/services/dnsService.ts` to call your API

## Cost Management

### Estimated Monthly Costs (Small VPC)

- **S3 Storage**: $0.50-2/month (first 90 days)
- **S3 Glacier**: $0.10-0.50/month (after 90 days)
- **Athena Queries**: $0.01-0.10/GB scanned
- **VPC Flow Logs**: $0.50/month per VPC

**Total**: ~$1-5/month for a small VPC

### Cost Optimization Tips

1. **Reduce Retention:**
   Edit `terraform/terraform.tfvars`:
   ```hcl
   flow_logs_retention_days = 30    # Archive after 30 days
   flow_logs_expiration_days = 90   # Delete after 90 days
   ```

2. **Increase Aggregation Interval:**
   ```hcl
   log_aggregation_interval = 600  # 10 minutes instead of 1 minute
   ```

3. **Use Specific Queries:**
   Filter by VPC, date range, or IP to scan less data

4. **Clean Up:**
   When done testing:
   ```bash
   cd terraform
   terraform destroy
   ```

## Next Steps

### Customization

1. **Add More Visualizations:**
   - Create new components in `src/components/visualizations/`
   - Add to Dashboard grid in `src/components/Dashboard.tsx`

2. **Modify Time Ranges:**
   - Edit default filter in `Dashboard.tsx`
   - Add preset buttons (1h, 6h, 24h, 7d)

3. **Enable DNS Lookups:**
   - Set up backend API for reverse DNS
   - Update `dnsService.ts` configuration

4. **Add Export Features:**
   - CSV export for tables
   - Image export for charts
   - PDF report generation

### Production Deployment

For production use:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to:
   - **S3 + CloudFront**: Static hosting
   - **AWS Amplify**: Automatic deployments
   - **Docker**: Containerized deployment

3. Add authentication:
   - AWS Cognito
   - IAM roles for EC2/ECS
   - API Gateway with authorizers

4. Set up monitoring:
   - CloudWatch dashboards
   - Cost alerts
   - Query performance tracking

## Support

For issues and questions:

1. Check AWS CloudWatch Logs
2. Review Athena query execution history
3. Check browser console for JavaScript errors
4. Verify network traffic in browser DevTools

## Additional Resources

- [VPC Flow Logs Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)
- [Athena Documentation](https://docs.aws.amazon.com/athena/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [React Flow Documentation](https://reactflow.dev/)
- [Plotly.js Documentation](https://plotly.com/javascript/)
