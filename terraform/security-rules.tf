resource "aws_security_group_rule" "eks_to_opensearch" {
  description              = "Allow EKS nodes to access OpenSearch"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = module.eks.node_security_group_id
  security_group_id        = module.databases.opensearch_security_group_id
}