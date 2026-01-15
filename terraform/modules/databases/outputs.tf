output "s3_bucket_name" {
  value = aws_s3_bucket.music.bucket
}

output "opensearch_endpoint" {
  value = aws_opensearch_domain.spotify.endpoint
}

output "opensearch_username" {
  value = "admin"
}

output "opensearch_password" {
  value = random_password.opensearch_password.result
}

output "keyspaces_contact_points" {
  value = "cassandra.${var.aws_region}.amazonaws.com"
}

output "keyspaces_username" {
  value = "spotify-app-${var.environment}"
}

output "keyspaces_password" {
  value = random_password.keyspaces_password.result
  sensitive = true
}

output "opensearch_security_group_id" {
  value = aws_security_group.opensearch.id
}