# Architecture Plan

## High-Level Pipeline

```
PDF File Path
     ↓
[Parser Layer]
     ↓
Array of Parsed Pages (pageNumber, text)
     ↓ (For each page)
[Classifier Layer] ──(complexity check)
     ├── SIMPLE ──> [Regex Extractor] ──> Products list
     └── COMPLEX ──> [Cache Layer] (Check hit)
                          ├── Hit ──> Return Cached Products
                          └── Miss ──> [GPT Extractor] ──> Save Cache & Return Products
                                             ↓
                                    [Output Layer] (Aggregate & Merge)
                                             ↓
                                     Final JSON Output
```

---

# Modules

## 1. Parser Layer
* **Responsibility**: Read a PDF file and extract text content page-by-page.
* **Input**: `pdfPath` (string)
* **Output**:
  ```json
  [
    {
      "pageNumber": 1,
      "text": "..."
    }
  ]
  ```

## 2. Classifier Layer
* **Responsibility**: Determine whether a page has simple formatting (e.g., standard tables/lines) or complex formatting (paragraphs/embedded tables).
* **Input**: `text` (string)
* **Output**: `"SIMPLE"` | `"COMPLEX"`

## 3. Extraction Layer
* **Responsibility**: Parse raw text to extract a list of products (name and quantity).

### 3.1 Regex Extractor
* **Responsibility**: Fast, local extraction for simple formats using regex.
* **Input**: `text` (string)
* **Output**:
  ```json
  [
    {
      "name": "Laptop",
      "quantity": 10
    }
  ]
  ```

### 3.2 GPT Extractor
* **Responsibility**: Extract products from complex formatting via OpenAI API using structured schemas.
* **Input**: `text` (string)
* **Output**:
  ```json
  [
    {
      "name": "Server Rack",
      "quantity": 3
    }
  ]
  ```

## 4. Cache Layer
* **Responsibility**: Save and retrieve GPT responses locally to save on API costs. Uses page text hash as key.
* **Input**: `text` (string)
* **Output**: Cached products array or `null` (cache miss).

## 5. Output Layer
* **Responsibility**: Combine products from all pages, consolidate duplicate items (sum quantities), and write the finalized structured JSON file.
* **Input**: `tenderName` (string), list of products from all pages
* **Output**: Finalized JSON file matching output specification.

## 6. Orchestrator
* **Responsibility**: CLI interface, pipeline runner, and console logger detailing run metrics (execution time, cost saved by cache, pages routed to regex vs GPT).