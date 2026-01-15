module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 21.10.0"

  name = var.cluster_name
  kubernetes_version = "1.34"
  vpc_id = var.vpc_id
  subnet_ids = var.private_subnets

  endpoint_public_access = true

  eks_managed_node_groups = {
    spotify_nodes = {
      min_size = 1
      max_size = 2
      desired_size = 1

      instance_types = ["t3.small"]
      capacity_type = "ON_DEMAND"

      iam_role_additional_policies = {
        AdministratorAccessTemp = "arn:aws:iam::aws:policy/AdministratorAccess"
        S3MusicBucketAccess = aws_iam_policy.s3_music_access.arn
        KeyspacesRestricted = aws_iam_policy.keyspaces_restricted.arn
        OpenSearchRestricted = aws_iam_policy.opensearch_restricted.arn
        SecretsManagerRead = aws_iam_policy.secrets_restricted.arn
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
      source_security_group_id = aws_security_group.alb_sg.id
    }

    # ingress_allow_access_from_control_plane = {
    #   type = "ingress"
    #   protocol = "tcp"
    #   from_port = 1025
    #   to_port = 65535
    #   source_cluster_security_group = true
    #   description = "Allow traffic from control plane to worker nodes"
    # }
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
          "${module.eks.oidc_provider}:aud" = "sts.amazonaws.com"
          "${module.eks.oidc_provider}:sub" = "system:serviceaccount:spotify-clone:stream-service-sa"
        }
      }
    }]
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

resource "aws_iam_policy" "s3_music_access" {
  name = "${var.cluster_name}-s3-music-access"
  description = "Restricted S3 access for music bucket only"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::spotify-clone-music-${var.environment}",
          "arn:aws:s3:::spotify-clone-music-${var.environment}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "keyspaces_restricted" {
  name = "${var.cluster_name}-keyspaces-restricted"
  description = "Restricted access for ${var.cluster_name} EKS cluster"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cassandra:Select"
        ]
        Resource = [
          "arn:aws:cassandra:${var.aws_region}:*:keyspace/spotify_clone_${var.environment}",
          "arn:aws:cassandra:${var.aws_region}:*:keyspace/spotify_clone_${var.environment}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "opensearch_restricted" {
  name = "${var.cluster_name}-opensearch-restricted"
  description = "Restricted OpenSearch access for ${var.cluster_name} EKS cluster"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpGet",
          "es:ESHttpPost",
          "es:ESHttpPut",
          "es:ESHttpDelete"
        ]
        Resource = [
          "arn:aws:es:${var.aws_region}:*:domain/spotify-clone-${var.environment}",
          "arn:aws:es:${var.aws_region}:*:domain/spotify-clone-${var.environment}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "secrets_restricted" {
  name = "${var.cluster_name}-secrets-restricted"
  description = "Restricted secrets manager access for ${var.cluster_name} EKS cluster"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.cluster_name}-keyspace-credentials-*",
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.cluster_name}-opensearch-credentials-*",
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:keyspaces-credentials-${var.environment}-*"
        ]
      }
    ]
  })
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

resource "aws_iam_role" "aws_load_balancer_controller" {
  name = "${var.cluster_name}-aws-load-balancer-controller"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = module.eks.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "${module.eks.oidc_provider}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
        }
      }
    }]
  })
}

resource "aws_iam_policy" "aws_load_balancer_controller" {
  name        = "${var.cluster_name}-aws-load-balancer-controller"
  description = "Policy for AWS Load Balancer Controller"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:CreateServiceLinkedRole",
          "ec2:DescribeAccountAttributes",
          "ec2:DescribeAddresses",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeInstances",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeTags",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeLoadBalancerAttributes",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeListenerCertificates",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetGroupAttributes",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:CreateTargetGroup",
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:DeleteTargetGroup",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:ModifyTargetGroup",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags",
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets",
          "elasticloadbalancing:SetWebAcl"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {
  role       = aws_iam_role.aws_load_balancer_controller.name
  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn
}
