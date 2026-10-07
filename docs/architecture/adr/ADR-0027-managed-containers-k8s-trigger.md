# ADR-0027 — Containers em plataforma gerenciada; Kubernetes por gatilho

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [23 §36](../23-infrastructure-and-deployment.md)

## Context
Precisamos de infraestrutura simples no início, sem impedir cells dedicadas e self-hosted (que exigem Kubernetes/Helm).

## Decision
- Imagens OCI 12-factor; **ECS Fargate/Cloud Run** + serviços gerenciados (Postgres, ClickHouse Cloud, Temporal Cloud, Valkey, S3, KMS) no SaaS inicial; OpenTofu/Terraform por cell; Compose para dev/avaliação.
- **Kubernetes + Helm** quando: primeira cell dedicada/self-hosted, > ~8–10 serviços com autoscaling heterogêneo, operar OSS stateful por custo, ou exigência de mesh/compliance.

## Alternatives
Kubernetes desde o início; Nomad; serverless; VMs.

## Advantages
Menor carga operacional inicial; migração para K8s é mudança de IaC.

## Disadvantages
Duas plataformas de execução durante a transição.

## Risks
Dependência acidental de APIs da plataforma gerenciada → revisão e teste do Compose no CI.

## Consequences
Health/readiness, graceful shutdown e config por env obrigatórios em todos os serviços.
