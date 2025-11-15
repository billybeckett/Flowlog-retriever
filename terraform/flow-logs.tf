# Data source to get all VPCs in the region
data "aws_vpcs" "all" {}

data "aws_vpc" "selected" {
  for_each = var.enable_flow_logs_on_all_vpcs ? toset(data.aws_vpcs.all.ids) : toset([])
  id       = each.value
}

# VPC Flow Logs for each VPC
resource "aws_flow_log" "vpc_flow_logs" {
  for_each = var.enable_flow_logs_on_all_vpcs ? data.aws_vpc.selected : {}

  log_destination      = "${aws_s3_bucket.flow_logs.arn}/flow-logs/"
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = each.value.id

  # Custom log format with all useful fields
  log_format = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status} $${vpc-id} $${subnet-id} $${instance-id} $${tcp-flags} $${type} $${pkt-srcaddr} $${pkt-dstaddr} $${region} $${az-id} $${sublocation-type} $${sublocation-id} $${pkt-src-aws-service} $${pkt-dst-aws-service} $${flow-direction} $${traffic-path}"

  # Aggregation interval (60 seconds for faster data, 600 for less cost)
  max_aggregation_interval = var.log_aggregation_interval

  # Destination options for Parquet format with Hive partitioning
  destination_options {
    file_format                = "parquet"
    hive_compatible_partitions = true
    per_hour_partition         = false
  }

  tags = merge(
    var.tags,
    {
      Name   = "Flow Logs - ${each.value.id}"
      VPC_ID = each.value.id
    }
  )

  depends_on = [
    aws_s3_bucket_policy.flow_logs
  ]
}
