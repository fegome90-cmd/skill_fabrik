---
id: malformed-skill
version: invalid-version-format
name: Malformed Skill
summary: A skill with malformed manifest for error testing
allowed-tools: not-an-array-but-string
hash: this-is-not-a-64-char-hex-string
createdAt: not-a-valid-timestamp
scripts: this-should-be-an-object
invalid-field: this-field-should-not-exist
---

# Malformed Skill

This skill intentionally contains malformed manifest data to test
error handling and validation in the snapshot testing system.

## Expected Errors

This skill should produce the following validation errors:
- Invalid version format
- allowed-tools must be an array
- Invalid hash format
- Invalid timestamp format
- scripts must be an object
- Unexpected property: invalid-field

## Testing Purpose

This skill is used to test:
- Error detection in manifest validation
- Error message clarity and accuracy
- Graceful handling of malformed data
- Validation error reporting
- Test failure handling