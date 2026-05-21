# Tasks: TenderDoc Extractor Implementation

## Module 1: Project Setup & Initialization
- [ ] Initialize Node.js project
  - [ ] Create `package.json` with scripts (`build`, `start`, `dev`)
  - [ ] Install dependencies: `pdf-parse`, `openai`, `dotenv`, `zod`
  - [ ] Install devDependencies: `typescript`, `@types/node`, `@types/pdf-parse`, `tsx`
- [ ] Set up TypeScript configuration
  - [ ] Create `tsconfig.json` with proper settings
- [ ] Set up environment variables
  - [ ] Create `.env.example` and `.env` template containing `OPENAI_API_KEY` and cache configuration

## Module 2: Shared Services & Types (`src/services`)
- [ ] Define global Types & Schemas
  - [ ] Create `Product` schema (`name`, `quantity`) and types
  - [ ] Define schemas for extraction results and routing metadata
- [ ] Implement Logging Service
  - [ ] Create standard logger with custom level formatting (info, debug, error, warn)
- [ ] Implement Configuration Service
  - [ ] Load and validate environment variables with fallback values

## Module 3: PDF Parsing Layer (`src/parser`)
- [ ] Implement page-by-page PDF parser
  - [ ] Create custom parser utility using `pdf-parse` with a `pagerender` callback to extract text separately for each page
  - [ ] Implement validation script to ensure correct page division on a sample PDF file

## Module 4: Page Classifier (`src/classifier`)
- [ ] Define page complexity classification criteria
  - [ ] Research and implement heuristic regexes for simple page structures (e.g. lists, key-value grids)
- [ ] Implement the Page Classifier
  - [ ] Create classifier module returning `SIMPLE` (for rule-based extraction) or `COMPLEX` (for LLM extraction)
  - [ ] Implement logging details explaining classification logic (e.g., token limit, match metrics)

## Module 5: Extraction Pipeline (`src/extractors`)
- [ ] Define common extractor interface/base class
- [ ] Implement Rule-Based Regex Extractor (`src/extractors/regexExtractor.ts`)
  - [ ] Write regex rules to extract simple tables/lists of product names and quantities
- [ ] Implement GPT-Based Extractor (`src/extractors/gptExtractor.ts`)
  - [ ] Set up OpenAI client connection
  - [ ] Design structured JSON prompt/schema using OpenAI SDK JSON response mode or tool-calling
  - [ ] Handle LLM rate limits, error retries, and schema fallback logic

## Module 6: Cost-Optimization Caching (`src/cache`)
- [ ] Implement Caching Service
  - [ ] Design JSON file-based cache in `.cache/` directory using unique content hashes as filenames
  - [ ] Implement cache lookup, creation, and conditional cache bypass flag (for testing)

## Module 7: Orchestrator & Final Output (`src/output` & `src/index.ts`)
- [ ] Implement Output Aggregator (`src/output`)
  - [ ] Merge per-page products, perform validation, and save final JSON
- [ ] Build Main Orchestrator (`src/index.ts`)
  - [ ] Accept input PDF path via command-line arguments
  - [ ] Pipeline routing: parse -> classify -> extract (cached/LLM/Regex) -> merge output
  - [ ] Output console run-summary with pipeline analytics (total pages, cache hits, Regex vs GPT routing counts, token cost estimator)

## Module 8: Verification & Testing
- [ ] Prepare test data/files
  - [ ] Create a mockup/sample PDF containing simple pages and complex pages
- [ ] Implement integration verification
  - [ ] Run full end-to-end extraction on mock PDFs
  - [ ] Assert final JSON output structure conforms to `SPEC.md` specification
