output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value = module.eks.cluster_name
}

output "vpc_id" {
  description = "VPC ID"
  value = module.networking.vpc_id
}

output "s3_bucket_name" {
  description = "S3 bucket for music files"
  value = module.databases.s3_bucket_name
}

output "opensearch_endpoint" {
  description = "Opensearch endpoint"
  value = module.databases.opensearch_endpoint
}

output "keyspaces_contact_points" {
  description = "AWS Keyspaces contact points"
  value = module.databases.keyspaces_contact_points
}

output "grafana_workspace_url" {
  description = "Amazon managed Grafana workspace URL"
  value = module.monitoring.grafana_workspace_url
}

output "prometheus_workspace_id" {
  description = "Amazon managed Prometheus workspace ID"
  value = module.monitoring.prometheus_workspace_id
}