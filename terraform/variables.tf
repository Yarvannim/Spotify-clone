variable "aws_region" {
  description = "AWS region"
  type = string
  default = "eu-central-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type = string
  default = "spotify-clone"
}

variable "environment" {
  description = "Environment name"
  type = string
  default = "dev"
}