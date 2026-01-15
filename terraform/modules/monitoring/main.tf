resource "aws_prometheus_workspace" "main" {
  alias = "spotify-clone-${var.environment}"

  tags = {
    Environment = var.environment
  }
}

resource "aws_grafana_workspace" "main" {
  name = "spotify-clone-${var.environment}"
  account_access_type = "CURRENT_ACCOUNT"
  authentication_providers = ["AWS_SSO"]
  permission_type = "CUSTOMER_MANAGED"
  role_arn = aws_iam_role.grafana.arn
  data_sources = ["PROMETHEUS", "CLOUDWATCH"]

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_role" "grafana" {
  name = "grafana-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid = ""
        Principal = {
          Service = "grafana.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "grafana_cloudwatch" {
  role = aws_iam_role.grafana.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "grafana_prometheus" {
  role = aws_iam_role.grafana.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonPrometheusQueryAccess"
}