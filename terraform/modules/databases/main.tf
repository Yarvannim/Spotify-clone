resource "aws_keyspaces_keyspace" "spotify" {
  name = "spotify_clone_${var.environment}"
}

resource "aws_secretsmanager_secret" "keyspaces_credentials" {
  name = "keyspaces-credentials-${var.environment}"
}

resource "random_password" "keyspaces_password" {
  length = 32
  special = true
}

resource "aws_secretsmanager_secret_version" "keyspaces_credentials" {
  secret_id = aws_secretsmanager_secret.keyspaces_credentials.id
  secret_string = jsonencode({
    username = "spotify-app-${var.environment}"
    password = random_password.keyspaces_password.result
  })
}

resource "aws_opensearch_domain" "spotify" {
  domain_name = "spotify-clone-${var.environment}"
  engine_version = "OpenSearch_3.1"

  cluster_config {
    instance_type = "t3.small.search"
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 0.1
  }

  node_to_node_encryption {
    enabled = true
  }

  encrypt_at_rest {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  advanced_security_options {
    enabled = true
    internal_user_database_enabled = true
    master_user_options {
      master_user_name = "admin"
      master_user_password = random_password.opensearch_password.result
    }
  }

  tags = {
    Domain = "spotify-clone-${var.environment}"
  }
}

resource "random_password" "opensearch_password" {
  length = 16
  special = true
}

resource "aws_s3_bucket" "music" {
  bucket = "spotify-clone-music-${var.environment}"
}

resource "aws_s3_bucket_versioning" "music" {
  bucket = aws_s3_bucket.music.id
  versioning_configuration {
    status = "Enabled"
  }
}