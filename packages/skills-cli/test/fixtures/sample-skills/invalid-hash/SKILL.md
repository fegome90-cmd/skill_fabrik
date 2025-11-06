---
id: invalid-hash
version: 1.0.0
name: Invalid Hash Skill
summary: A skill with invalid hash format for testing
allowed-tools:
  - fs.read
---

# Invalid Hash Skill

This skill will be used to test hash validation when the snapshot
testing system manually sets an invalid hash in the manifest.

## Hash Validation Requirements

Valid hashes must be:
- 64 characters long
- Lowercase hexadecimal characters only
- SHA-256 format

## Invalid Hash Examples

- "short-hash" (too short)
- "INVALID-HASH" (uppercase letters)
- "not-hex-characters" (non-hex characters)
- "g".repeat(64) (invalid hex character)

## Testing Purpose

This skill is used to test:
- Hash format validation
- Hash length validation
- Hex character validation
- Hash error message accuracy
- Package integrity verification

Note: The invalid hash will be injected during testing by the
snapshot testing framework to simulate hash validation scenarios.