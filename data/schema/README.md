# RAG chunk contract (v1.0.0)

**Source of truth:** `rag-chunk.schema.json`

1. Authors fill a hierarchical text template that can emit objects matching this schema.
2. The indexer validates every chunk against the schema, embeds `body`, and stores metadata for filters/cards.
3. Only `status: "canonical"` chunks are indexed. `superseded` forks are kept for audit, not retrieval.

See `rag-chunk.examples.json` for employment job, nested artifact, and launched-product shapes.

**Buckets:** `employment` | `professional_development` | `launched_product`

**Kinds:** `job` | `achievement` | `artifact` (artifacts also set `artifact_type`)
