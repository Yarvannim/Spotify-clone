module "networking" {
  source = "./modules/networking"

  cluster_name = var.cluster_name
  environment = var.environment
  aws_region = var.aws_region
}

module "eks" {
  source = "./modules/eks"

  cluster_name = var.cluster_name
  environment = var.environment
  vpc_id = module.networking.vpc_id
  private_subnets = module.networking.private_subnet_ids
  public_subnets = module.networking.public_subnet_ids
  aws_region = var.aws_region
}

module "databases" {
  source = "./modules/databases"

  environment = var.environment
  aws_region = var.aws_region
  vpc_id = module.networking.vpc_id
  private_subnets = module.networking.private_subnet_ids
  eks_cluster_name = module.eks.cluster_name
}

# module "monitoring" {
#   source = "./modules/monitoring"
#
#   environment = var.environment
#   aws_region = var.aws_region
#   eks_cluster_name = module.eks.cluster_name
# }

resource "aws_secretsmanager_secret" "keyspace_credentials" {
  name = "${var.cluster_name}-keyspace-credentials"
}

resource "aws_secretsmanager_secret_version" "keyspace_credentials" {
  secret_id = aws_secretsmanager_secret.keyspace_credentials.id
  secret_string = jsonencode({
    contact_points = module.databases.keyspaces_contact_points
    username = module.databases.keyspaces_username
    password = module.databases.keyspaces_password
  })
}

resource "aws_secretsmanager_secret" "opensearch_credentials" {
  name = "${var.cluster_name}-opensearch-credentials"
}

resource "aws_secretsmanager_secret_version" "opensearch_credentials" {
  secret_id = aws_secretsmanager_secret.opensearch_credentials.id
  secret_string = jsonencode({
    endpoint = module.databases.opensearch_endpoint
    username = module.databases.opensearch_username
    password = module.databases.opensearch_password
  })
}