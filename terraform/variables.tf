variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "flowlog-retriever"
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain flow logs before archiving to Glacier"
  type        = number
  default     = 90
}

variable "flow_logs_expiration_days" {
  description = "Number of days before flow logs are permanently deleted"
  type        = number
  default     = 365
}

variable "log_aggregation_interval" {
  description = "The aggregation interval for flow logs in seconds (60 or 600)"
  type        = number
  default     = 60
}

variable "enable_flow_logs_on_all_vpcs" {
  description = "Enable flow logs on all existing VPCs in the region"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "flowlog-retriever"
    ManagedBy = "Terraform"
  }
}
