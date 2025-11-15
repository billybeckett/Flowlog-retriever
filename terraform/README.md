# AWS Flow Logs Terraform Configuration

This Terraform configuration sets up all AWS infrastructure needed for the Flow Logs Visualization Dashboard.

## What This Creates

1. **S3 Buckets**:
   - Flow Logs storage bucket (with Parquet format)
   - Athena query results bucket
   - Lifecycle policies (90 days → Glacier, 365 days → Delete)

2. **VPC Flow Logs**:
   - Automatically enables Flow Logs on all VPCs in us-west-1
   - Parquet format with Hive-compatible partitioning
   - 60-second aggregation interval
   - Comprehensive log format with all available fields

3. **Athena**:
   - Database for Flow Logs
   - Workgroup with encryption
   - Saved queries for common analysis tasks
   - Partitioned table with date-based partitioning

## Prerequisites

1. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```

2. **Terraform** installed (v1.0+):
   ```bash
   brew install terraform  # macOS
   # or download from https://www.terraform.io/downloads
   ```

3. **AWS Permissions**: Your AWS credentials need the following permissions:
   - S3: Create buckets, manage lifecycle policies
   - VPC: Create and manage Flow Logs
   - Athena: Create databases, workgroups, named queries
   - IAM: Read permissions (to get account ID)

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. (Optional) Customize Variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your preferences
```

### 3. Preview Changes

```bash
terraform plan
```

This will show you what resources will be created without making any changes.

### 4. Deploy

```bash
terraform apply
```

Type `yes` when prompted to create the resources.

### 5. Get Configuration

After deployment, get the configuration for your app:

```bash
terraform output config_json
```

Save this output - you'll need it for the React application configuration.

### 6. Create the Athena Table

After deployment, you need to run the saved query to create the Flow Logs table:

```bash
# Get the query ID
aws athena list-named-queries --region us-west-1

# Or run via AWS Console:
# 1. Go to Athena Console
# 2. Select the "flowlog-retriever-workgroup" workgroup
# 3. Find and run the "create-flow-logs-table" saved query
```

Or use the AWS CLI:

```bash
QUERY_ID=$(aws athena list-named-queries \
  --region us-west-1 \
  --query 'NamedQueryIds[0]' \
  --output text)

aws athena start-query-execution \
  --region us-west-1 \
  --query-string "$(aws athena get-named-query --named-query-id $QUERY_ID --query 'NamedQuery.QueryString' --output text)" \
  --query-execution-context Database=vpc_flow_logs \
  --work-group flowlog-retriever-workgroup
```

## Outputs

After `terraform apply`, you'll see:

- `flow_logs_bucket_name`: S3 bucket where Flow Logs are stored
- `athena_database_name`: Athena database name
- `athena_workgroup_name`: Athena workgroup name
- `vpc_ids_with_flow_logs`: VPCs with Flow Logs enabled
- `config_json`: Complete configuration for the React app

## Cost Optimization

The configuration includes several cost-saving features:

1. **Parquet format**: 10x smaller than plain text, faster queries
2. **Lifecycle policies**: Auto-archive to Glacier after 90 days
3. **Query results cleanup**: Athena results auto-delete after 30 days
4. **Partition projection**: No need to run MSCK REPAIR TABLE

### Estimated Costs (for a typical small VPC)

- **S3 Storage**: ~$0.50-2/month (first 90 days)
- **S3 Glacier**: ~$0.10-0.50/month (after 90 days)
- **Athena Queries**: ~$0.01-0.10 per GB scanned
- **VPC Flow Logs**: ~$0.50/month per VPC

**Total**: ~$1-5/month for a small VPC

## Destroying Resources

To remove all resources:

```bash
terraform destroy
```

**Warning**: This will permanently delete:
- All Flow Logs data
- S3 buckets
- Athena database and queries
- Flow Log configurations

## Customization

### Change Region

Edit `terraform.tfvars`:
```hcl
aws_region = "us-east-1"
```

### Change Retention Period

Edit `terraform.tfvars`:
```hcl
flow_logs_retention_days = 30    # Archive to Glacier after 30 days
flow_logs_expiration_days = 180  # Delete after 180 days
```

### Disable Auto-Discovery of VPCs

If you want to manually specify VPCs instead of enabling on all:

1. Edit `terraform.tfvars`:
   ```hcl
   enable_flow_logs_on_all_vpcs = false
   ```

2. Modify `flow-logs.tf` to specify VPC IDs manually

## Saved Queries

The configuration includes pre-built Athena queries:

1. **top-talkers-by-bytes**: Largest conversations (src→dst)
2. **top-source-ips**: Most active source IPs
3. **top-destination-ips**: Most active destination IPs
4. **protocol-distribution**: TCP/UDP/ICMP breakdown
5. **rejected-connections**: Security group rejections
6. **traffic-by-port**: Port-level analysis

Access these in the Athena Console under "Saved queries".

## Troubleshooting

### No data in Athena

- **Wait 5-10 minutes** after creating Flow Logs for data to appear
- Check S3 bucket for files: `aws s3 ls s3://BUCKET-NAME/flow-logs/ --recursive`
- Ensure the Athena table was created (run the create-flow-logs-table query)

### Permission errors

- Verify AWS credentials: `aws sts get-caller-identity`
- Check IAM permissions for VPC, S3, and Athena

### High costs

- Reduce `log_aggregation_interval` to 600 seconds (10 minutes)
- Reduce retention periods
- Use more specific queries to scan less data

## Next Steps

1. Wait 5-10 minutes for Flow Logs to start publishing
2. Verify data in S3: `aws s3 ls s3://YOUR-BUCKET/flow-logs/ --recursive`
3. Run the create-flow-logs-table query in Athena
4. Test a query in Athena Console
5. Configure the React application with the output values
6. Start building visualizations!
