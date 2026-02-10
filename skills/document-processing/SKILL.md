---
name: document-processing
description: Turn unstructured documents into validated, auditable structured data with clear schemas and edge-case handling
---

# Document Processing

Use this skill when you need to turn unstructured or semi-structured documents (PDFs, scans, images, HTML, emails, DOCX) into structured outputs (JSON/CSV) with validation, provenance, and clear error handling.

## First Questions (Fail Fast)

Before proposing an approach, clarify:
- **Document types**: invoices, contracts, medical records, policies, resumes, reports, etc.
- **Input format**: native PDF vs scanned images; single vs multi-file batches; average pages.
- **Extraction goal**: which fields, tables, entities, and relationships matter.
- **Output contract**: JSON schema or CSV columns; required vs optional fields; nullability rules.
- **Quality bar**: acceptable error rate; whether human review is required; SLA and throughput.
- **Privacy constraints**: PII/PHI handling, retention limits, and redaction requirements.

If any of these are unknown, state assumptions explicitly and propose options.

## Output Contract (Recommended)

Prefer an explicit schema and provenance so consumers can trust the results.

### Suggested JSON shape

```json
{
  "document_id": "string",
  "document_type": "string",
  "source": {
    "filename": "string",
    "page_count": 12
  },
  "extracted": {
    "fields": {
      "vendor_name": "string",
      "invoice_number": "string",
      "total_amount": 123.45,
      "currency": "USD"
    },
    "tables": [
      {
        "name": "line_items",
        "rows": [
          { "description": "string", "quantity": 1, "unit_price": 1.23, "amount": 1.23 }
        ]
      }
    ]
  },
  "provenance": [
    {
      "path": "extracted.fields.total_amount",
      "evidence": "snippet or normalized text",
      "location": { "page": 2, "bbox": [0, 0, 0, 0] },
      "confidence": 0.92
    }
  ],
  "validation": {
    "status": "pass",
    "errors": []
  }
}
```

Rules:
- **Never invent missing facts**. Use `null` or omit optional fields, and add a validation error.
- **Normalize units and formats** (dates, currencies, decimals) and record the normalization.
- **Carry provenance** (page/section reference) for high-impact fields.

## Workflow

1. **Define the extraction schema**: required fields, types, enums, and table shapes.
2. **Segment the document**: pages/sections; detect headers/footers; isolate tables.
3. **Parse/OCR**:
   - Native PDFs: text extraction first, OCR only where needed.
   - Scans/images: OCR with layout awareness (reading order matters).
4. **Extract**:
   - Use deterministic parsing where possible (regexes, anchors, table parsers).
   - Use model-based extraction for ambiguous layouts, but validate aggressively.
5. **Validate**:
   - Type checks, required fields, cross-field constraints (totals, sums, date ranges).
   - Emit `validation.errors[]` with precise paths and user-actionable messages.
6. **Quality gates**:
   - If confidence is low or validation fails, route to **human review**.
7. **Export**:
   - JSON/CSV conforming to the agreed contract.
   - Include a stable `document_id` and processing metadata.

## Edge Cases Checklist

Handle explicitly:
- Rotated pages, mixed orientations, skewed scans
- Multi-column layouts, footnotes, wrapped table cells
- Split tables across pages, repeated headers, totals rows
- Missing currency symbols, thousands separators, negative numbers
- Multiple documents inside one PDF, or attachments embedded in emails
- Non-English text, locale-specific dates and decimals

## Security & Privacy

- Minimize retention: only store what the pipeline must keep.
- Avoid dumping full documents into logs; log hashes and minimal snippets.
- If the workflow touches sensitive data, pair this with `/security-review`.

## Related Skills

- `/plan` for clarifying requirements and sequencing delivery
- `/architect` for end-to-end pipeline design and interfaces
- `/iterative-retrieval` when context must be gathered progressively
- `/security-review` for threat modeling and sensitive-data handling

