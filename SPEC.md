# TenderDoc Extractor

## Goal

Build a backend system that extracts product information from large government tender PDFs using a hybrid extraction pipeline.

The system should intelligently decide whether to:
- use rule-based extraction for simple pages
- use GPT-based extraction for complex pages

The project should focus on:
- cost optimization
- modular architecture
- clean TypeScript code
- beginner-friendly implementation
- production-inspired design

---

# Core Features

1. Read PDF files
2. Extract text page-by-page
3. Detect page complexity
4. Route pages to:
   - regex extraction
   - GPT extraction
5. Cache GPT responses
6. Export structured JSON output

---

# Tech Stack

- Node.js
- TypeScript
- OpenAI API
- pdf-parse

---

# Design Philosophy

- readable code over clever code
- modular but simple
- beginner-friendly architecture
- avoid overengineering
- interview-friendly implementation
- reusable modules

---

# Constraints

Do NOT:
- add frontend
- add Docker
- add Kubernetes
- add authentication
- add databases initially
- add microservices

---

# Expected Output Example

```json
{
  "tenderName": "Government IT Equipment Tender",
  "products": [
    {
      "name": "Laptop",
      "quantity": 10
    }
  ]
}