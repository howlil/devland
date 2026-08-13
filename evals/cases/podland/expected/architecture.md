# Podland Architecture Expectations

The product remains a single Go control-plane application organized by product capability, with durable desired/workflow state in PostgreSQL and a web presentation layer that does not own deployment/security decisions. External execution systems sit behind small current-use boundaries. V1 implements only the provider/driver actually required by current scope; unused alternatives are not scaffolded.

Reconciliation is narrow, bounded, observable, and safe to repeat. One-host recovery is a primary architectural constraint.
