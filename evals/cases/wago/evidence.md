# Wago Evidence

Wago is a production-grade single-instance modular monolith for one self-hosted WhatsApp account per instance. The pinned engineering context records an Express/TypeScript backend, React frontend, SQLite durable state, Baileys protocol integration, filesystem authentication material, and one container runtime shape.

Transport, business policy, persistence, WhatsApp lifecycle, and application wiring have explicit ownership boundaries. Security rules prohibit sensitive message/session material in logs and treat the persistent data directory as secret-bearing state. Released migrations are append-only and multi-write invariants use transactions.

Wago's internal `.agent/` workspace uses change-oriented specs, plans, and verification checkpoints rather than requiring a global iteration model. Browser-session authentication is an example of a completed design/plan change that separated machine credentials from browser sessions.
