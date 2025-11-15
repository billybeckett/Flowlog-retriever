# Athena workgroup for flow logs queries
resource "aws_athena_workgroup" "flow_logs" {
  name = "${var.project_name}-workgroup"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/query-results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }

    engine_version {
      selected_engine_version = "Athena engine version 3"
    }
  }

  tags = var.tags
}

# Athena database
resource "aws_athena_database" "flow_logs" {
  name   = "vpc_flow_logs"
  bucket = aws_s3_bucket.athena_results.bucket

  comment = "Database for VPC Flow Logs analysis"

  force_destroy = true
}

# Athena named query to create the Flow Logs table
resource "aws_athena_named_query" "create_flow_logs_table" {
  name      = "create-flow-logs-table"
  database  = aws_athena_database.flow_logs.name
  workgroup = aws_athena_workgroup.flow_logs.id
  query     = <<-EOT
    CREATE EXTERNAL TABLE IF NOT EXISTS ${aws_athena_database.flow_logs.name}.flow_logs (
      version int,
      account_id string,
      interface_id string,
      srcaddr string,
      dstaddr string,
      srcport int,
      dstport int,
      protocol bigint,
      packets bigint,
      bytes bigint,
      start bigint,
      end bigint,
      action string,
      log_status string,
      vpc_id string,
      subnet_id string,
      instance_id string,
      tcp_flags int,
      type string,
      pkt_srcaddr string,
      pkt_dstaddr string,
      region string,
      az_id string,
      sublocation_type string,
      sublocation_id string,
      pkt_src_aws_service string,
      pkt_dst_aws_service string,
      flow_direction string,
      traffic_path int
    )
    PARTITIONED BY (
      `date` date
    )
    STORED AS PARQUET
    LOCATION 's3://${aws_s3_bucket.flow_logs.bucket}/flow-logs/'
    TBLPROPERTIES (
      'projection.enabled' = 'true',
      'projection.date.type' = 'date',
      'projection.date.range' = '2024/01/01,NOW',
      'projection.date.format' = 'yyyy/MM/dd',
      'projection.date.interval' = '1',
      'projection.date.interval.unit' = 'DAYS',
      'storage.location.template' = 's3://${aws_s3_bucket.flow_logs.bucket}/flow-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/vpcflowlogs/${var.aws_region}/$${date}'
    );
  EOT
}

# Example queries for common Flow Log analysis

resource "aws_athena_named_query" "top_talkers_by_bytes" {
  name      = "top-talkers-by-bytes"
  database  = aws_athena_database.flow_logs.name
  workgroup = aws_athena_workgroup.flow_logs.id
  query     = <<-EOT
    SELECT
      srcaddr,
      dstaddr,
      SUM(bytes) as total_bytes,
      SUM(packets) as total_packets,
      COUNT(*) as connection_count
    FROM ${aws_athena_database.flow_logs.name}.flow_logs
    WHERE date >= current_date - interval '1' day
    GROUP BY srcaddr, dstaddr
    ORDER BY total_bytes DESC
    LIMIT 100;
  EOT
}

resource "aws_athena_named_query" "top_source_ips" {
  name      = "top-source-ips"
  database  = aws_athena_database.flow_logs.name
  workgroup = aws_athena_workgroup.flow_logs.id
  query     = <<-EOT
    SELECT
      srcaddr,
      SUM(bytes) as total_bytes,
      SUM(packets) as total_packets,
      COUNT(DISTINCT dstaddr) as unique_destinations
    FROM ${aws_athena_database.flow_logs.name}.flow_logs
    WHERE date >= current_date - interval '1' day
    GROUP BY srcaddr
    ORDER BY total_bytes DESC
    LIMIT 50;
  EOT
}

resource "aws_athena_named_query" "top_destination_ips" {
  name      = "top-destination-ips"
  database  = aws_athena_database.flow_logs.name
  workgroup = aws_athena_workgroup.flow_logs.id
  query     = <<-EOT
    SELECT
      dstaddr,
      SUM(bytes) as total_bytes,
      SUM(packets) as total_packets,
      COUNT(DISTINCT srcaddr) as unique_sources
    FROM ${aws_athena_database.flow_logs.name}.flow_logs
    WHERE date >= current_date - interval '1' day
    GROUP BY dstaddr
    ORDER BY total_bytes DESC
    LIMIT 50;
  EOT
}

resource "aws_athena_named_query" "protocol_distribution" {
  name      = "protocol-distribution"
  database  = aws_athena_database.flow_logs.name
  workgroup = aws_athena_workgroup.flow_logs.id
  query     = <<-EOT
    SELECT
      CASE protocol
        WHEN 6 THEN 'TCP'
        WHEN 17 THEN 'UDP'
        WHEN 1 THEN 'ICMP'
        ELSE CAST(protocol AS VARCHAR)
      END as protocol_name,
      protocol,
      SUM(bytes) as total_bytes,
      SUM(packets) as total_packets,
      COUNT(*) as flow_count
    FROM ${aws_athena_database.flow_logs.name}.flow_logs
    WHERE date >= current_date - interval '1' day
    GROUP BY protocol
    ORDER BY total_bytes DESC;
  EOT
}

resource "aws_athena_named_query" "rejected_connections" {
  name      = "rejected-connections"
  database  = aws_athena_database.flow_logs.name
  workgroup = aws_athena_workgroup.flow_logs.id
  query     = <<-EOT
    SELECT
      srcaddr,
      dstaddr,
      dstport,
      protocol,
      COUNT(*) as reject_count
    FROM ${aws_athena_database.flow_logs.name}.flow_logs
    WHERE date >= current_date - interval '1' day
      AND action = 'REJECT'
    GROUP BY srcaddr, dstaddr, dstport, protocol
    ORDER BY reject_count DESC
    LIMIT 100;
  EOT
}

resource "aws_athena_named_query" "traffic_by_port" {
  name      = "traffic-by-port"
  database  = aws_athena_database.flow_logs.name
  workgroup = aws_athena_workgroup.flow_logs.id
  query     = <<-EOT
    SELECT
      dstport,
      SUM(bytes) as total_bytes,
      COUNT(*) as connection_count,
      COUNT(DISTINCT srcaddr) as unique_sources
    FROM ${aws_athena_database.flow_logs.name}.flow_logs
    WHERE date >= current_date - interval '1' day
      AND dstport > 0
    GROUP BY dstport
    ORDER BY total_bytes DESC
    LIMIT 50;
  EOT
}
