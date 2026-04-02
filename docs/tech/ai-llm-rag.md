---
title: LLM RAG Assistant
pageClass: page-projects
comment: false
---

# LLM RAG Assistant

A **retrieval-augmented generation (RAG)** style project: connect a large language model to a **private or curated document index** so answers are grounded in your sources instead of pure parametric memory.

## Planned architecture

- **Ingestion**: chunk Markdown/PDF, normalize metadata, embed with a text embedding model  
- **Vector store**: local (e.g. LanceDB, Chroma) or managed (Pinecone, etc.)  
- **Retriever**: hybrid search (BM25 + dense) optional for better recall  
- **Generator**: hosted API (OpenAI-compatible) or local LLM via Ollama/vLLM  

## Milestones

1. Minimal CLI: `ingest` + `ask` over a folder of notes  
2. Simple web UI with citations back to source chunks  
3. Evaluation: small fixed Q/A set and manual rubric  

## To document later

- Exact embedding model and dimension  
- Latency/cost tradeoffs and caching strategy  
