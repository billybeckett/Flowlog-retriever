// AWS Configuration
// After running terraform apply, update these values from the terraform outputs

export const awsConfig = {
  region: 'us-west-1',

  // Get these values from: terraform output config_json
  flowLogsBucket: 'flowlog-retriever-flow-logs-us-west-1-YOUR_ACCOUNT_ID',
  athenaDatabase: 'vpc_flow_logs',
  athenaTable: 'flow_logs',
  athenaWorkgroup: 'flowlog-retriever-workgroup',
  athenaResultsBucket: 'flowlog-retriever-athena-results-us-west-1-YOUR_ACCOUNT_ID',

  // AWS credentials will be loaded from:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // 2. AWS credentials file (~/.aws/credentials)
  // 3. IAM role (if running on EC2/ECS)

  // Query configuration
  maxResults: 1000,
  queryTimeout: 300000, // 5 minutes
  pollInterval: 1000, // 1 second
};

// Helper to update config from terraform output
export const updateConfigFromTerraform = (terraformConfig: {
  region: string;
  flowLogsBucket: string;
  athenaDatabase: string;
  athenaWorkgroup: string;
  athenaResultsBucket: string;
}) => {
  Object.assign(awsConfig, terraformConfig);
};
