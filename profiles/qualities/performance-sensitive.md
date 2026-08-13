---
id: qualities.performance-sensitive
kind: quality
---
# Performance-Sensitive Profile

## Guidance

- Define the user-visible latency or resource metric that actually matters before optimizing.
- Record a baseline and compare before/after measurements for performance-motivated changes.
- Prefer tail latency, idle footprint, bounded resource use, and measured bottlenecks over synthetic throughput when those better represent product experience.
- Do not add concurrency, caching, preloading, or specialized infrastructure without evidence that it improves the target metric enough to justify its cost.
