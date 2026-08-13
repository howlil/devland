# Podland Evidence

Podland V1 is a self-hosted single-tenant deployment platform for one Linux VM. The product is a Go modular monolith with an embedded web frontend, PostgreSQL durable state, container build/runtime integration, routing, source-provider integration, and external ingress integration. Its scope explicitly rejects distributed-platform complexity that is not required for V1.

Current Iteration 2 is active and acts as an execution lock. It focuses on retained-secret encryption, the smallest current router boundary, external ingress for Podland's own canonical hostname, restart-safe reconciliation, and canonical-owner login. Repository source authorization, application deployment/runtime/build behavior, application domains, staging, and release remain blocked for later work.

Security, reliability, idempotency, restart recovery, bounded external operations, and one-host resource headroom are product constraints rather than optional maturity polish.
