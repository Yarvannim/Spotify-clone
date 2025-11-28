module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 21.10.0"

  name = var.cluster_name
  kubernetes_version = "1.34"

  vpc_id = var.vpc_id
  subnet_ids = var.private_subnet_ids

  endpoint_public_access = true

  eks_managed_node_groups = {
    spotify_nodes = {
      min_size = 1
      max_size = 3
      desired_size = 2

      instance_types = ["t4g.micro"]
      capacity_type = "ON_DEMAND"

      iam_role_additional_policies = {
        AmazonS3FullAccess = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
        AmazonKeySpacesFullAccess = "arn:aws:iam::aws:policy/AmazonKeyspacesFullAccess"
        AmazonOpenSearchServiceFullAccess = "arn:aws:iam::aws:policy/AmazonOpenSearchServiceFullAccess"
        SecretsManagerRead = "arn:aws:iam::aws:policy/SecretsManagerRead"
      }
    }
  }

  node_security_group_additional_rules = {
    ingress_alb = {
      description = "Allow inbound from ALB"
      protocol = "tcp"
      from_port = 30000
      to_port = 32767
      type = "ingress"
      cidr_blocks = ["0.0.0.0/0"]
    }

    ingress_allow_access_from_control_plane = {
      type = "ingress"
      protocol = "tcp"
      from_port = 1025
      to_port = 65535
      source_cluster_security_group = true
      description = "Allow traffic from control plane to worker nodes"
    }
  }

  tags = {
    Environment = var.environment
    Project = "spotify-clone"
  }
}

resource "aws_iam_role" "stream_service_role" {
  name = "${var.cluster_name}-stream-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Sid = ""
      Principal = {
        Federated = module.eks.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "${module.eks.oidc_provider}:aud" : "sts.amazonaws.com"
          "${module.eks.oidc_provider}:sub" : "system:serviceaccount:spotify-clone:stream-service-sa"
        }
      }
    }
    ]
  })
  tags = {
    ServiceAccount = "stream-service-sa"
    Namespace = "spotify-clone"
  }
}

resource "aws_iam_role_policy_attachment" "stream_service_s3" {
  role = aws_iam_role.stream_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "stream_service_keyspaces" {
  role = aws_iam_role.stream_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonKeyspacesFullAccess"
}

resource "aws_iam_role_policy_attachment" "stream_service_opensearch" {
  role = aws_iam_role.stream_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonOpenSearchServiceFullAccess"
}

resource "aws_iam_role_policy_attachment" "stream_service_secrets_manager" {
  role = aws_iam_role.stream_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

# IAM role for frontend service account
resource "aws_iam_role" "frontend_service_role" {
  name = "${var.cluster_name}-frontend-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Condition = {
          StringEquals = {
            "${module.eks.oidc_provider}:sub" = "system:serviceaccount:spotify-clone:frontend-sa"
            "${module.eks.oidc_provider}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    ServiceAccount = "frontend-sa"
    Namespace      = "spotify-clone"
  }
}

# CloudWatch Logs policy for frontend
resource "aws_iam_role_policy_attachment" "frontend_cloudwatch" {
  role       = aws_iam_role.frontend_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

# IAM role for Keycloak service account
resource "aws_iam_role" "keycloak_service_role" {
  name = "${var.cluster_name}-keycloak-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Condition = {
          StringEquals = {
            "${module.eks.oidc_provider}:sub" = "system:serviceaccount:spotify-clone:keycloak-sa"
            "${module.eks.oidc_provider}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    ServiceAccount = "keycloak-sa"
    Namespace      = "spotify-clone"
  }
}

resource "aws_iam_role_policy_attachment" "keycloak_secrets_manager" {
  role       = aws_iam_role.keycloak_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

# Create a security group for the ALB
resource "aws_security_group" "alb_sg" {
  name_prefix = "${var.cluster_name}-alb"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-alb-sg"
  }
}
