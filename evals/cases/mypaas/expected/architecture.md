# MyPaas Architecture Expectations

MyPaas is represented as a self-hosted deployment platform with a Go control/backend boundary, web presentation layer, durable relational state, container execution/build integration, and managed routing/ingress concerns. Concrete library, router, query-generation, and provider choices remain project facts.

Agent-specific entry files must not become independent architecture sources; canonical project state should be projected into each supported runtime format.
