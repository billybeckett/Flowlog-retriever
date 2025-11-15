output "flow_logs_bucket_name" {
  description = "Name of the S3 bucket storing VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "flow_logs_bucket_arn" {
  description = "ARN of the S3 bucket storing VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.arn
}

output "athena_results_bucket_name" {
  description = "Name of the S3 bucket storing Athena query results"
  value       = aws_s3_bucket.athena_results.id
}

output "athena_database_name" {
  description = "Name of the Athena database"
  value       = aws_athena_database.flow_logs.name
}

output "athena_workgroup_name" {
  description = "Name of the Athena workgroup"
  value       = aws_athena_workgroup.flow_logs.name
}

output "flow_log_ids" {
  description = "Map of VPC IDs to Flow Log IDs"
  value       = { for k, v in aws_flow_log.vpc_flow_logs : k => v.id }
}

output "vpc_ids_with_flow_logs" {
  description = "List of VPC IDs with Flow Logs enabled"
  value       = [for v in aws_flow_log.vpc_flow_logs : v.vpc_id]
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "config_json" {
  description = "Configuration JSON for the application"
  value = jsonencode({
    region              = var.aws_region
    flowLogsBucket      = aws_s3_bucket.flow_logs.id
    athenaDatabase      = aws_athena_database.flow_logs.name
    athenaWorkgroup     = aws_athena_workgroup.flow_logs.name
    athenaResultsBucket = aws_s3_bucket.athena_results.id
  })
}
